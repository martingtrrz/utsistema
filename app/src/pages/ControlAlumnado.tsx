import { useMemo, useState } from 'react'
import { ALUMNOS, GRUPOS, type Alumno } from '../data/alumnos'
import { Card, StatCard, Badge, Button, Input, Table, Tabs } from '../components/ui'

const STATUS_STYLE: Record<Alumno['status'], { bg: string; color: string }> = {
  Activo: { bg: '#f0faf4', color: '#15803d' },
  'Baja temporal': { bg: '#fff7ed', color: '#c2410c' },
  Egresado: { bg: '#eff6ff', color: '#1d4ed8' },
}

export default function ControlAlumnado({ initialGrupo }: { initialGrupo?: string } = {}) {
  const [query, setQuery] = useState('')
  const [grupoFilter, setGrupoFilter] = useState<string>(initialGrupo ?? 'Todos')
  const [selected, setSelected] = useState<Alumno | null>(null)

  const filtered = useMemo(() => {
    return ALUMNOS.filter((a) => {
      const matchesGroup = grupoFilter === 'Todos' || a.grupo === grupoFilter
      const matchesQuery =
        query.trim() === '' ||
        a.nombre.toLowerCase().includes(query.toLowerCase()) ||
        a.expediente.includes(query)
      return matchesGroup && matchesQuery
    })
  }, [query, grupoFilter])

  const counts = GRUPOS.map((g) => ({ grupo: g, total: ALUMNOS.filter((a) => a.grupo === g).length }))

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Alumnos totales" value={ALUMNOS.length} icon="◍" tint="var(--secondary)" />
        {counts.map((c) => (
          <StatCard key={c.grupo} label={c.grupo} value={c.total} icon="▥" tint="var(--gold-light)" />
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input value={query} onChange={setQuery} placeholder="Buscar por nombre o expediente…" style={{ minWidth: 260 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['Todos', ...GRUPOS].map((g) => (
              <button
                key={g}
                onClick={() => setGrupoFilter(g)}
                style={{
                  padding: '7px 13px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  background: grupoFilter === g ? 'var(--primary)' : '#fff',
                  color: grupoFilter === g ? '#fff' : 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {g}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted-foreground)' }}>
            {filtered.length} de {ALUMNOS.length} alumnos
          </div>
        </div>

        <Table headers={['No.', 'Expediente', 'Nombre', 'Grupo', 'Status', '']}>
          {filtered.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.no}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12.5 }}>{a.expediente}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{a.nombre}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.grupo}</td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={a.status} bg={STATUS_STYLE[a.status].bg} color={STATUS_STYLE[a.status].color} />
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <Button variant="ghost" small onClick={() => setSelected(a)}>
                  Ver expediente →
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {selected && <AlumnoDrawer alumno={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function AlumnoDrawer({ alumno, onClose }: { alumno: Alumno; onClose: () => void }) {
  const [tab, setTab] = useState('resumen')
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.4)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, maxWidth: '92vw', background: '#fff', height: '100%', overflowY: 'auto', padding: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{alumno.nombre}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
              Exp. {alumno.expediente} · {alumno.grupo}
            </div>
          </div>
          <Button variant="secondary" small onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <Tabs
          tabs={[
            { id: 'resumen', label: 'Resumen' },
            { id: 'academico', label: 'Académico' },
            { id: 'contacto', label: 'Contacto' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'resumen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="No. de lista" value={String(alumno.no)} />
            <InfoRow label="Expediente" value={alumno.expediente} />
            <InfoRow label="Grupo" value={alumno.grupo} />
            <InfoRow label="Carrera" value="Tecnologías de la Información — IDGS" />
            <InfoRow label="Cuatrimestre" value="Octavo" />
            <InfoRow label="Status" value={alumno.status} />
          </div>
        )}

        {tab === 'academico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="Parcial en curso" value="Parcial 1" />
            <InfoRow label="Asistencia" value="Registro pendiente de captura docente" />
            <InfoRow label="Kardex" value="Consultar en Procesos Digitales → Kardex" />
          </div>
        )}

        {tab === 'contacto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="Correo institucional" value={alumno.email} />
            <InfoRow label="Teléfono" value="No capturado" />
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
