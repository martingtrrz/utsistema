import { useState } from 'react'
import { TICKETS, setTickets, type ServiceTicket } from '../data/services'
import { STUDENTS } from '../data/students'
import { Card, Table, Badge, Tabs, Button, StatCard, Toast, useToast } from '../components/ui'
import { api } from '../services/api'
import { authService } from '../services/auth'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'En proceso':        { bg: '#fff4dc', color: '#9a6a00' },
  'Listo para recoger':{ bg: '#eff6ff', color: '#1d4ed8' },
  Entregado:           { bg: '#f0faf4', color: '#15803d' },
  Rechazado:           { bg: '#fde9e9', color: '#a33b3b' },
  Abierto:             { bg: '#fde9e9', color: '#a33b3b' },
  Resuelto:            { bg: '#f0faf4', color: '#15803d' },
  Pendiente:           { bg: '#fff4dc', color: '#9a6a00' },
}

const TRAMITE_STATUSES = ['En proceso', 'Listo para recoger', 'Entregado', 'Rechazado']
const SOPORTE_STATUSES = ['Abierto', 'En proceso', 'Resuelto']

async function refreshTickets() {
  const raw = await api.get<any[]>('/services')
  setTickets(
    raw.map((t) => ({
      id: t.id, folio: t.folio,
      solicitante: STUDENTS.find((s) => s.id === t.student_id)?.nombre ?? t.student_id,
      tipo: t.tipo, categoria: t.categoria, fecha: t.fecha, status: t.status,
    }))
  )
}

export default function Servicios() {
  const [tab,      setTab]      = useState<'tramites' | 'soporte'>('tramites')
  const [showNew,  setShowNew]  = useState(false)
  const [editing,  setEditing]  = useState<ServiceTicket | null>(null)
  const { msg, show, fire } = useToast()

  const rows        = TICKETS.filter((t) => tab === 'tramites' ? t.categoria === 'Trámite escolar' : t.categoria === 'Soporte / Incidencia')
  const pendientes  = TICKETS.filter((t) => t.status === 'Abierto' || t.status === 'En proceso' || t.status === 'Pendiente').length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Servicios</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Trámites escolares, solicitudes, tickets e incidencias.
          </p>
        </div>
        <Button variant="primary" small onClick={() => setShowNew(true)}>+ Nueva solicitud</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Total tickets"   value={TICKETS.length}                                                                icon="◍" tint="var(--secondary)" />
        <StatCard label="Pendientes"       value={pendientes}                                                                     icon="◈" tint="#fff4dc" />
        <StatCard label="Trámites"         value={TICKETS.filter((t) => t.categoria === 'Trámite escolar').length}               icon="◔" tint="#eff6ff" />
        <StatCard label="Soporte"          value={TICKETS.filter((t) => t.categoria === 'Soporte / Incidencia').length}          icon="◷" tint="#fde9e9" />
      </div>

      {/* Tabla */}
      <Card>
        <Tabs
          tabs={[
            { id: 'tramites', label: `Trámites escolares (${TICKETS.filter((t) => t.categoria === 'Trámite escolar').length})` },
            { id: 'soporte',  label: `Soporte / Incidencias (${TICKETS.filter((t) => t.categoria === 'Soporte / Incidencia').length})` },
          ]}
          active={tab}
          onChange={(id) => setTab(id as 'tramites' | 'soporte')}
        />

        {rows.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
            No hay tickets en esta categoría.
          </div>
        ) : (
          <Table headers={['Folio', 'Solicitante', 'Tipo', 'Fecha', 'Status', '']}>
            {rows.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{t.folio}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{t.solicitante}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)', fontSize: 12.5 }}>{t.tipo}</td>
                <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{t.fecha}</td>
                <td style={{ padding: '10px 12px' }}>
                  <Badge
                    text={t.status}
                    bg={STATUS_STYLE[t.status]?.bg ?? '#f2f5f6'}
                    color={STATUS_STYLE[t.status]?.color ?? '#333'}
                  />
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <Button variant="ghost" small onClick={() => setEditing(t)}>Actualizar</Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {showNew && (
        <NuevaSolicitudModal
          onClose={() => setShowNew(false)}
          onSaved={async (m) => { setShowNew(false); await refreshTickets(); fire(m) }}
        />
      )}
      {editing && (
        <CambiarStatusModal
          ticket={editing}
          statuses={editing.categoria === 'Trámite escolar' ? TRAMITE_STATUSES : SOPORTE_STATUSES}
          onClose={() => setEditing(null)}
          onSaved={async (m) => { setEditing(null); await refreshTickets(); fire(m) }}
        />
      )}
    </div>
  )
}

