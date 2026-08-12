import { useMemo, useState } from 'react'
import { GROUPS, STUDENTS } from '../data/students'
import { GRADES, letterGrade, LETTER_GRADE_INFO } from '../data/grades'
import { Card, Table, Badge, Select, Button, Input } from '../components/ui'

export default function Calificaciones() {
  const [grupo, setGrupo] = useState(GROUPS[0])
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const ids = new Set(STUDENTS.filter((s) => s.grupo === grupo).map((s) => s.id))
    return GRADES.filter((g) => ids.has(g.studentId)).filter(
      (g) => query.trim() === '' || g.materia.toLowerCase().includes(query.toLowerCase())
    )
  }, [grupo, query])

  const studentName = (id: string) => STUDENTS.find((s) => s.id === id)?.nombre ?? id
  const studentExp = (id: string) => STUDENTS.find((s) => s.id === id)?.expediente ?? ''

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Calificaciones</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Evidencias (20%) · Conocimiento (30%) · Desempeño (20%) · Actitud (10%) · Examen (20%)
          </p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 12, margin: '4px 0 0' }}>
            Escala: NA menor a 8.0 · SA 8.0–8.9 · DE 9.0–9.6 · AU 9.7–10
          </p>
        </div>
        <Button variant="primary" small>Guardar cambios</Button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
        <Input value={query} onChange={setQuery} placeholder="Buscar materia…" style={{ minWidth: 240 }} />
      </div>

      <Card>
        <Table headers={['Alumno', 'Materia', 'Evid.', 'Conoc.', 'Desemp.', 'Actitud', 'Examen', 'Final', '']}>
          {rows.map((g) => (
            <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px' }}>
                <b style={{ fontSize: 12.5 }}>{studentName(g.studentId)}</b>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{studentExp(g.studentId)}</div>
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{g.materia}</td>
              <td style={{ padding: '10px 12px' }}>{g.components.evidencias}</td>
              <td style={{ padding: '10px 12px' }}>{g.components.conocimiento}</td>
              <td style={{ padding: '10px 12px' }}>{g.components.desempeno}</td>
              <td style={{ padding: '10px 12px' }}>{g.components.actitud}</td>
              <td style={{ padding: '10px 12px' }}>{g.components.examen}</td>
              <td style={{ padding: '10px 12px', fontWeight: 700 }}>{g.final}</td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={letterGrade(g.final)} bg={LETTER_GRADE_INFO[letterGrade(g.final)].bg} color={LETTER_GRADE_INFO[letterGrade(g.final)].color} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
