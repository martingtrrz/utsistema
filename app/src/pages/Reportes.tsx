import { STUDENTS, GROUPS } from '../data/students'
import { groupAverage, groupAttendance } from '../data/groups'
import { TEACHERS } from '../data/teachers'
import { Card, Button } from '../components/ui'

const REPORTS = [
  { id: 'alumnos', title: 'Reporte de alumnos', desc: 'Listado completo de alumnos por grupo, status y promedio.' },
  { id: 'grupos', title: 'Reporte de grupos', desc: 'Indicadores de desempeño y asistencia por grupo.' },
  { id: 'calificaciones', title: 'Reporte de calificaciones', desc: 'Concentrado de evaluación por parcial.' },
  { id: 'asistencia', title: 'Reporte de asistencia', desc: 'Faltas, retardos y porcentaje por alumno.' },
  { id: 'docentes', title: 'Reporte de docentes', desc: 'Carga académica y grupos asignados.' },
  { id: 'academico', title: 'Reporte académico general', desc: 'Indicadores institucionales del periodo.' },
]

export default function Reportes() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>Reportes</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Reportes académicos y administrativos disponibles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {REPORTS.map((r) => (
          <Card key={r.id}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{r.title}</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 12.5, lineHeight: 1.5, minHeight: 40 }}>{r.desc}</p>
            <Button variant="secondary">↥ Exportar</Button>
          </Card>
        ))}
      </div>

      <Card>
        <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Vista previa · Académico general</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <MiniStat label="Alumnos" value={STUDENTS.length} />
          <MiniStat label="Docentes" value={TEACHERS.length} />
          <MiniStat label="Grupos" value={GROUPS.length} />
          <MiniStat label="Promedio institucional" value={(STUDENTS.reduce((a, s) => a + s.promedio, 0) / STUDENTS.length).toFixed(1)} />
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          {GROUPS.map((g) => (
            <div key={g} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{g}</span>
              <span style={{ color: 'var(--muted-foreground)' }}>
                Promedio {groupAverage(g).toFixed(1)} · Asistencia {groupAttendance(g)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#f8fafb', borderRadius: 10, padding: 14 }}>
      <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10 }}>{label}</small>
      <b style={{ fontSize: 18 }}>{value}</b>
    </div>
  )
}
