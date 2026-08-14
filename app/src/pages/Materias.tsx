import { useMemo, useState } from 'react'
import { SUBJECTS, CAREERS, setSubjects, type Subject } from '../data/academic'
import { GROUPS, GROUPS as GROUPS_IDS } from '../data/students'
import { GROUPS_DATA } from '../data/groups'
import { TEACHERS } from '../data/teachers'
import { GRADES } from '../data/grades'
import { Card, Table, Button, Select, Input, StatCard, Toast, useToast } from '../components/ui'
import { api } from '../services/api'

export default function Materias() {
  const [grupo,   setGrupo]   = useState('Todos')
  const [query,   setQuery]   = useState('')
  const [showNew, setShowNew] = useState(false)
  const { msg, show, fire }   = useToast()

  const filtered = useMemo(() => {
    return SUBJECTS.filter((s) => {
      const matchGrupo = grupo === 'Todos' || s.grupo === grupo
      const matchQuery = query.trim() === '' || s.nombre.toLowerCase().includes(query.toLowerCase()) || s.docente.toLowerCase().includes(query.toLowerCase())
      return matchGrupo && matchQuery
    })
  }, [grupo, query, SUBJECTS.length])

  // Promedio de calificación por materia
  const avgForSubject = (nombre: string) => {
    const gs = GRADES.filter((g) => g.materia === nombre)
    if (!gs.length) return null
    return (gs.reduce((a, g) => a + g.final, 0) / gs.length).toFixed(1)
  }

  async function refreshSubjects() {
    const raw = await api.get<any[]>('/subjects')
    setSubjects(
      raw.map((s) => ({
        id: s.id, nombre: s.nombre, grupo: s.group_id,
        docente: s.docente_nombre ?? '', creditos: s.creditos,
      }))
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Materias</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Catálogo de asignaturas, docentes y grupos.
          </p>
        </div>
        <Button variant="primary" small onClick={() => setShowNew(true)}>+ Nueva materia</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <StatCard label="Total materias"  value={SUBJECTS.length}                                               icon="◍" tint="var(--secondary)" />
        <StatCard label="Con docente"     value={SUBJECTS.filter((s) => s.docente).length}                     icon="◔" tint="#f0faf4" />
        <StatCard label="Sin docente"     value={SUBJECTS.filter((s) => !s.docente).length}                    icon="◈" tint="#fff7ed" />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Select
          value={grupo}
          onChange={setGrupo}
          options={['Todos', ...GROUPS_IDS]}
        />
        <Input value={query} onChange={setQuery} placeholder="Buscar materia o docente…" style={{ minWidth: 260 }} />
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted-foreground)' }}>
          {filtered.length} de {SUBJECTS.length} materias
        </span>
      </div>

      {/* Tabla */}
      <Card>
        <Table headers={['Clave', 'Materia', 'Grupo', 'Docente', 'Créditos', 'Promedio calif.']}>
          {filtered.map((s) => {
            const avg        = avgForSubject(s.nombre)
            const groupInfo  = GROUPS_DATA.find((g) => g.id === s.grupo)
            return (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11.5, color: 'var(--muted-foreground)' }}>{s.id}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.nombre}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)', fontSize: 12.5 }}>
                  {groupInfo?.nombre ?? s.grupo}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12.5 }}>
                  {s.docente ? (
                    <span style={{ color: 'var(--foreground)' }}>{s.docente}</span>
                  ) : (
                    <span style={{ color: '#c2410c', fontSize: 11.5 }}>Sin asignar</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{s.creditos}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {avg !== null ? (
                    <span style={{ fontWeight: 700, color: Number(avg) >= 9 ? '#15803d' : Number(avg) >= 8 ? '#9a6a00' : '#a33b3b' }}>
                      {avg}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}

          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Sin materias para este filtro.</td></tr>
          )}
        </Table>
      </Card>

      {showNew && (
        <NuevaMateriaModal
          onClose={() => setShowNew(false)}
          onSaved={async (m) => { setShowNew(false); await refreshSubjects(); fire(m) }}
        />
      )}
    </div>
  )
}

// ─── Modal nueva materia ──────────────────────────────────────────────────────
function NuevaMateriaModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const [id,       setId]       = useState('')
  const [nombre,   setNombre]   = useState('')
  const [groupId,  setGroupId]  = useState(GROUPS[0] ?? '')
  const [docente,  setDocente]  = useState('')
  const [creditos, setCreditos] = useState('4')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const teacherSelected = TEACHERS.find((t) => t.nombre === docente)

  async function handleSubmit() {
    if (!id || !nombre || !groupId) { setError('ID, nombre y grupo son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/subjects', {
        id, nombre, group_id: groupId,
        teacher_id: teacherSelected?.id ?? null,
        docente_nombre: docente || null,
        creditos: Number(creditos),
      })
      onSaved(`Materia "${nombre}" creada correctamente`)
    } catch (err: any) {
      setError(err.message ?? 'Error al crear materia')
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
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 30px 90px rgba(0,0,0,.25)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: 15 }}>Nueva materia</b>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <F label="Clave (ID)">
              <input value={id} onChange={(e) => setId(e.target.value)} style={inp} placeholder="MAT-001" />
            </F>
            <F label="Nombre de la materia">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inp} placeholder="Ej: Bases de Datos" />
            </F>
          </div>
          <F label="Grupo">
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={inp}>
              {GROUPS.map((g) => {
                const info = GROUPS_DATA.find((gd) => gd.id === g)
                return <option key={g} value={g}>{info?.nombre ?? g}</option>
              })}
            </select>
          </F>
          <F label="Docente (opcional)">
            <select value={docente} onChange={(e) => setDocente(e.target.value)} style={inp}>
              <option value="">— Sin asignar —</option>
              {TEACHERS.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
            </select>
          </F>
          <F label="Créditos">
            <input type="number" min={1} max={10} value={creditos} onChange={(e) => setCreditos(e.target.value)} style={{ ...inp, width: 100 }} />
          </F>
          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Creando…' : 'Crear materia'}</Button>
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

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}
