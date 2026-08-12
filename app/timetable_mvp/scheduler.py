import os
import mysql.connector
import pandas as pd
from ortools.sat.python import cp_model
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

DAY_ORDER = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}

def load_from_mysql():
    """Carga los datos desde la base de datos MySQL usando variables de entorno."""
    host = os.environ.get('DB_HOST', 'localhost')
    port = int(os.environ.get('DB_PORT', 3306))
    user = os.environ.get('DB_USER', 'root')
    password = os.environ.get('DB_PASSWORD', '')
    database = os.environ.get('DB_NAME', 'utslrc_sistema')

    conn = mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database
    )
    courses = pd.read_sql("""
        SELECT 
            id AS course_id, 
            nombre AS course_name, 
            teacher_id AS instructor_id, 
            group_id AS grupo_id, 
            `horas por cuatrimestre` AS horas_cuatrimestre,
            sessions_per_week, 
            required_room 
        FROM subjects
    """, conn)
    rooms = pd.read_sql("SELECT * FROM rooms", conn)
    instructors = pd.read_sql("""
        SELECT 
            id AS instructor_id, 
            nombre AS name, 
            available_slots 
        FROM teachers
    """, conn)
    timeslots = pd.read_sql("SELECT * FROM timeslots", conn)
    groups = pd.read_sql("SELECT id AS grupo_id, nombre AS grupo_name FROM `groups`", conn)
    students = pd.read_sql("SELECT id AS student_id, group_id AS grupo_id FROM students", conn)
    conn.close()
    return courses, rooms, instructors, timeslots, groups, students

