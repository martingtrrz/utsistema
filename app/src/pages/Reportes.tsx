import { STUDENTS, GROUPS } from '../data/students'
import { GROUPS_DATA, groupAverage, groupAttendance } from '../data/groups'
import { GRADES, letterGrade } from '../data/grades'
import { TEACHERS } from '../data/teachers'
import { Card, Button } from '../components/ui'

// ─── Utilidad para generar y descargar un CSV ────────────────────────────────
function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const content = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Generadores de cada reporte ─────────────────────────────────────────────
function exportAlumnos() {
  downloadCSV('alumnos.csv',
    STUDENTS.map((s) => [s.expediente, s.nombre, s.grupo, s.carrera, s.status, String(s.promedio), String(s.asistencia)]),
    ['Expediente', 'Nombre', 'Grupo', 'Carrera', 'Status', 'Promedio', 'Asistencia%']
  )
}

function exportGrupos() {
  downloadCSV('grupos.csv',
    GROUPS.map((g) => {
      const info = GROUPS_DATA.find((gd) => gd.id === g)
      return [g, info?.nombre ?? g, info?.carrera ?? '', info?.cuatrimestre ?? '', String(groupAverage(g).toFixed(1)), String(groupAttendance(g)) + '%']
    }),
    ['ID', 'Grupo', 'Carrera', 'Cuatrimestre', 'Promedio', 'Asistencia%']
  )
}

function exportCalificaciones() {
  downloadCSV('calificaciones.csv',
    GRADES.map((g) => {
      const alumno = STUDENTS.find((s) => s.id === g.studentId)
      return [
        alumno?.expediente ?? '', alumno?.nombre ?? g.studentId, alumno?.grupo ?? '',
        g.materia, g.parcial,
        String(g.components.evidencias), String(g.components.conocimiento),
        String(g.components.desempeno), String(g.components.actitud), String(g.components.examen),
        String(g.final), letterGrade(g.final),
      ]
    }),
    ['Expediente', 'Alumno', 'Grupo', 'Materia', 'Parcial', 'Evidencias', 'Conocimiento', 'Desempeño', 'Actitud', 'Examen', 'Final', 'Letra']
  )
}

function exportAsistencia() {
  downloadCSV('asistencia.csv',
    STUDENTS.map((s) => [s.expediente, s.nombre, s.grupo, String(s.asistencia) + '%']),
    ['Expediente', 'Alumno', 'Grupo', 'Asistencia%']
  )
}

function exportDocentes() {
  downloadCSV('docentes.csv',
    TEACHERS.map((t) => [t.id, t.nombre, t.grado, t.email, String(t.grupos?.length ?? 0), (t.materias ?? []).join(' | ')]),
    ['ID', 'Nombre', 'Grado', 'Email', 'Grupos', 'Materias']
  )
}

function exportAcademico() {
  const promedioGeneral = STUDENTS.length
    ? (STUDENTS.reduce((a, s) => a + s.promedio, 0) / STUDENTS.length).toFixed(1)
    : '0'
  const asistenciaGeneral = STUDENTS.length
    ? Math.round(STUDENTS.reduce((a, s) => a + s.asistencia, 0) / STUDENTS.length) + '%'
    : '0%'
  downloadCSV('academico_general.csv',
    [
      ['Total alumnos',         String(STUDENTS.length)],
      ['Alumnos activos',       String(STUDENTS.filter((s) => s.status === 'Activo').length)],
      ['Total docentes',        String(TEACHERS.length)],
      ['Total grupos',          String(GROUPS.length)],
      ['Promedio institucional',promedioGeneral],
      ['Asistencia institucional', asistenciaGeneral],
      ['Total registros calificaciones', String(GRADES.length)],
      ...GROUPS.map((g) => [g, `Promedio ${groupAverage(g).toFixed(1)}`, `Asistencia ${groupAttendance(g)}%`]),
    ],
    ['Indicador', 'Valor', 'Detalle']
  )
}

