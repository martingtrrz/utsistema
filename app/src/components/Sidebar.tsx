import type { PageId, Role } from '../types'
import { NAV, ROLE_PAGES } from '../nav'
import logoUtslrc from '../assets/logos/logo-utslrc.png'
import campusUtslrc from '../assets/campus-utslrc.png'
import { Icon } from './Icon'

interface Props {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  role: Role
  onExit: () => void
}

export default function Sidebar({ currentPage, onNavigate, role, onExit }: Props) {
  const allowed = new Set(ROLE_PAGES[role])
  return (
    <aside
      style={{
        width: 258,
        backgroundColor: 'var(--sidebar-bg)',
        backgroundImage: `linear-gradient(rgba(8,82,64,.94),rgba(8,82,64,.96)), url(${campusUtslrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 8, display: 'inline-flex' }}>
          <img src={logoUtslrc} alt="UTSLRC" style={{ width: 150, height: 40, objectFit: 'contain' }} />
        </div>
        <div style={{ marginTop: 10, color: '#89a7b2', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em' }}>
          Sistema Integral Universitario
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map((group) => {
          const items = group.items.filter((i) => allowed.has(i.id))
          if (!items.length) return null
          return (
            <div key={group.label}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: '#7896a1', padding: '12px 10px 6px' }}>
                {group.label}
              </div>
              {items.map((item) => {
                const active = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 9,
                      border: 'none',
                      background: active ? 'rgba(0,168,137,0.18)' : 'transparent',
                      color: active ? '#fff' : 'var(--sidebar-fg)',
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ width: 20, flexShrink: 0, display: 'grid', placeItems: 'center' }}><Icon name={item.icon} size={18} /></span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={onExit}
          style={{
            width: '100%',
            padding: '9px 0',
            borderRadius: 9,
            border: '1px solid var(--sidebar-border)',
            background: 'transparent',
            color: 'var(--sidebar-fg)',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          ↩ Portal público
        </button>
      </div>
    </aside>
  )
}
