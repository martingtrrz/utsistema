import { SUBJECTS } from '../data/academic'
import { Card, Table, Button } from '../components/ui'

export default function Materias() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Materias</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Catálogo de asignaturas, docentes y grupos.</p>
        </div>
        <Button variant="primary" small>+ Nueva materia</Button>
      </div>
      <Card>
        <Table headers={['Clave', 'Materia', 'Grupo', 'Docente', 'Créditos']}>
          {SUBJECTS.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{s.id}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.nombre}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{s.grupo}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{s.docente}</td>
              <td style={{ padding: '10px 12px' }}>{s.creditos}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