// ─── Config de reportes ───────────────────────────────────────────────────────
const REPORTS = [
  { id: 'alumnos',        title: 'Reporte de alumnos',        desc: 'Listado completo con expediente, grupo, promedio y asistencia.',    fn: exportAlumnos,        count: () => STUDENTS.length,  unit: 'alumnos'     },
  { id: 'grupos',         title: 'Reporte de grupos',         desc: 'Indicadores de desempeño y asistencia promedio por grupo.',         fn: exportGrupos,         count: () => GROUPS.length,    unit: 'grupos'      },
  { id: 'calificaciones', title: 'Reporte de calificaciones', desc: 'Concentrado de evaluación por alumno, materia y parcial.',          fn: exportCalificaciones, count: () => GRADES.length,    unit: 'registros'   },
  { id: 'asistencia',     title: 'Reporte de asistencia',     desc: 'Porcentaje de asistencia por alumno y grupo.',                     fn: exportAsistencia,     count: () => STUDENTS.length,  unit: 'alumnos'     },
  { id: 'docentes',       title: 'Reporte de docentes',       desc: 'Directorio académico con carga y especialidad.',                   fn: exportDocentes,       count: () => TEACHERS.length,  unit: 'docentes'    },
  { id: 'academico',      title: 'Reporte académico general', desc: 'Indicadores institucionales del periodo, útil para dirección.',     fn: exportAcademico,      count: () => GROUPS.length,    unit: 'grupos'      },
]

export default function Reportes() {
  const promedioGeneral = STUDENTS.length
    ? (STUDENTS.reduce((a, s) => a + s.promedio, 0) / STUDENTS.length).toFixed(1)
    : '—'
  const asistenciaGeneral = STUDENTS.length
    ? Math.round(STUDENTS.reduce((a, s) => a + s.asistencia, 0) / STUDENTS.length)
    : 0

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>Reportes</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
          Genera y descarga reportes en formato CSV con los datos actuales del sistema.
        </p>
      </div>

      {/* Tarjetas de reportes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {REPORTS.map((r) => {
          const count = r.count()
          return (
            <Card key={r.id}>
              <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>{r.title}</h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 12.5, lineHeight: 1.5, minHeight: 40, margin: '0 0 12px' }}>{r.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                  {count} {r.unit}
                </span>
                <Button
                  variant="secondary"
                  small
                  disabled={count === 0}
                  onClick={r.fn}
                >
                  Exportar CSV
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Vista previa académica */}
      <Card>
        <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Vista previa · Académico general</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Alumnos',              value: STUDENTS.length },
            { label: 'Docentes',             value: TEACHERS.length },
            { label: 'Grupos',               value: GROUPS.length   },
            { label: 'Promedio institucional',value: promedioGeneral },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8fafb', borderRadius: 10, padding: 14 }}>
              <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10 }}>{label}</small>
              <b style={{ fontSize: 18 }}>{value}</b>
            </div>
          ))}
        </div>

        {/* Tabla resumen por grupo */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'grid', gap: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            {['Grupo', 'Alumnos', 'Promedio', 'Asistencia'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{h}</span>
            ))}
          </div>
          {GROUPS.map((g) => {
            const info    = GROUPS_DATA.find((gd) => gd.id === g)
            const total   = STUDENTS.filter((s) => s.grupo === g).length
            const avg     = groupAverage(g)
            const att     = groupAttendance(g)
            return (
              <div key={g} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{info?.nombre ?? g}</span>
                <span style={{ color: 'var(--muted-foreground)' }}>{total}</span>
                <span style={{ fontWeight: 600, color: avg >= 9 ? '#15803d' : avg >= 8 ? '#9a6a00' : '#a33b3b' }}>{avg.toFixed(1)}</span>
                <span style={{ fontWeight: 600, color: att >= 85 ? '#15803d' : att >= 70 ? '#9a6a00' : '#a33b3b' }}>{att}%</span>
              </div>
            )
          })}
        </div>

        {/* Alumnos en riesgo */}
        {STUDENTS.filter((s) => s.promedio < 8 || s.asistencia < 80).length > 0 && (
          <div style={{ marginTop: 16, padding: 14, background: '#fde9e9', borderRadius: 10, border: '1px solid #f5c2c2' }}>
            <b style={{ fontSize: 13, color: '#a33b3b' }}>
              Alumnos en riesgo: {STUDENTS.filter((s) => s.promedio < 8 || s.asistencia < 80).length}
            </b>
            <p style={{ fontSize: 12, color: '#a33b3b', margin: '4px 0 0' }}>
              Promedio menor a 8.0 o asistencia menor a 80%. Consulta el módulo de Alumnos para más detalle.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
