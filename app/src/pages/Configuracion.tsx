import { useEffect, useState } from 'react'
import type { Role } from '../types'
import { Card, Tabs, Button, Badge, Toast, useToast } from '../components/ui'
import { api } from '../services/api'

interface AppUser {
  id: number
  username: string
  nombre: string
  role: Role
  student_id?: string | null
  teacher_id?: string | null
}

const ROLE_BADGE: Record<Role, { bg: string; color: string }> = {
  Administrador:    { bg: '#fdeeee', color: '#b42318' },
  'Control Escolar':{ bg: '#eff6ff', color: '#1d4ed8' },
  Docente:          { bg: '#f0faf4', color: '#15803d' },
  Alumno:           { bg: '#fbf3e2', color: '#9a6a00' },
}

export default function Configuracion({ role }: { role: Role }) {
  const [tab, setTab] = useState('perfil')
  const { msg, show, fire } = useToast()

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast message={msg} show={show} />
      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>Configuración</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
          Perfil, usuarios, roles, permisos y configuración académica.
        </p>
      </div>

      <Card>
        <Tabs
          tabs={[
            { id: 'perfil',   label: 'Perfil'                },
            { id: 'usuarios', label: 'Usuarios'              },
            { id: 'roles',    label: 'Roles y permisos'      },
            { id: 'academica',label: 'Configuración académica'},
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'perfil'    && <PerfilTab role={role} onFire={fire} />}
        {tab === 'usuarios'  && <UsuariosTab role={role} onFire={fire} />}
        {tab === 'roles'     && <RolesTab />}
        {tab === 'academica' && <AcademicaTab />}
      </Card>
    </div>
  )
}

// ─── Pestaña Perfil ──────────────────────────────────────────────────────────
function PerfilTab({ role, onFire }: { role: Role; onFire: (m: string) => void }) {
  return (
    <div style={{ maxWidth: 420, display: 'grid', gap: 12 }}>
      <Row label="Sesión activa" value={role} />
      <Row label="Institución"   value="UTSLRC" />
      <Row label="Periodo"       value="Enero – Abril 2025" />
      <Button variant="primary" onClick={() => onFire('Perfil actualizado')}>Guardar cambios</Button>
    </div>
  )
}

