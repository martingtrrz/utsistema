import { useMemo, useState } from 'react'
import { GROUPS, STUDENTS } from '../data/students'
import { ENROLLMENTS } from '../data/enrollments'
import { Card, Table, Badge, Select, Input } from '../components/ui'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Inscrito: { bg: '#f0faf4', color: '#15803d' },
  'Pendiente de pago': { bg: '#fff4dc', color: '#9a6a00' },
  Baja: { bg: '#fde9e9', color: '#a33b3b' },
}

export default function Inscripciones() {
  const [grupo, setGrupo] = useState(GROUPS[0])
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const ids = new Set(STUDENTS.filter((s) => s.grupo === grupo).map((s) => s.id))
    return ENROLLMENTS.filter((e) => ids.has(e.studentId)).filter(
      (e) => query.trim() === '' || e.materia.toLowerCase().includes(query.toLowerCase())
    )
  }, [grupo, query])

  const studentOf = (id: string) => STUDENTS.find((s) => s.id === id)!

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>Inscripciones</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Estatus de inscripción por materia y periodo.</p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
        <Input value={query} onChange={setQuery} placeholder="Buscar materia…" style={{ minWidth: 240 }} />
      </div>
      <Card>
        <Table headers={['Alumno', 'Expediente', 'Materia', 'Periodo', 'Status']}>
          {rows.map((e) => (
            <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{studentOf(e.studentId).nombre}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{studentOf(e.studentId).expediente}</td>
              <td style={{ padding: '10px 12px' }}>{e.materia}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{e.periodo}</td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={e.status} bg={STATUS_STYLE[e.status].bg} color={STATUS_STYLE[e.status].color} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
