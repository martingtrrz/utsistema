import { useMemo, useState } from 'react'
import { STUDENTS, GROUPS, setStudents, type Student } from '../data/students'
import { GRADES } from '../data/grades'
import { ATTENDANCE } from '../data/attendance'
import { CAREERS } from '../data/academic'
import { Card, StatCard, Badge, Button, Input, Table, Tabs, Toast, useToast } from '../components/ui'
import { Icon } from '../components/Icon'
import { api } from '../services/api'
import type { PageId } from '../types'

const STATUS_STYLE: Record<Student['status'], { bg: string; color: string }> = {
  Activo:          { bg: '#f0faf4', color: '#15803d' },
  'Baja temporal': { bg: '#fff7ed', color: '#c2410c' },
  Egresado:        { bg: '#eff6ff', color: '#1d4ed8' },
}

interface Props {
  initialGrupo?: string
  onNavigate?: (page: PageId) => void
}

export default function ControlAlumnado({ initialGrupo, onNavigate }: Props) {
  const [query,       setQuery]       = useState('')
  const [grupoFilter, setGrupoFilter] = useState<string>(initialGrupo ?? 'Todos')
  const [selected,    setSelected]    = useState<Student | null>(null)
  const [showNew,     setShowNew]     = useState(false)
  const { msg, show, fire } = useToast()

  async function refreshStudents() {
    const raw = await api.get<any[]>('/students')
    setStudents(raw)
  }

  const filtered = useMemo(() => {
    return STUDENTS.filter((a) => {
      const matchesGroup = grupoFilter === 'Todos' || a.grupo === grupoFilter
      const matchesQuery =
        query.trim() === '' ||
        a.nombre.toLowerCase().includes(query.toLowerCase()) ||
        a.expediente.includes(query)
      return matchesGroup && matchesQuery
    })
  }, [query, grupoFilter])

  const uniqueGroups = [...new Set(STUDENTS.map((s) => s.grupo))]
  const counts  = uniqueGroups.map((g) => ({ grupo: g, total: STUDENTS.filter((a) => a.grupo === g).length }))
  const activos = STUDENTS.filter((s) => s.status === 'Activo').length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Control de Alumnado</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Gestión y consulta de expedientes de todos los estudiantes.
          </p>
        </div>
        <Button variant="primary" small onClick={() => setShowNew(true)}>+ Nuevo alumno</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        <StatCard label="Alumnos totales" value={STUDENTS.length} icon="◍" tint="var(--secondary)" />
        <StatCard label="Activos"         value={activos}         icon="◔" tint="#f0faf4" />
        {counts.map((c) => (
          <StatCard key={c.grupo} label={c.grupo} value={c.total} icon="▥" tint="var(--gold-light)" />
        ))}
      </div>

      {/* Tabla */}
      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input value={query} onChange={setQuery} placeholder="Buscar por nombre o expediente…" style={{ minWidth: 260 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Todos', ...GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setGrupoFilter(g)}
                style={{
                  padding: '7px 13px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
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
            {filtered.length} de {STUDENTS.length} alumnos
          </div>
        </div>

        <Table headers={['No.', 'Expediente', 'Nombre', 'Grupo', 'Promedio', 'Asistencia', 'Status', '']}>
          {filtered.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.no}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12.5 }}>{a.expediente}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{a.nombre}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.grupo}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ fontWeight: 700, color: a.promedio >= 9 ? '#15803d' : a.promedio >= 8 ? '#9a6a00' : '#a33b3b' }}>
                  {a.promedio.toFixed(1)}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ color: a.asistencia >= 85 ? '#15803d' : a.asistencia >= 70 ? '#9a6a00' : '#a33b3b', fontWeight: 600 }}>
                  {a.asistencia}%
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={a.status} bg={STATUS_STYLE[a.status].bg} color={STATUS_STYLE[a.status].color} />
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                <Button variant="ghost" small onClick={() => setSelected(a)}>Ver expediente →</Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {selected && <AlumnoDrawer alumno={selected} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
      {showNew && (
        <NuevoAlumnoModal
          onClose={() => setShowNew(false)}
          onSaved={async (m) => { setShowNew(false); await refreshStudents(); fire(m) }}
        />
      )}
    </div>
  )
}

