import { useMemo, useState } from 'react'
import { GROUPS, STUDENTS } from '../data/students'
import { ATTENDANCE, setAttendance, type AttendanceSummary } from '../data/attendance'
import { Card, Table, Badge, Select, StatCard, ProgressBar, Button, Toast, useToast } from '../components/ui'
import { api } from '../services/api'

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  Regular:    { bg: '#f0faf4', color: '#15803d' },
  'En riesgo':{ bg: '#fff4dc', color: '#9a6a00' },
  Crítico:    { bg: '#fde9e9', color: '#a33b3b' },
}

export default function Asistencia() {
  const [grupo,    setGrupo]    = useState(GROUPS[0] ?? '')
  const [editing,  setEditing]  = useState<AttendanceSummary | null>(null)
  const { msg, show, fire } = useToast()

  const rows = useMemo(() => {
    const ids = new Set(STUDENTS.filter((s) => s.grupo === grupo).map((s) => s.id))
    return ATTENDANCE.filter((a) => ids.has(a.studentId))
  }, [grupo, ATTENDANCE.length])

  const studentOf  = (id: string) => STUDENTS.find((s) => s.id === id)
  const promedio   = Math.round(rows.reduce((a, r) => a + r.porcentaje, 0) / (rows.length || 1))
  const totalFaltas    = rows.reduce((a, r) => a + r.faltas,    0)
  const totalRetardos  = rows.reduce((a, r) => a + r.retardos,  0)

  // Refrescar store después de guardar
  async function refreshAttendance() {
    const updated = await api.get<any[]>('/attendance')
    setAttendance(
      updated.map((a) => ({
        studentId:  a.student_id,
        asistencias: a.asistencias,
        faltas:      a.faltas,
        retardos:    a.retardos,
        porcentaje:  Number(a.porcentaje),
        estado:      a.estado,
      }))
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Asistencia</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Seguimiento de asistencia por grupo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Promedio"   value={`${promedio}%`}      icon="◷" tint="var(--secondary)" />
        <StatCard label="Faltas"     value={totalFaltas}          icon="◈" tint="#fde9e9" />
        <StatCard label="Retardos"   value={totalRetardos}        icon="◷" tint="var(--gold-light)" />
        <StatCard label="Alumnos"    value={rows.length}          icon="◍" tint="#eff6ff" />
      </div>

      {/* Tabla */}
      <Card>
        <Table headers={['Alumno', 'Asistencias', 'Faltas', 'Retardos', '%', 'Estado', '']}>
          {rows.map((r) => {
            const alumno = studentOf(r.studentId)
            return (
              <tr key={r.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                  {alumno?.nombre ?? r.studentId}
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{alumno?.expediente}</div>
                </td>
                <td style={{ padding: '10px 12px' }}>{r.asistencias}</td>
                <td style={{ padding: '10px 12px', color: r.faltas > 5 ? '#a33b3b' : undefined, fontWeight: r.faltas > 5 ? 700 : 400 }}>{r.faltas}</td>
                <td style={{ padding: '10px 12px' }}>{r.retardos}</td>
                <td style={{ padding: '10px 12px', width: 150 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar
                        value={r.porcentaje}
                        color={r.porcentaje >= 90 ? 'var(--primary)' : r.porcentaje >= 80 ? '#f59e0b' : '#ef4444'}
                      />
                    </div>
                    <span style={{ fontSize: 11.5, minWidth: 32 }}>{r.porcentaje}%</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <Badge text={r.estado} bg={ESTADO_STYLE[r.estado].bg} color={ESTADO_STYLE[r.estado].color} />
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <Button variant="ghost" small onClick={() => setEditing(r)}>Editar</Button>
                </td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {editing && (
        <EditarAsistenciaModal
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={async (m) => { setEditing(null); await refreshAttendance(); fire(m) }}
        />
      )}
    </div>
  )
}

// ─── Modal edición de asistencia ────────────────────────────────────────────
function EditarAsistenciaModal({
  record,
  onClose,
  onSaved,
}: {
  record: AttendanceSummary
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const alumno = STUDENTS.find((s) => s.id === record.studentId)

  const [asistencias,   setAsistencias]   = useState(String(record.asistencias))
  const [faltas,        setFaltas]        = useState(String(record.faltas))
  const [retardos,      setRetardos]      = useState(String(record.retardos))
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  // Calcula porcentaje automáticamente
  const total      = Number(asistencias) + Number(faltas) + Number(retardos)
  const porcentaje = total > 0 ? Math.round((Number(asistencias) / total) * 100) : 0

  async function handleSave() {
    if (!asistencias || !faltas || !retardos) { setError('Completa todos los campos'); return }
    setSaving(true)
    setError('')
    try {
      await api.put(`/attendance/student/${record.studentId}`, {
        asistencias: Number(asistencias),
        faltas:      Number(faltas),
        retardos:    Number(retardos),
        porcentaje,
      })
      onSaved(`Asistencia actualizada — ${porcentaje}%`)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
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
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 30px 90px rgba(0,0,0,.25)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <b style={{ fontSize: 15 }}>Editar asistencia</b>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
              {alumno?.nombre ?? record.studentId} · {alumno?.grupo}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Vista previa del porcentaje */}
          <div style={{ background: '#f8fafb', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Porcentaje calculado</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: porcentaje >= 90 ? '#15803d' : porcentaje >= 80 ? '#9a6a00' : '#a33b3b' }}>{porcentaje}%</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--muted-foreground)' }}>
              Total de clases: {total}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {([['Asistencias', asistencias, setAsistencias], ['Faltas', faltas, setFaltas], ['Retardos', retardos, setRetardos]] as [string, string, (v: string) => void][]).map(([label, val, set]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>{label}</label>
                <input
                  type="number" min={0} value={val}
                  onChange={(e) => set(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 14, textAlign: 'center', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
