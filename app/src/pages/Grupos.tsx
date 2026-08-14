import { useState } from 'react'
import { GROUPS_DATA, studentsByGroup, groupAverage, groupAttendance, setGroupsData, type Group } from '../data/groups'
import { setGroups, GROUPS } from '../data/students'
import { CAREERS } from '../data/academic'
import { Card, Button, Toast, useToast, ProgressBar } from '../components/ui'
import { api } from '../services/api'

interface Props {
  onOpenGroup: (grupo: string) => void
}

export default function Grupos({ onOpenGroup }: Props) {
  const [showNew, setShowNew] = useState(false)
  const { msg, show, fire }   = useToast()

  async function refreshGroups() {
    const raw = await api.get<any[]>('/groups')
    const careersMap = Object.fromEntries(CAREERS.map((c) => [c.id, c.nombre]))
    const groups: Group[] = raw.map((g) => ({
      id: g.id, nombre: g.nombre, carrera: careersMap[g.career_id] ?? g.career_id,
      cuatrimestre: g.cuatrimestre, periodo: g.periodo, aula: g.aula, turno: g.turno,
    }))
    setGroupsData(groups)
    setGroups(raw.map((g) => g.id))
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Grupos</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Grupos activos de Tecnologías de la Información — periodo actual.
          </p>
        </div>
        <Button variant="primary" small onClick={() => setShowNew(true)}>+ Nuevo grupo</Button>
      </div>

      {/* Tarjetas de grupos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {GROUPS_DATA.map((g) => {
          const alumnos    = studentsByGroup(g.id)
          const promedio   = groupAverage(g.id)
          const asistencia = groupAttendance(g.id)
          const promedioColor   = promedio   >= 9 ? '#15803d' : promedio   >= 8 ? '#9a6a00' : '#a33b3b'
          const asistenciaColor = asistencia >= 85 ? '#15803d' : asistencia >= 70 ? '#9a6a00' : '#a33b3b'

          return (
            <Card key={g.id}>
              {/* Badge carrera + cuatrimestre */}
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                {g.carrera} · {g.cuatrimestre}
              </div>
              <h3 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700 }}>{g.nombre}</h3>
              <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{g.periodo}</span>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0' }}>
                <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                  <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10, textTransform: 'uppercase' }}>Alumnos</small>
                  <b style={{ fontSize: 18 }}>{alumnos.length}</b>
                </div>
                <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                  <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10, textTransform: 'uppercase' }}>Aula</small>
                  <b style={{ fontSize: 18 }}>{g.aula || '—'}</b>
                </div>
                <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                  <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10, textTransform: 'uppercase' }}>Promedio</small>
                  <b style={{ fontSize: 18, color: promedioColor }}>{promedio.toFixed(1)}</b>
                </div>
                <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                  <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10, textTransform: 'uppercase' }}>Turno</small>
                  <b style={{ fontSize: 14 }}>{g.turno || '—'}</b>
                </div>
              </div>

              {/* Barra de asistencia */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Asistencia promedio</span>
                  <b style={{ color: asistenciaColor }}>{asistencia}%</b>
                </div>
                <ProgressBar
                  value={asistencia}
                  color={asistenciaColor}
                />
              </div>

              <Button variant="primary" onClick={() => onOpenGroup(g.id)}>Abrir grupo →</Button>
            </Card>
          )
        })}

        {GROUPS_DATA.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '40px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
            No hay grupos cargados.
          </div>
        )}
      </div>

      {showNew && (
        <NuevoGrupoModal
          onClose={() => setShowNew(false)}
          onSaved={async (m) => { setShowNew(false); await refreshGroups(); fire(m) }}
        />
      )}
    </div>
  )
}

// ─── Modal nuevo grupo ────────────────────────────────────────────────────────
function NuevoGrupoModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const [id,           setId]           = useState('')
  const [nombre,       setNombre]       = useState('')
  const [careerId,     setCareerId]     = useState(CAREERS[0]?.id ?? '')
  const [cuatrimestre, setCuatrimestre] = useState('')
  const [periodo,      setPeriodo]      = useState('Enero – Abril 2025')
  const [aula,         setAula]         = useState('')
  const [turno,        setTurno]        = useState('Matutino')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit() {
    if (!id || !nombre || !careerId) { setError('ID, nombre y carrera son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/groups', { id, nombre, career_id: careerId, cuatrimestre, periodo, aula, turno })
      onSaved(`Grupo "${nombre}" creado correctamente`)
    } catch (err: any) {
      setError(err.message ?? 'Error al crear grupo')
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
          <b style={{ fontSize: 15 }}>Nuevo grupo</b>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <Field label="ID del grupo" hint="Ej: IDGS-9-1">
              <input value={id} onChange={(e) => setId(e.target.value)} style={inp} placeholder="IDGS-9-1" />
            </Field>
            <Field label="Nombre">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inp} placeholder="IDGS 9-1" />
            </Field>
          </div>
          <Field label="Carrera">
            <select value={careerId} onChange={(e) => setCareerId(e.target.value)} style={inp}>
              {CAREERS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Cuatrimestre">
              <input value={cuatrimestre} onChange={(e) => setCuatrimestre(e.target.value)} style={inp} placeholder="Noveno" />
            </Field>
            <Field label="Periodo">
              <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={inp} />
            </Field>
            <Field label="Aula">
              <input value={aula} onChange={(e) => setAula(e.target.value)} style={inp} placeholder="Ej: A-12" />
            </Field>
            <Field label="Turno">
              <select value={turno} onChange={(e) => setTurno(e.target.value)} style={inp}>
                {['Matutino', 'Vespertino', 'Mixto'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Creando…' : 'Crear grupo'}</Button>
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>
        {label}{hint && <span style={{ fontWeight: 400, marginLeft: 4 }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}
