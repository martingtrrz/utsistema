import type { Role } from '../types'

interface Props {
  title: string
  subtitle: string
  role: Role
}

function initials(role: string) {
  return role.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function TopBar({ title, subtitle, role }: Props) {
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
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '3px 0 0' }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {initials(role)}
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{role}</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>Sesión demo</div>
        </div>
      </div>
    </header>
  )
}
