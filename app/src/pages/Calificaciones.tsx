import { useMemo, useState } from 'react'
import { GROUPS, STUDENTS } from '../data/students'
import { GRADES, letterGrade, LETTER_GRADE_INFO, computeFinal, setGrades, type GradeRecord } from '../data/grades'
import { SUBJECTS } from '../data/academic'
import { Card, Table, Badge, Select, Button, Input, Toast, useToast } from '../components/ui'
import { api } from '../services/api'

// Campos editables de una calificación
type DraftMap = Record<string, Partial<GradeRecord['components']>>

export default function Calificaciones() {
  const [grupo,   setGrupo]   = useState(GROUPS[0] ?? '')
  const [query,   setQuery]   = useState('')
  const [drafts,  setDrafts]  = useState<DraftMap>({})
  const [saving,  setSaving]  = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const { msg, show, fire } = useToast()

  const rows = useMemo(() => {
    const ids = new Set(STUDENTS.filter((s) => s.grupo === grupo).map((s) => s.id))
    return GRADES.filter((g) => ids.has(g.studentId)).filter(
      (g) => query.trim() === '' || g.materia.toLowerCase().includes(query.toLowerCase())
    )
  }, [grupo, query, GRADES.length])

  const studentName = (id: string) => STUDENTS.find((s) => s.id === id)?.nombre ?? id
  const studentExp  = (id: string) => STUDENTS.find((s) => s.id === id)?.expediente ?? ''

  // Manejar edición de un campo
  function handleField(gradeId: string, field: keyof GradeRecord['components'], raw: string) {
    const val = parseFloat(raw)
    setDrafts((prev) => ({
      ...prev,
      [gradeId]: { ...prev[gradeId], [field]: isNaN(val) ? undefined : Math.min(10, Math.max(0, val)) },
    }))
  }

  // Guardar todos los cambios pendientes
  async function handleSave() {
    const entries = Object.entries(drafts).filter(([, v]) => Object.keys(v).length > 0)
    if (!entries.length) { fire('Sin cambios pendientes'); return }
    setSaving(true)
    try {
      await Promise.all(
        entries.map(([id, patch]) => api.put(`/grades/${id}`, patch))
      )
      // Recargar los datos en el store local
      const updated = await api.get<any[]>('/grades')
      const subjects = SUBJECTS
      setGrades(
        updated.map((g) => ({
          id: g.id,
          studentId: g.student_id,
          materia: subjects.find((s) => s.id === g.subject_id)?.nombre ?? g.subject_id,
          parcial: g.parcial,
          components: {
            evidencias:   Number(g.evidencias),
            conocimiento: Number(g.conocimiento),
            desempeno:    Number(g.desempeno),
            actitud:      Number(g.actitud),
            examen:       Number(g.examen),
          },
          final: Number(g.final),
        }))
      )
      setDrafts({})
      fire('Calificaciones guardadas correctamente')
    } catch (err: any) {
      fire(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const pendingCount = Object.values(drafts).filter((v) => Object.keys(v).length > 0).length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Calificaciones</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Evidencias (20%) · Conocimiento (30%) · Desempeño (20%) · Actitud (10%) · Examen (20%)
          </p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 12, margin: '4px 0 0' }}>
            Escala: NA &lt;8.0 · SA 8.0–8.9 · DE 9.0–9.6 · AU 9.7–10
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pendingCount > 0 && (
            <span style={{ fontSize: 12, color: '#c2410c', background: '#fff7ed', padding: '4px 10px', borderRadius: 99, border: '1px solid #f5d9b0', fontWeight: 600 }}>
              {pendingCount} cambio{pendingCount > 1 ? 's' : ''} sin guardar
            </span>
          )}
          <Button variant="secondary" small onClick={() => setShowAdd(true)}>+ Nueva calificación</Button>
          <Button variant="primary" small onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
        <Input value={query} onChange={setQuery} placeholder="Buscar materia…" style={{ minWidth: 240 }} />
      </div>

      {/* Tabla editable */}
      <Card>
        <Table headers={['Alumno', 'Materia', 'Evid.', 'Conoc.', 'Desemp.', 'Actitud', 'Examen', 'Final', '']}>
          {rows.map((g) => {
            const draft    = drafts[g.id] ?? {}
            const merged   = { ...g.components, ...draft }
            const preview  = computeFinal(merged)
            const isDirty  = Object.keys(draft).length > 0
            return (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', background: isDirty ? '#fffbeb' : undefined }}>
                <td style={{ padding: '8px 12px' }}>
                  <b style={{ fontSize: 12.5 }}>{studentName(g.studentId)}</b>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{studentExp(g.studentId)}</div>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--muted-foreground)', fontSize: 12.5 }}>{g.materia}</td>
                {(['evidencias', 'conocimiento', 'desempeno', 'actitud', 'examen'] as const).map((field) => (
                  <td key={field} style={{ padding: '4px 8px' }}>
                    <input
                      type="number"
                      min={0} max={10} step={0.1}
                      value={draft[field] !== undefined ? draft[field] : merged[field]}
                      onChange={(e) => handleField(g.id, field, e.target.value)}
                      style={{
                        width: 58, padding: '5px 6px', borderRadius: 6, fontSize: 12.5,
                        border: draft[field] !== undefined ? '1.5px solid #f59e0b' : '1px solid var(--border)',
                        outline: 'none', textAlign: 'center',
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>
                  {preview.toFixed(1)}
                  {isDirty && (
                    <span style={{ fontSize: 10, color: '#f59e0b', marginLeft: 4 }}>●</span>
                  )}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <Badge
                    text={letterGrade(preview)}
                    bg={LETTER_GRADE_INFO[letterGrade(preview)].bg}
                    color={LETTER_GRADE_INFO[letterGrade(preview)].color}
                  />
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {showAdd && (
        <NuevaCalificacionModal
          grupo={grupo}
          onClose={() => setShowAdd(false)}
          onSaved={(msg) => { fire(msg); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

// ─── Modal para agregar nueva calificación ────────────────────────────────────
function NuevaCalificacionModal({
  grupo,
  onClose,
  onSaved,
}: {
  grupo: string
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const alumnosGrupo = STUDENTS.filter((s) => s.grupo === grupo)
  const materias     = SUBJECTS.filter((s) => s.grupo === grupo)

  const [studentId,    setStudentId]    = useState(alumnosGrupo[0]?.id ?? '')
  const [subjectId,    setSubjectId]    = useState(materias[0]?.id ?? '')
  const [parcial,      setParcial]      = useState('Parcial 1')
  const [evidencias,   setEvidencias]   = useState('')
  const [conocimiento, setConocimiento] = useState('')
  const [desempeno,    setDesempeno]    = useState('')
  const [actitud,      setActitud]      = useState('')
  const [examen,       setExamen]       = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  async function handleSubmit() {
    if (!studentId || !subjectId || !evidencias || !conocimiento || !desempeno || !actitud || !examen) {
      setError('Completa todos los campos'); return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/grades', {
        student_id:  studentId,
        subject_id:  subjectId,
        parcial,
        evidencias:   Number(evidencias),
        conocimiento: Number(conocimiento),
        desempeno:    Number(desempeno),
        actitud:      Number(actitud),
        examen:       Number(examen),
      })
      // Recargar store
      const updated = await api.get<any[]>('/grades')
      setGrades(
        updated.map((g) => ({
          id: g.id,
          studentId: g.student_id,
          materia: SUBJECTS.find((s) => s.id === g.subject_id)?.nombre ?? g.subject_id,
          parcial: g.parcial,
          components: {
            evidencias:   Number(g.evidencias),
            conocimiento: Number(g.conocimiento),
            desempeno:    Number(g.desempeno),
            actitud:      Number(g.actitud),
            examen:       Number(g.examen),
          },
          final: Number(g.final),
        }))
      )
      onSaved('Calificación registrada correctamente')
    } catch (err: any) {
      setError(err.message ?? 'Error al registrar')
    } finally {
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
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: '0 30px 90px rgba(0,0,0,.25)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: 15 }}>Nueva calificación</b>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ModalRow label="Alumno">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={selectStyle}>
              {alumnosGrupo.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </ModalRow>
          <ModalRow label="Materia">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={selectStyle}>
              {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </ModalRow>
          <ModalRow label="Parcial">
            <select value={parcial} onChange={(e) => setParcial(e.target.value)} style={selectStyle}>
              {['Parcial 1', 'Parcial 2', 'Parcial 3'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </ModalRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {([['Evidencias', evidencias, setEvidencias], ['Conocimiento', conocimiento, setConocimiento], ['Desempeño', desempeno, setDesempeno], ['Actitud', actitud, setActitud], ['Examen', examen, setExamen]] as [string, string, (v: string) => void][]).map(([label, val, set]) => (
              <ModalRow key={label} label={label}>
                <input type="number" min={0} max={10} step={0.1} value={val} onChange={(e) => set(e.target.value)} style={{ ...selectStyle, textAlign: 'center' }} />
              </ModalRow>
            ))}
          </div>
          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando…' : 'Registrar'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)',
  fontSize: 13, outline: 'none', background: '#fff', width: '100%',
}

function ModalRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}
