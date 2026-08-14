import type { Role } from '../types'
import { authService } from '../services/auth'

interface Props {
  title: string
  subtitle: string
  role: Role
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  Administrador:    { bg: '#fdeeee', text: '#b42318' },
  'Control Escolar':{ bg: '#eff6ff', text: '#1d4ed8' },
  Docente:          { bg: '#f0faf4', text: '#15803d' },
  Alumno:           { bg: '#fbf3e2', text: '#9a6a00' },
}

export default function TopBar({ title, subtitle, role }: Props) {
  const user     = authService.getCurrentUser()
  const nombre   = user?.nombre ?? role
  const username = user?.username ?? ''
  const colors   = ROLE_COLORS[role] ?? { bg: 'var(--secondary)', text: 'var(--primary-dark)' }

  return (
    <header
      style={{
        height: 68,
        borderBottom: '1px solid var(--border)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 26px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
    >
      {/* Título de página */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '3px 0 0' }}>{subtitle}</p>
      </div>

      {/* Usuario logueado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Badge de rol */}
        <span
          style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
            background: colors.bg, color: colors.text, letterSpacing: '.04em',
          }}
        >
          {role}
        </span>

        {/* Avatar con iniciales */}
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--navy))',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}
        >
          {initials(nombre)}
        </div>

        {/* Nombre y username */}
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{nombre}</div>
          {username && (
            <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>@{username}</div>
          )}
        </div>
      </div>
    </header>
  )
}
