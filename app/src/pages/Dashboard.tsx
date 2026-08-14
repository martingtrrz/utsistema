import { STUDENTS, GROUPS } from '../data/students'
import { GROUPS_DATA, groupAverage, groupAttendance } from '../data/groups'
import { GRADES } from '../data/grades'
import { TICKETS } from '../data/services'
import { StatCard, Card, Table, Badge } from '../components/ui'
import { Icon } from '../components/Icon'
import type { PageId } from '../types'

interface Props {
  onNavigate: (p: PageId) => void
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Activo:          { bg: '#f0faf4', color: '#15803d' },
  'Baja temporal': { bg: '#fff7ed', color: '#c2410c' },
  Egresado:        { bg: '#eff6ff', color: '#1d4ed8' },
}

export default function Dashboard({ onNavigate }: Props) {
  const total      = STUDENTS.length
  const promedio   = total ? STUDENTS.reduce((a, s) => a + s.promedio,   0) / total : 0
  const asistencia = total ? Math.round(STUDENTS.reduce((a, s) => a + s.asistencia, 0) / total) : 0
  const activos    = STUDENTS.filter((s) => s.status === 'Activo').length
  const pendientes = TICKETS.filter((t) => t.status === 'Pendiente').length
  const enRiesgo   = STUDENTS.filter((s) => s.promedio < 8 || s.asistencia < 80).length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Alumnos"          value={total}               icon="◍" tint="var(--secondary)" />
        <StatCard label="Grupos"           value={GROUPS.length}       icon="◫" tint="var(--gold-light)" />
        <StatCard label="Promedio general" value={promedio.toFixed(1)} icon="◔" tint="#eff6ff" />
        <StatCard label="Asistencia"       value={`${asistencia}%`}   icon="◷" tint="#f0faf4" />
      </div>

      {/* Accesos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {([
          { page: 'alumnos'        as PageId, icon: 'student'  as const, label: 'Alumnos',        desc: `${activos} activos`,            bg: '#f0faf4', border: '#bbddd0', color: '#15803d' },
          { page: 'calificaciones' as PageId, icon: 'check'    as const, label: 'Calificaciones', desc: `${GRADES.length} registros`,    bg: '#eff6ff', border: '#bcd3f5', color: '#1d4ed8' },
          { page: 'asistencia'     as PageId, icon: 'calendar' as const, label: 'Asistencia',     desc: `${enRiesgo} alumnos en riesgo`, bg: '#fff7ed', border: '#f5d9b0', color: '#c2410c' },
          { page: 'servicios'      as PageId, icon: 'service'  as const, label: 'Servicios',      desc: `${pendientes} pendientes`,      bg: '#fdf4ff', border: '#e5c8f5', color: '#7c3aed' },
        ]).map(({ page, icon, label, desc, bg, border, color }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left',
              padding: 16, borderRadius: 12, border: `1px solid ${border}`,
              background: bg, cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '22', display: 'grid', placeItems: 'center', color }}>
              <Icon name={icon} size={19} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Gráficas + accesos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr .8fr', gap: 16 }}>
        {/* Gráfica de barras por grupo */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Desempeño por grupo</h3>
          {GROUPS.length === 0 ? (
            <div style={{ color: 'var(--muted-foreground)', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>Sin datos de grupos cargados</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'end', gap: 14, height: 220, padding: '12px 6px 0', borderBottom: '1px solid #dfe9e5', backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 43px, #edf3f0 44px)' }}>
              {GROUPS.map((g) => {
                const avg       = groupAverage(g)
                const att       = groupAttendance(g)
                const groupInfo = GROUPS_DATA.find((gd) => gd.id === g)
                return (
                  <div
                    key={g}
                    style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer' }}
                    onClick={() => onNavigate('alumnos')}
                    title={`Asistencia promedio: ${att}%`}
                  >
                    <b style={{ fontSize: 12, color: 'var(--primary-dark)' }}>{avg.toFixed(1)}</b>
                    <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
                      <div
                        style={{
                          width: '100%', maxWidth: 58,
                          height: `${Math.max(12, Math.min(100, avg * 10))}%`,
                          borderRadius: '9px 9px 3px 3px',
                          background: 'linear-gradient(180deg,var(--primary),#72d2bd)',
                          boxShadow: '0 7px 14px rgba(25,183,124,.18)',
                          transition: 'height .45s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)', paddingBottom: 8, textAlign: 'center' }}>
                      {groupInfo?.nombre ?? g}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Gráfica de riesgo */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Alumnos en riesgo (P. &lt; 8 o As. &lt; 80)</h3>
          {GROUPS.length === 0 ? (
            <div style={{ color: 'var(--muted-foreground)', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>Sin datos de grupos cargados</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'end', gap: 14, height: 220, padding: '12px 6px 0', borderBottom: '1px solid #fde9e9', backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 43px, #fff4f4 44px)' }}>
              {GROUPS.map((g) => {
                const alumnos = STUDENTS.filter((s) => s.grupo === g)
                const risk = alumnos.filter((s) => s.promedio < 8 || s.asistencia < 80).length
                const maxRisk = Math.max(1, ...GROUPS.map((gr) => STUDENTS.filter((s) => s.grupo === gr && (s.promedio < 8 || s.asistencia < 80)).length))
                const groupInfo = GROUPS_DATA.find((gd) => gd.id === g)
                return (
                  <div key={g} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                    <b style={{ fontSize: 12, color: '#991b1b' }}>{risk}</b>
                    <div style={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'end' }}>
                      <div
                        style={{
                          width: '100%', maxWidth: 58,
                          height: `${Math.max(10, (risk / maxRisk) * 100)}%`,
                          borderRadius: '9px 9px 3px 3px',
                          background: risk > 0 ? 'linear-gradient(180deg,#ef4444,#fca5a5)' : '#f1f5f9',
                          transition: 'height .45s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--muted-foreground)', paddingBottom: 8, textAlign: 'center' }}>
                      {groupInfo?.nombre ?? g}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Accesos rápidos secundarios */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Accesos rápidos</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {([
              { page: 'calificaciones' as PageId, icon: 'check'    as const, label: 'Calificaciones', sub: 'Ver y gestionar notas'  },
              { page: 'asistencia'     as PageId, icon: 'calendar' as const, label: 'Asistencia',     sub: 'Registro por grupo'     },
              { page: 'reportes'       as PageId, icon: 'chart'    as const, label: 'Reportes',       sub: 'Exportar informes'      },
              { page: 'configuracion'  as PageId, icon: 'settings' as const, label: 'Configuración',  sub: 'Usuarios y sistema'     },
            ]).map(({ page, icon, label, sub }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'center', padding: 10,
                  border: '1px solid #eef1f3', borderRadius: 11, cursor: 'pointer',
                  background: 'transparent', textAlign: 'left', width: '100%',
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--secondary)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--primary-dark)' }}>
                  <Icon name={icon} size={17} />
                </div>
                <div>
                  <b style={{ fontSize: 12, display: 'block' }}>{label}</b>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{sub}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabla de alumnos recientes */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Alumnos recientes</h3>
          <button
            onClick={() => onNavigate('alumnos')}
            style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 9, padding: '8px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Ver todos
          </button>
        </div>
        <Table headers={['Expediente', 'Nombre', 'Grupo', 'Promedio', 'Asistencia', 'Status']}>
          {STUDENTS.slice(0, 8).map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{s.expediente}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.nombre}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{s.grupo}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ fontWeight: 700, color: s.promedio >= 9 ? '#15803d' : s.promedio >= 8 ? '#9a6a00' : '#a33b3b' }}>
                  {s.promedio.toFixed(1)}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: s.asistencia >= 85 ? '#15803d' : s.asistencia >= 70 ? '#9a6a00' : '#a33b3b', fontWeight: 600 }}>
                  {s.asistencia}%
                </span>
              </td>
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
