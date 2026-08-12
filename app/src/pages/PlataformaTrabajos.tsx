import { useState } from 'react'
import { ALUMNOS } from '../data/alumnos'
import { Card, StatCard, Badge, Button } from '../components/ui'

interface Entrega {
  id: string
  alumno: string
  grupo: string
  status: 'Entregado' | 'Pendiente' | 'Revisado' | 'Con retraso'
  calificacion?: number
  fecha: string
}

interface Trabajo {
  id: string
  titulo: string
  materia: string
  grupo: string
  fechaLimite: string
  tipo: 'Tarea' | 'Proyecto' | 'Exposición' | 'Investigación'
  entregas: Entrega[]
}

function buildEntregas(grupo: string, n: number, seedStatuses: Entrega['status'][]): Entrega[] {
  const alumnosGrupo = ALUMNOS.filter((a) => a.grupo === grupo).slice(0, n)
  return alumnosGrupo.map((a, i) => ({
    id: `${a.id}-E`,
    alumno: a.nombre,
    grupo: a.grupo,
    status: seedStatuses[i % seedStatuses.length],
    calificacion: seedStatuses[i % seedStatuses.length] === 'Revisado' ? 80 + ((i * 7) % 20) : undefined,
    fecha: '2026-08-0' + ((i % 8) + 1),
  }))
}

function buildTrabajos(): Trabajo[] {
  return [
    {
      id: 'T-001',
      titulo: 'Proyecto integrador: Sistema web con React',
      materia: 'Desarrollo Web Avanzado',
      grupo: 'IDGS 8-1',
      fechaLimite: '2026-08-15',
      tipo: 'Proyecto',
      entregas: buildEntregas('IDGS 8-1', 10, ['Revisado', 'Entregado', 'Pendiente', 'Con retraso']),
    },
    {
      id: 'T-002',
      titulo: 'Investigación: Modelos de arquitectura en la nube',
      materia: 'Infraestructura de TI',
      grupo: 'IDGS 8-2',
      fechaLimite: '2026-08-12',
      tipo: 'Investigación',
      entregas: buildEntregas('IDGS 8-2', 8, ['Entregado', 'Revisado', 'Pendiente']),
    },
    {
      id: 'T-003',
      titulo: 'Exposición: Ciberseguridad en entornos empresariales',
      materia: 'Seguridad Informática',
      grupo: 'IDGS 8-3',
      fechaLimite: '2026-08-10',
      tipo: 'Exposición',
      entregas: buildEntregas('IDGS 8-3', 9, ['Con retraso', 'Revisado', 'Entregado', 'Pendiente']),
    },
  ]
}

const STATUS_STYLE: Record<Entrega['status'], { bg: string; color: string }> = {
  Entregado: { bg: '#eff6ff', color: '#1d4ed8' },
  Pendiente: { bg: '#f4f4f5', color: '#52525b' },
  Revisado: { bg: '#f0faf4', color: '#15803d' },
  'Con retraso': { bg: '#fef2f2', color: '#b91c1c' },
}

const TIPO_ICON: Record<Trabajo['tipo'], string> = {
  Tarea: '▤',
  Proyecto: '▦',
  Exposición: '◔',
  Investigación: '◈',
}

export default function PlataformaTrabajos() {
  const TRABAJOS = buildTrabajos()
  const [selected, setSelected] = useState<Trabajo>(TRABAJOS[0])

  const totalEntregas = TRABAJOS.reduce((s, t) => s + t.entregas.length, 0)
  const revisados = TRABAJOS.reduce((s, t) => s + t.entregas.filter((e) => e.status === 'Revisado').length, 0)
  const pendientes = TRABAJOS.reduce((s, t) => s + t.entregas.filter((e) => e.status === 'Pendiente').length, 0)
  const retraso = TRABAJOS.reduce((s, t) => s + t.entregas.filter((e) => e.status === 'Con retraso').length, 0)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Trabajos activos" value={TRABAJOS.length} icon="▦" tint="var(--secondary)" />
        <StatCard label="Entregas totales" value={totalEntregas} icon="▥" tint="var(--gold-light)" />
        <StatCard label="Revisados" value={revisados} icon="✓" tint="#f0faf4" />
        <StatCard label="Con retraso" value={retraso} icon="⏰" tint="#fef2f2" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18 }}>
        <Card style={{ padding: 0, height: 'fit-content' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
            Trabajos publicados
          </div>
          {TRABAJOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '13px 16px',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: selected.id === t.id ? 'var(--secondary)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>
                {TIPO_ICON[t.tipo]} {t.titulo}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                {t.grupo} · {t.materia}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>Entrega: {t.fechaLimite}</div>
            </button>
          ))}
          <div style={{ padding: 12 }}>
            <Button variant="primary" small>+ Publicar trabajo</Button>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.titulo}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
                {selected.materia} · {selected.grupo} · Tipo: {selected.tipo}
              </div>
            </div>
            <Badge text={`Límite: ${selected.fechaLimite}`} bg="var(--gold-light)" color="#92660a" />
          </div>

          <div style={{ marginTop: 18, fontSize: 12.5, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
            Entregas ({selected.entregas.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {selected.entregas.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{e.alumno}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                    {e.status === 'Pendiente' ? 'Sin entregar' : `Entregado ${e.fecha}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {e.calificacion !== undefined && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{e.calificacion}</span>
                  )}
                  <Badge text={e.status} bg={STATUS_STYLE[e.status].bg} color={STATUS_STYLE[e.status].color} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}