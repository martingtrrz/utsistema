import { STUDENTS, GROUPS } from '../data/students'
import { groupAverage, groupAttendance } from '../data/groups'
import { StatCard, Card, Table, Badge } from '../components/ui'
import type { PageId } from '../types'

interface Props {
  onNavigate: (p: PageId) => void
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Activo: { bg: '#f0faf4', color: '#15803d' },
  'Baja temporal': { bg: '#fff7ed', color: '#c2410c' },
  Egresado: { bg: '#eff6ff', color: '#1d4ed8' },
}

export default function Dashboard({ onNavigate }: Props) {
  const promedio = STUDENTS.reduce((a, s) => a + s.promedio, 0) / STUDENTS.length
  const asistencia = Math.round(STUDENTS.reduce((a, s) => a + s.asistencia, 0) / STUDENTS.length)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>Resumen académico</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Visión general del periodo Enero – Abril 2025.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Alumnos" value={STUDENTS.length} icon="◍" tint="var(--secondary)" />
        <StatCard label="Grupos" value={GROUPS.length} icon="◫" tint="var(--gold-light)" />
        <StatCard label="Promedio general" value={promedio.toFixed(1)} icon="◔" tint="#eff6ff" />
        <StatCard label="Asistencia" value={`${asistencia}%`} icon="◷" tint="#f0faf4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 16 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Desempeño por grupo</h3>
          <div style={{ display: 'flex', alignItems: 'end', gap: 20, height: 220, padding: '12px 6px 0', borderBottom: '1px solid #dfe9e5', backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 43px, #edf3f0 44px)' }}>
            {GROUPS.map((g) => {
              const v = groupAverage(g)
              return (
                <div key={g} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <b style={{ fontSize: 12, color: 'var(--primary-dark)' }}>{v.toFixed(1)}</b>
                  <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
                    <div style={{ width: '100%', maxWidth: 58, height: `${Math.max(12, Math.min(100, v * 10))}%`, borderRadius: '9px 9px 3px 3px', background: 'linear-gradient(180deg,var(--primary),#72d2bd)', boxShadow: '0 7px 14px rgba(25,183,124,.18)', transition: 'height .45s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', paddingBottom: 8 }}>{g.replace('IDGS ', '')}</span>
                </div>
              )
            })}
          </div>
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Actividad reciente</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['✓', 'Calificaciones', 'Parcial 1 listo para revisión'],
              ['◷', 'Asistencia', `${GROUPS.length} grupos actualizados`],
              ['▣', 'Biblioteca', 'Préstamos próximos a vencer'],
              ['◇', 'Servicios', 'Solicitudes pendientes de atención'],
            ].map(([icon, t, d]) => (
              <div key={t as string} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, border: '1px solid #eef1f3', borderRadius: 11 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--secondary)', display: 'grid', placeItems: 'center' }}>{icon}</div>
                <div>
                  <b style={{ fontSize: 12, display: 'block' }}>{t}</b>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{d}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Alumnos recientes</h3>
          <button onClick={() => onNavigate('alumnos')} style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 9, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Ver todos
          </button>
        </div>
        <Table headers={['Expediente', 'Nombre', 'Grupo', 'Promedio', 'Status']}>
          {STUDENTS.slice(0, 8).map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{s.expediente}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.nombre}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{s.grupo}</td>
              <td style={{ padding: '10px 12px' }}>{s.promedio.toFixed(1)}</td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={s.status} bg={STATUS_STYLE[s.status].bg} color={STATUS_STYLE[s.status].color} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