function AlumnoDrawer({
  alumno,
  onClose,
  onNavigate,
}: {
  alumno: Student
  onClose: () => void
  onNavigate?: (page: PageId) => void
}) {
  const [tab, setTab] = useState('resumen')

  const grades      = GRADES.filter((g) => g.studentId === alumno.id)
  const promedioReal = grades.length
    ? (grades.reduce((a, g) => a + g.final, 0) / grades.length).toFixed(1)
    : alumno.promedio.toFixed(1)
  const att = ATTENDANCE.find((a) => a.studentId === alumno.id)

  const goTo = (page: PageId) => { onClose(); onNavigate?.(page) }

  // Accesos rápidos del drawer
  const quickLinks: { page: PageId; icon: 'check' | 'calendar' | 'file'; label: string; bg: string; color: string }[] = [
    { page: 'calificaciones', icon: 'check',    label: 'Calificaciones', bg: '#f0faf4', color: '#15803d' },
    { page: 'asistencia',     icon: 'calendar', label: 'Asistencia',     bg: '#eff6ff', color: '#1d4ed8' },
    { page: 'kardex',         icon: 'file',     label: 'Kardex',         bg: '#fff7ed', color: '#c2410c' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, maxWidth: '92vw', background: '#fff', height: '100%', overflowY: 'auto', padding: 24, boxShadow: '-8px 0 40px rgba(0,0,0,.12)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{alumno.nombre}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>
              Exp. {alumno.expediente} · {alumno.grupo}
            </div>
            <div style={{ marginTop: 6 }}>
              <Badge text={alumno.status} bg={STATUS_STYLE[alumno.status].bg} color={STATUS_STYLE[alumno.status].color} />
            </div>
          </div>
          <Button variant="secondary" small onClick={onClose}>Cerrar</Button>
        </div>

        {/* Accesos rápidos con iconos SVG */}
        {onNavigate && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {quickLinks.map(({ page, icon, label, bg, color }) => (
              <button
                key={page}
                onClick={() => goTo(page)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 6px', borderRadius: 10, border: `1px solid ${bg}`,
                  background: bg, cursor: 'pointer', fontSize: 12, fontWeight: 600, color,
                  transition: 'opacity .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Icon name={icon} size={20} />
                {label}
              </button>
            ))}
          </div>
        )}

        <Tabs
          tabs={[
            { id: 'resumen',   label: 'Resumen'   },
            { id: 'academico', label: 'Académico'  },
            { id: 'contacto',  label: 'Contacto'   },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'resumen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="No. de lista"  value={String(alumno.no)} />
            <InfoRow label="Expediente"    value={alumno.expediente} />
            <InfoRow label="Grupo"         value={alumno.grupo} />
            <InfoRow label="Carrera"       value={alumno.carrera || 'Tecnologías de la Información — IDGS'} />
            <InfoRow label="Cuatrimestre"  value={alumno.cuatrimestre || '—'} />
            <InfoRow label="Periodo"       value={alumno.periodo || '—'} />
            <InfoRow label="Status"        value={alumno.status} />
          </div>
        )}

        {tab === 'academico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Mini KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 6 }}>
              <div style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Promedio</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary-dark)' }}>{promedioReal}</div>
              </div>
              <div style={{ background: '#f8fafb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Asistencia</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: (att?.porcentaje ?? alumno.asistencia) >= 85 ? '#15803d' : '#c2410c' }}>
                  {att ? `${att.porcentaje}%` : `${alumno.asistencia}%`}
                </div>
              </div>
            </div>

            {/* Calificaciones recientes */}
            {grades.length > 0 ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginTop: 4 }}>Calificaciones recientes</div>
                {grades.slice(0, 5).map((g) => (
                  <div
                    key={g.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                  >
                    <span>{g.materia}</span>
                    <span style={{ fontWeight: 700, color: g.final >= 9 ? '#15803d' : g.final >= 8 ? '#9a6a00' : '#a33b3b' }}>
                      {g.final.toFixed(1)}
                    </span>
                  </div>
                ))}
                {grades.length > 5 && (
                  <button
                    onClick={() => goTo('calificaciones')}
                    style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Icon name="check" size={14} />
                    Ver todas las calificaciones
                  </button>
                )}
              </>
            ) : (
              <InfoRow label="Calificaciones" value="Sin registros en este periodo" />
            )}

            {/* Asistencia detallada */}
            {att && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginTop: 8 }}>Asistencia</div>
                <InfoRow label="Asistencias" value={String(att.asistencias)} />
                <InfoRow label="Faltas"      value={String(att.faltas)} />
                <InfoRow label="Retardos"    value={String(att.retardos)} />
                <InfoRow label="Estado"      value={att.estado} />
              </>
            )}
          </div>
        )}

        {tab === 'contacto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="Correo institucional" value={alumno.email} />
            <InfoRow label="Teléfono"             value="No capturado" />
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

// ─── Modal Nuevo Alumno ────────────────────────────────────────────────────────
function NuevoAlumnoModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const [id,           setId]           = useState('')
  const [nombre,       setNombre]       = useState('')
  const [expediente,   setExpediente]   = useState('')
  const [groupId,      setGroupId]      = useState(GROUPS[0] ?? '')
  const [careerId,     setCareerId]     = useState(CAREERS[0]?.id ?? '')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit() {
    if (!id || !nombre || !groupId || !careerId) { setError('ID, nombre, grupo y carrera son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/students', { id, nombre, expediente, group_id: groupId, career_id: careerId, status: 'Activo' })
      onSaved(`Alumno "${nombre}" registrado correctamente`)
    } catch (err: any) {
      setError(err.message ?? 'Error al crear alumno')
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,24,33,.48)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 500, boxShadow: '0 30px 90px rgba(0,0,0,.25)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: 15 }}>Nuevo alumno</b>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Field label="Expediente">
              <input value={expediente} onChange={(e) => setExpediente(e.target.value)} style={inp} placeholder="250001" />
            </Field>
            <Field label="Nombre completo">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inp} placeholder="Juan Pérez" />
            </Field>
          </div>
          <Field label="ID del sistema (UUID/Matrícula)">
            <input value={id} onChange={(e) => setId(e.target.value)} style={inp} placeholder="ALU-001" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Carrera">
              <select value={careerId} onChange={(e) => setCareerId(e.target.value)} style={inp}>
                {CAREERS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </Field>
            <Field label="Grupo">
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={inp}>
                {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando…' : 'Crear alumno'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inp: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)',
  fontSize: 13, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}

