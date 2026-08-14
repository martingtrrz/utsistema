import { useMemo, useState } from 'react'
import { GROUPS, STUDENTS } from '../data/students'
import { ENROLLMENTS } from '../data/enrollments'
import { Card, Table, Badge, Select, Input, StatCard } from '../components/ui'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Inscrito:           { bg: '#f0faf4', color: '#15803d' },
  'Pendiente de pago':{ bg: '#fff4dc', color: '#9a6a00' },
  Baja:               { bg: '#fde9e9', color: '#a33b3b' },
}

export default function Inscripciones() {
  const [grupo, setGrupo] = useState(GROUPS[0] ?? '')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const ids = new Set(STUDENTS.filter((s) => s.grupo === grupo).map((s) => s.id))
    return ENROLLMENTS.filter((e) => ids.has(e.studentId)).filter(
      (e) => query.trim() === '' ||
        e.materia.toLowerCase().includes(query.toLowerCase()) ||
        (STUDENTS.find((s) => s.id === e.studentId)?.nombre ?? '').toLowerCase().includes(query.toLowerCase())
    )
  }, [grupo, query, ENROLLMENTS.length])

  const studentOf = (id: string) => STUDENTS.find((s) => s.id === id)

  // Contadores por status para el grupo
  const inscritos   = rows.filter((e) => e.status === 'Inscrito').length
  const pendientes  = rows.filter((e) => e.status === 'Pendiente de pago').length
  const bajas       = rows.filter((e) => e.status === 'Baja').length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Inscripciones</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Estatus de inscripción por materia y periodo.
          </p>
        </div>
        <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Total inscripciones" value={rows.length}   icon="◍" tint="var(--secondary)" />
        <StatCard label="Inscritos"            value={inscritos}     icon="◔" tint="#f0faf4" />
        <StatCard label="Pendiente de pago"    value={pendientes}    icon="◈" tint="var(--gold-light)" />
        <StatCard label="Bajas"                value={bajas}         icon="◈" tint="#fde9e9" />
      </div>

      {/* Tabla */}
      <Card>
        <div style={{ marginBottom: 14 }}>
          <Input value={query} onChange={setQuery} placeholder="Buscar por alumno o materia…" style={{ minWidth: 280 }} />
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
            Sin inscripciones para este grupo en el periodo actual.
          </div>
        ) : (
          <Table headers={['Alumno', 'Expediente', 'Materia', 'Periodo', 'Status']}>
            {rows.map((e) => {
              const alumno = studentOf(e.studentId)
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                    {alumno?.nombre ?? e.studentId}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {alumno?.expediente ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{e.materia}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{e.periodo}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      text={e.status}
                      bg={STATUS_STYLE[e.status]?.bg ?? '#f2f5f6'}
                      color={STATUS_STYLE[e.status]?.color ?? '#333'}
                    />
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>
    </div>
  )
}
