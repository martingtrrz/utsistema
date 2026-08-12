import { useState } from 'react'
import { GROUPS } from '../data/students'
import { scheduleForGroup } from '../data/academic'
import { Card, Table, Select } from '../components/ui'

export default function Horarios() {
  const [grupo, setGrupo] = useState(GROUPS[0])
  const slots = scheduleForGroup(grupo)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Horarios</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Horario semanal por grupo.</p>
        </div>
        <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
      </div>
      <Card>
        <Table headers={['Día', 'Hora', 'Materia', 'Docente', 'Aula']}>
          {slots.map((s, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.dia}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{s.hora}</td>
              <td style={{ padding: '10px 12px' }}>{s.materia}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{s.docente}</td>
              <td style={{ padding: '10px 12px' }}>{s.aula}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
