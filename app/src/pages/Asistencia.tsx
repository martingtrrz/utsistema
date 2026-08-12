import { useMemo, useState } from 'react'
import { GROUPS, STUDENTS } from '../data/students'
import { ATTENDANCE } from '../data/attendance'
import { Card, Table, Badge, Select, StatCard, ProgressBar, Button } from '../components/ui'

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  Regular: { bg: '#f0faf4', color: '#15803d' },
  'En riesgo': { bg: '#fff4dc', color: '#9a6a00' },
  Crítico: { bg: '#fde9e9', color: '#a33b3b' },
}

export default function Asistencia() {
  const [grupo, setGrupo] = useState(GROUPS[0])

  const rows = useMemo(() => {
    const ids = new Set(STUDENTS.filter((s) => s.grupo === grupo).map((s) => s.id))
    return ATTENDANCE.filter((a) => ids.has(a.studentId))
  }, [grupo])

  const studentOf = (id: string) => STUDENTS.find((s) => s.id === id)!
  const promedio = Math.round(rows.reduce((a, r) => a + r.porcentaje, 0) / (rows.length || 1))
  const faltas = rows.reduce((a, r) => a + r.faltas, 0)
  const retardos = rows.reduce((a, r) => a + r.retardos, 0)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Asistencia</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Seguimiento de asistencia por grupo.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
          <Button variant="primary" small>+ Registrar asistencia</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Promedio" value={`${promedio}%`} icon="◷" tint="var(--secondary)" />
        <StatCard label="Faltas" value={faltas} icon="◈" tint="#fde9e9" />
        <StatCard label="Retardos" value={retardos} icon="⏱️" tint="var(--gold-light)" />
        <StatCard label="Alumnos" value={rows.length} icon="◍" tint="#eff6ff" />
      </div>

      <Card>
        <Table headers={['Alumno', 'Asistencias', 'Faltas', 'Retardos', '%', 'Estado']}>
          {rows.map((r) => (
            <tr key={r.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{studentOf(r.studentId).nombre}</td>
              <td style={{ padding: '10px 12px' }}>{r.asistencias}</td>
              <td style={{ padding: '10px 12px' }}>{r.faltas}</td>
              <td style={{ padding: '10px 12px' }}>{r.retardos}</td>
              <td style={{ padding: '10px 12px', width: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={r.porcentaje} />
                  </div>
                  <span style={{ fontSize: 11.5 }}>{r.porcentaje}%</span>
                </div>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={r.estado} bg={ESTADO_STYLE[r.estado].bg} color={ESTADO_STYLE[r.estado].color} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