def save_to_mysql(schedule_df):
    """Guarda el horario generado en la tabla schedule_slots de MySQL."""
    day_map = {
        "Mon": "Lunes",
        "Tue": "Martes",
        "Wed": "Miércoles",
        "Thu": "Jueves",
        "Fri": "Viernes",
        "Sat": "Sábado",
        "Sun": "Domingo"
    }

    host = os.environ.get('DB_HOST', 'localhost')
    port = int(os.environ.get('DB_PORT', 3306))
    user = os.environ.get('DB_USER', 'root')
    password = os.environ.get('DB_PASSWORD', '')
    database = os.environ.get('DB_NAME', 'utslrc_sistema')

    conn = mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database
    )
    cursor = conn.cursor()

    try:
        # Eliminar horarios anteriores
        print("Eliminando horarios existentes en la tabla schedule_slots...")
        cursor.execute("DELETE FROM schedule_slots")

        # Insertar los nuevos
        print("Insertando nuevos horarios...")
        insert_query = """
            INSERT INTO schedule_slots (group_id, dia, hora, subject_id, aula)
            VALUES (%s, %s, %s, %s, %s)
        """
        
        records = []
        for _, row in schedule_df.iterrows():
            dia_es = day_map.get(row["day"], row["day"])
            hora_rango = f"{row['start']} – {row['end']}"
            records.append((
                row["grupo_id"],
                dia_es,
                hora_rango,
                row["course_id"],
                row["room_id"]
            ))

        cursor.executemany(insert_query, records)
        conn.commit()
        print(f"Se guardaron correctamente {len(records)} registros en schedule_slots.")
    except Exception as e:
        conn.rollback()
        print(f"Error al guardar en base de datos: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(base_dir, "output", "schedule.csv")

    # Cargar datos desde MySQL
    courses, rooms, instructors, timeslots, groups, students = load_from_mysql()

    def clean_time(val):
        if pd.isnull(val):
            return ""
        if isinstance(val, pd.Timedelta) or hasattr(val, 'total_seconds'):
            tot = int(val.total_seconds())
            h = tot // 3600
            m = (tot % 3600) // 60
            return f"{h:02d}:{m:02d}"
        if hasattr(val, 'strftime'):
            return val.strftime("%H:%M")
        s = str(val)
        if "days" in s:
            s = s.split("days")[-1].strip()
        elif "day" in s:
            s = s.split("day")[-1].strip()
        parts = s.split(":")
        if len(parts) >= 2:
            h = parts[0].strip()[-2:].zfill(2)
            m = parts[1].strip().zfill(2)
            return f"{h}:{m}"
        return s

    timeslots["start"] = timeslots["start"].apply(clean_time)
    timeslots["end"] = timeslots["end"].apply(clean_time)

    # Orden explícito de los timeslots por día y hora de inicio.
    # Esto garantiza que slots_by_day quede en orden cronológico real,
    # sin depender de que el slot_id (S1, S2, ...) coincida con el orden
    # de horas si la tabla `timeslots` llega a cambiar.
    timeslots["_day_order"] = timeslots["day"].map(DAY_ORDER).fillna(99)
    timeslots = timeslots.sort_values(["_day_order", "start"]).reset_index(drop=True)
    timeslots = timeslots.drop(columns="_day_order")

    print(f"Cursos: {len(courses)}")
    print(f"Aulas: {list(rooms['room_id'])}")
    print(f"Instructores: {len(instructors)}")
    print(f"Slots: {len(timeslots)}")
    print(f"Grupos: {list(groups['grupo_id'])}")
    print(f"Estudiantes: {len(students)}")

    # Diccionarios
    inst_name = {row["instructor_id"]: row["name"] for _, row in instructors.iterrows()}
    grupo_name = {row["grupo_id"]: row["grupo_name"] for _, row in groups.iterrows()}
    course_instructor = {row["course_id"]: row["instructor_id"] for _, row in courses.iterrows()}
    course_grupo = {row["course_id"]: row["grupo_id"] for _, row in courses.iterrows()}
    course_name = {row["course_id"]: row["course_name"] for _, row in courses.iterrows()}
    # Calcular las sesiones por semana dividiendo las horas por cuatrimestre entre 16
    sessions_per_week = {}
    for _, row in courses.iterrows():
        horas_total = int(row.get("horas_cuatrimestre") or 0)
        if horas_total > 0:
            val = round(horas_total / 16.0)
            sessions_per_week[row["course_id"]] = max(1, val)
        else:
            sessions_per_week[row["course_id"]] = int(row.get("sessions_per_week") or 0)
    room_capacity = {row["room_id"]: int(row["capacity"]) for _, row in rooms.iterrows()}

    group_size = students.groupby("grupo_id")["student_id"].nunique().to_dict()
    print(f"Tamaño de grupos: {group_size}")

    # Aulas permitidas por curso (usando required_room)
    room_ids = list(rooms["room_id"])
    generic_rooms = [r for r in room_ids if r.isdigit()]
    lab_cisco = "LABORATORIO CISCO"
    lab_iot = "LABORATORIO IOT"
    lab_dev = "LABORATORIO DE DESARROLLO"
    required_labs = [lab_cisco, lab_iot, lab_dev]

    course_allowed_rooms = {}
    for _, row in courses.iterrows():
        cid = row["course_id"]
        req = row["required_room"]
        if req == "LABORATORIO CISCO":
            course_allowed_rooms[cid] = [lab_cisco]
        elif req == "LABORATORIO IOT":
            course_allowed_rooms[cid] = [lab_iot]
        elif req == "LABORATORIO DESARROLLO":
            course_allowed_rooms[cid] = [lab_dev]
        else:
            course_allowed_rooms[cid] = generic_rooms
        if not course_allowed_rooms[cid]:
            raise RuntimeError(f"No hay aulas disponibles para el curso {cid} ({row['course_name']})")

    print(f"Aulas teóricas: {generic_rooms}")
    print(f"Laboratorios: {required_labs}")

    # Generar sesiones
    sessions = []
    for _, row in courses.iterrows():
        cid = row["course_id"]
        n = sessions_per_week[cid]
        for i in range(n):
            sessions.append({
                "session_id": f"{cid}_s{i+1}",
                "course_id": cid,
                "instructor_id": course_instructor[cid],
                "grupo_id": course_grupo[cid]
            })

    session_ids = [s["session_id"] for s in sessions]
    session_course = {s["session_id"]: s["course_id"] for s in sessions}
    session_instructor = {s["session_id"]: s["instructor_id"] for s in sessions}
    session_grupo = {s["session_id"]: s["grupo_id"] for s in sessions}
    print(f"Sesiones totales: {len(session_ids)}")

    # Disponibilidad de docentes
    all_slot_ids = set(timeslots["slot_id"])
    inst_avail = {}
    for _, row in instructors.iterrows():
        avail = row["available_slots"]
        if pd.isnull(avail) or not avail:
            inst_avail[row["instructor_id"]] = all_slot_ids
        else:
            inst_avail[row["instructor_id"]] = set(str(avail).split("|"))


    # Modelo
    model = cp_model.CpModel()

    # ---------- Elección de aula por curso ----------
    course_room_choice = {}
    for cid in courses["course_id"]:
        allowed = course_allowed_rooms[cid]
        choice_vars = {}
        for r in allowed:
            choice_vars[r] = model.NewBoolVar(f"room_choice_{cid}_{r}")
        model.Add(sum(choice_vars.values()) == 1)
        course_room_choice[cid] = choice_vars

    # ---------- Variables de asignación (sesión, slot, aula) ----------
    x = {}
    total_vars = 0

    for sess in sessions:
        sid = sess["session_id"]
        inst = sess["instructor_id"]
        g = sess["grupo_id"]
        size = group_size.get(g, 0)
        cid = sess["course_id"]
        allowed_rooms = course_allowed_rooms[cid]

        for t in timeslots["slot_id"]:
            if t not in inst_avail.get(inst, set()):
                continue
            for r in allowed_rooms:
                if room_capacity[r] < size:
                    continue
                var = model.NewBoolVar(f"x_{sid}_{t}_{r}")
                x[(sid, t, r)] = var
                total_vars += 1
                model.Add(var <= course_room_choice[cid][r])

    print(f"Variables creadas: {total_vars}")

    # ---------- Restricciones básicas ----------
    for sid in session_ids:
        vars_sid = [x[k] for k in x if k[0] == sid]
        if not vars_sid:
            raise RuntimeError(f"No hay opciones para la sesión {sid}")
        model.Add(sum(vars_sid) == 1)

    for t in timeslots["slot_id"]:
        for r in room_ids:
            vars_tr = [x[k] for k in x if k[1] == t and k[2] == r]
            if vars_tr:
                model.Add(sum(vars_tr) <= 1)

    for t in timeslots["slot_id"]:
        for inst in instructors["instructor_id"]:
            vars_it = [x[k] for k in x if k[1] == t and session_instructor[k[0]] == inst]
            if vars_it:
                model.Add(sum(vars_it) <= 1)

    for t in timeslots["slot_id"]:
        for g in groups["grupo_id"]:
            vars_gt = [x[k] for k in x if k[1] == t and session_grupo[k[0]] == g]
            if vars_gt:
                model.Add(sum(vars_gt) <= 1)

    # ---------- Variables de actividad por grupo y día ----------
    group_active = {g: {} for g in groups["grupo_id"]}
    for g in groups["grupo_id"]:
        for t in timeslots["slot_id"]:
            vars_for_group_slot = [x[(sid, t2, r)] for (sid, t2, r), var in x.items()
                                   if t2 == t and session_grupo[sid] == g]
            if vars_for_group_slot:
                act = model.NewBoolVar(f"group_active_{g}_{t}")
                group_active[g][t] = act
                model.Add(sum(vars_for_group_slot) == act)
            else:
                group_active[g][t] = None

    # ---------- Variables de actividad por instructor ----------
    inst_active = {inst: {} for inst in instructors["instructor_id"]}
    for inst in instructors["instructor_id"]:
        for t in timeslots["slot_id"]:
            vars_for_inst_slot = [x[(sid, t2, r)] for (sid, t2, r), var in x.items()
                                  if t2 == t and session_instructor[sid] == inst]
            if vars_for_inst_slot:
                act = model.NewBoolVar(f"inst_active_{inst}_{t}")
                inst_active[inst][t] = act
                model.Add(sum(vars_for_inst_slot) == act)
            else:
                inst_active[inst][t] = None

    # ---------- Restricciones de compacidad ----------
    slots_by_day = {}
    for _, row in timeslots.iterrows():
        day = row["day"]
        slot_id = row["slot_id"]
        slots_by_day.setdefault(day, []).append(slot_id)

    def add_compactness(active_dict, entity_type, entity_id):
        """Evita huecos entre clases activas, sin forzar dónde empieza el bloque."""
        for day, day_slots in slots_by_day.items():
            day_act = [(t, active_dict.get(t)) for t in day_slots if active_dict.get(t) is not None]
            if len(day_act) < 2:
                continue
            for i in range(len(day_act)):
                for j in range(i+2, len(day_act)):
                    slot_i = day_act[i][0]
                    slot_j = day_act[j][0]
                    for k in range(i+1, j):
                        slot_k = day_act[k][0]
                        model.Add(day_act[i][1] + day_act[j][1] <= 1 + day_act[k][1])

    def add_start_of_day_compactness(active_dict):
        """
        Si un slot está activo, el slot inmediatamente anterior del mismo
        día también debe estarlo. Esto obliga a que el bloque de clases
        arranque en el primer horario del día (7:00 am) y de paso
        garantiza que no haya huecos, por lo que reemplaza a
        add_compactness para la entidad a la que se aplique.
        """
        for day, day_slots in slots_by_day.items():
            for idx in range(1, len(day_slots)):
                cur = active_dict.get(day_slots[idx])
                prev = active_dict.get(day_slots[idx - 1])
                if cur is None:
                    continue
                if prev is None:
                    # el slot anterior ni siquiera tiene variable posible
                    # (nadie puede dar clase ahí), así que este tampoco puede activarse
                    model.Add(cur == 0)
                else:
                    model.Add(cur <= prev)

    # Grupos: se fuerza a que el bloque de clases inicie a las 7:00 am
    for g in groups["grupo_id"]:
        add_start_of_day_compactness(group_active[g])

    # Docentes: solo se evita que queden huecos entre sus clases,
    # sin forzar que su bloque empiece a las 7am (un mismo profe puede
    # dar clase a distintos grupos en distintos horarios el mismo día)
    for inst in instructors["instructor_id"]:
        add_compactness(inst_active[inst], "instructor", inst)

    # ---------- Restricción: máximo 2 sesiones por curso y día ----------
    for cid in courses["course_id"]:
        sessions_for_course = [s for s in sessions if s["course_id"] == cid]
        for day, day_slots in slots_by_day.items():
            day_active = {}
            for slot in day_slots:
                vars_for_slot = []
                for sess in sessions_for_course:
                    sid = sess["session_id"]
                    for r in course_allowed_rooms[cid]:
                        if (sid, slot, r) in x:
                            vars_for_slot.append(x[(sid, slot, r)])
                if vars_for_slot:
                    day_active[slot] = model.NewBoolVar(f"active_{cid}_{day}_{slot}")
                    model.Add(sum(vars_for_slot) == day_active[slot])

            active_slots = [(slot, day_active[slot]) for slot in day_slots if slot in day_active]
            if len(active_slots) < 2:
                continue

            model.Add(sum(active for _, active in active_slots) <= 2)
            for i in range(len(active_slots)):
                for j in range(i+2, len(active_slots)):
                    slot_i = active_slots[i][0]
                    slot_j = active_slots[j][0]
                    model.Add(day_active[slot_i] + day_active[slot_j] <= 1)

    # ---------- Resolver ----------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    print("Resolviendo...")
    status = solver.Solve(model)

    status_map = {
        cp_model.OPTIMAL: "OPTIMAL",
        cp_model.FEASIBLE: "FEASIBLE",
        cp_model.INFEASIBLE: "INFEASIBLE",
        cp_model.MODEL_INVALID: "MODEL_INVALID",
        cp_model.UNKNOWN: "UNKNOWN"
    }
    print(f"Estado del solver: {status_map.get(status, 'DESCONOCIDO')}")

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        print(f"Tiempo: {solver.WallTime():.2f}s")
        print(f"Conflictos: {solver.NumConflicts()}")
        print(f"Ramas: {solver.NumBranches()}")
        raise RuntimeError("No se encontró un horario factible.")

    # ---------- Construir salida ----------
    rows = []
    for (sid, t, r), var in x.items():
        if solver.Value(var) == 1:
            cid = session_course[sid]
            g = session_grupo[sid]
            inst = session_instructor[sid]
            day = timeslots.loc[timeslots["slot_id"] == t, "day"].iloc[0]
            start = timeslots.loc[timeslots["slot_id"] == t, "start"].iloc[0]
            end = timeslots.loc[timeslots["slot_id"] == t, "end"].iloc[0]
            session_num = sid.split('_s')[-1]
            rows.append({
                "course_id": cid,
                "course_name": course_name[cid],
                "instructor_id": inst,
                "instructor_name": inst_name.get(inst, inst),
                "grupo_id": g,
                "grupo_name": grupo_name.get(g, g),
                "room_id": r,
                "slot_id": t,
                "day": day,
                "start": start,
                "end": end,
                "session_number": session_num,
                "group_size": group_size.get(g, 0),
            })

    schedule_df = pd.DataFrame(rows)
    schedule_df["_day_order"] = schedule_df["day"].map(DAY_ORDER).fillna(99)
    schedule_df = schedule_df.sort_values(["grupo_id", "_day_order", "start"]).drop(columns="_day_order").reset_index(drop=True)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    schedule_df.to_csv(output_path, index=False)
    print(f"Horario exportado a {output_path}. Total: {len(rows)} sesiones.")

    # Guardar en MySQL
    save_to_mysql(schedule_df)

if __name__ == "__main__":
    main()