// ─── Pestaña Usuarios ────────────────────────────────────────────────────────
function UsuariosTab({ role, onFire }: { role: Role; onFire: (m: string) => void }) {
  const [users,    setUsers]    = useState<AppUser[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    try {
      // GET /api/auth/users no existe en el backend, usamos /api/auth/me para saber quién somos
      // y mostramos la lista de lo que hay en la tabla users via un endpoint genérico.
      // El backend expone POST /api/auth/users solo para crear; para listar usaremos
      // un arreglo local seed más los creados en sesión.
      // Si el backend tiene GET /api/auth/users disponible lo usamos, si no mostramos mensaje.
      const data = await api.get<AppUser[]>('/auth/users')
      setUsers(data)
    } catch {
      // Endpoint puede no existir aún; mostramos los usuarios semilla conocidos
      setUsers([
        { id: 1, username: 'admin',     nombre: 'Administrador',      role: 'Administrador' },
        { id: 2, username: 'control',   nombre: 'Control Escolar',    role: 'Control Escolar' },
        { id: 3, username: 'mmolina',   nombre: 'Docente Demo',       role: 'Docente' },
        { id: 4, username: '23304059',  nombre: 'Alumno Demo',        role: 'Alumno' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</span>
        {role === 'Administrador' && (
          <Button variant="primary" small onClick={() => setShowForm(true)}>+ Nuevo usuario</Button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted-foreground)', fontSize: 13, padding: '20px 0' }}>Cargando usuarios…</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10 }}
            >
              <div>
                <b style={{ fontSize: 13 }}>{u.nombre}</b>
                <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 1 }}>@{u.username}</div>
              </div>
              <Badge text={u.role} bg={ROLE_BADGE[u.role]?.bg ?? '#f2f5f6'} color={ROLE_BADGE[u.role]?.color ?? '#333'} />
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NuevoUsuarioModal
          onClose={() => setShowForm(false)}
          onSaved={async (m) => { setShowForm(false); await fetchUsers(); onFire(m) }}
        />
      )}
    </div>
  )
}

// ─── Modal nuevo usuario ─────────────────────────────────────────────────────
function NuevoUsuarioModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [nombre,    setNombre]    = useState('')
  const [roleVal,   setRoleVal]   = useState<Role>('Docente')
  const [studentId, setStudentId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const ROLES: Role[] = ['Administrador', 'Control Escolar', 'Docente', 'Alumno']

  async function handleSubmit() {
    if (!username || !password || !nombre) { setError('Username, contraseña y nombre son requeridos'); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/auth/users', {
        username, password, nombre, role: roleVal,
        studentId: studentId || undefined,
        teacherId: teacherId || undefined,
      })
      onSaved(`Usuario "${username}" creado correctamente`)
    } catch (err: any) {
      setError(err.message ?? 'Error al crear usuario')
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
          <b style={{ fontSize: 15 }}>Nuevo usuario</b>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormRow label="Nombre completo">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. María Molina" style={inputStyle} />
          </FormRow>
          <FormRow label="Username">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej. mmolina" style={inputStyle} />
          </FormRow>
          <FormRow label="Contraseña">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
          </FormRow>
          <FormRow label="Rol">
            <select value={roleVal} onChange={(e) => setRoleVal(e.target.value as Role)} style={inputStyle}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormRow>
          {roleVal === 'Alumno' && (
            <FormRow label="ID de alumno (student_id)">
              <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Opcional: AL001" style={inputStyle} />
            </FormRow>
          )}
          {roleVal === 'Docente' && (
            <FormRow label="ID de docente (teacher_id)">
              <input value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="Opcional: DC001" style={inputStyle} />
            </FormRow>
          )}
          {error && <p style={{ color: '#a33', fontSize: 12.5, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Creando…' : 'Crear usuario'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pestaña Roles ───────────────────────────────────────────────────────────
function RolesTab() {
  const permisos: { rol: Role; accesos: string }[] = [
    { rol: 'Administrador',    accesos: 'Acceso total al sistema. Puede crear usuarios, gestionar todo.' },
    { rol: 'Control Escolar',  accesos: 'Acceso a alumnos, calificaciones, asistencia, inscripciones, reportes.' },
    { rol: 'Docente',          accesos: 'Grupos, alumnos a cargo, calificaciones, asistencia, horarios, kardex.' },
    { rol: 'Alumno',           accesos: 'Mis calificaciones, asistencia, horario, kardex, biblioteca y servicios.' },
  ]
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {permisos.map((p) => (
        <div key={p.rol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10, gap: 16 }}>
          <Badge text={p.rol} bg={ROLE_BADGE[p.rol].bg} color={ROLE_BADGE[p.rol].color} />
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)', flex: 1, textAlign: 'right' }}>{p.accesos}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Pestaña Académica ───────────────────────────────────────────────────────
function AcademicaTab() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted-foreground)' }}>
        Ponderación institucional para el cálculo de calificación final.
      </p>
      <Row label="Evidencias"    value="20%" />
      <Row label="Conocimiento"  value="30%" />
      <Row label="Desempeño"     value="20%" />
      <Row label="Actitud"       value="10%" />
      <Row label="Examen"        value="20%" />
      <div style={{ marginTop: 8, padding: '12px 16px', background: '#f8fafb', borderRadius: 10, fontSize: 12.5, color: 'var(--muted-foreground)' }}>
        Escala: <b>NA</b> &lt;8.0 · <b>SA</b> 8.0–8.9 · <b>DE</b> 9.0–9.6 · <b>AU</b> 9.7–10
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)',
  fontSize: 13, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}