// ─── Modal nueva solicitud ────────────────────────────────────────────────────
const TRAMITE_TIPOS = ['Constancia de estudios', 'Carta de pasante', 'Historial académico', 'Certificado parcial', 'Beca', 'Otro trámite']
const SOPORTE_TIPOS = ['Acceso a plataforma', 'Problema con calificaciones', 'Problema de inscripción', 'Reporte de equipo', 'Otro soporte']

function NuevaSolicitudModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const user        = authService.getCurrentUser()
  const [categoria, setCategoria] = useState<'Trámite escolar' | 'Soporte / Incidencia'>('Trámite escolar')
  const [tipo,      setTipo]      = useState('')
  const [studentId, setStudentId] = useState(user?.studentId ?? STUDENTS[0]?.id ?? '')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const tipoOptions = categoria === 'Trámite escolar' ? TRAMITE_TIPOS : SOPORTE_TIPOS

  async function handleSubmit() {
    if (!tipo || !studentId) { setError('Completa todos los campos'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/services', {
        student_id: studentId,
        tipo,
        categoria,
        fecha: new Date().toISOString().slice(0, 10),
      })
      onSaved('Solicitud creada correctamente')
    } catch (err: any) {
      setError(err.message ?? 'Error al crear solicitud')
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
          <b style={{ fontSize: 15 }}>Nueva solicitud</b>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Categoría como tabs visuales */}
          <div>
            <label style={labelStyle}>Categoría</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              {(['Trámite escolar', 'Soporte / Incidencia'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoria(cat); setTipo('') }}
                  style={{
                    padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '1.5px solid', transition: 'all .15s',
                    borderColor: categoria === cat ? 'var(--primary)' : 'var(--border)',
                    background: categoria === cat ? 'var(--secondary)' : '#fff',
                    color: categoria === cat ? 'var(--primary-dark)' : 'var(--muted-foreground)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Tipo de solicitud">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
              <option value="">— Selecciona —</option>
              {tipoOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>

          {/* Si no hay studentId del JWT, permitir seleccionar alumno */}
          {!user?.studentId && (
            <FormField label="Alumno solicitante">
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={inputStyle}>
                {STUDENTS.map((s) => <option key={s.id} value={s.id}>{s.nombre} ({s.expediente})</option>)}
              </select>
            </FormField>
          )}

          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Enviando…' : 'Crear solicitud'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal cambiar status ─────────────────────────────────────────────────────
function CambiarStatusModal({
  ticket,
  statuses,
  onClose,
  onSaved,
}: {
  ticket: ServiceTicket
  statuses: string[]
  onClose: () => void
  onSaved: (m: string) => void
}) {
  const [newStatus, setNewStatus] = useState(ticket.status)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSave() {
    if (newStatus === ticket.status) { onClose(); return }
    setSaving(true)
    try {
      await api.put(`/services/${ticket.id}`, { status: newStatus })
      onSaved(`Ticket ${ticket.folio} actualizado a "${newStatus}"`)
    } catch (err: any) {
      setError(err.message ?? 'Error al actualizar')
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
        style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 400, boxShadow: '0 30px 90px rgba(0,0,0,.25)', overflow: 'hidden' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <b style={{ fontSize: 15 }}>Actualizar ticket</b>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{ticket.folio} · {ticket.tipo}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Solicitante</span>
            <span style={{ fontWeight: 500 }}>{ticket.solicitante}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Status actual</span>
            <Badge text={ticket.status} bg={STATUS_STYLE[ticket.status]?.bg ?? '#f2f5f6'} color={STATUS_STYLE[ticket.status]?.color ?? '#333'} />
          </div>

          <FormField label="Nuevo status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  style={{
                    padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    border: `1.5px solid ${newStatus === s ? STATUS_STYLE[s]?.color ?? 'var(--primary)' : 'var(--border)'}`,
                    background: newStatus === s ? (STATUS_STYLE[s]?.bg ?? 'var(--secondary)') : '#fff',
                    color: newStatus === s ? (STATUS_STYLE[s]?.color ?? 'var(--primary-dark)') : 'var(--muted-foreground)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormField>

          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Actualizar'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)',
  fontSize: 13, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600, display: 'block',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}
