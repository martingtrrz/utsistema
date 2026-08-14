import type { PageId, Role } from '../types'
import { NAV, ROLE_PAGES } from '../nav'
import logoUtslrc from '../assets/logos/logo-utslrc.png'
import campusUtslrc from '../assets/campus-utslrc.png'
import { Icon } from './Icon'
import { TICKETS } from '../data/services'

interface Props {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  role: Role
  onExit: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ currentPage, onNavigate, role, onExit, collapsed, onToggleCollapse }: Props) {
  const allowed = new Set(ROLE_PAGES[role])
  const w = collapsed ? 68 : 258

  return (
    <aside
      style={{
        width: w,
        minWidth: w,
        backgroundColor: 'var(--sidebar-bg)',
        backgroundImage: `linear-gradient(rgba(8,82,64,.94),rgba(8,82,64,.96)), url(${campusUtslrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 10,
        transition: 'width .22s cubic-bezier(.4,0,.2,1), min-width .22s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}
    >
      {/* Logo + toggle */}
      <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8 }}>
        {!collapsed && (
          <div style={{ background: '#fff', borderRadius: 10, padding: '6px 8px', display: 'inline-flex', flexShrink: 0 }}>
            <img src={logoUtslrc} alt="UTSLRC" style={{ width: 134, height: 36, objectFit: 'contain' }} />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            border: 'none', background: 'rgba(255,255,255,.12)', borderRadius: 8,
            width: collapsed ? 36 : 30, height: collapsed ? 36 : 30, cursor: 'pointer', display: 'grid', placeItems: 'center',
            color: 'rgba(255,255,255,.8)', flexShrink: 0, transition: 'all .15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.22)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
        >
          {/* Chevron doble */}
          <svg width={collapsed ? "16" : "14"} height={collapsed ? "16" : "14"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <><path d="m9 18 6-6-6-6"/><path d="m15 18 6-6-6-6"/></>
              : <><path d="m15 18-6-6 6-6"/><path d="m9 18-6-6 6-6"/></>
            }
          </svg>
        </button>
      </div>


      {/* Subtítulo */}
      {!collapsed && (
        <div style={{ padding: '8px 18px 4px', color: '#89a7b2', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.12em' }}>
          Sistema Integral Universitario
        </div>
      )}

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map((group) => {
          const items = group.items.filter((i) => allowed.has(i.id))
          if (!items.length) return null
          return (
            <div key={group.label}>
              {!collapsed && (
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.12em', color: '#7896a1', padding: '10px 10px 5px' }}>
                  {group.label}
                </div>
              )}
              {collapsed && <div style={{ height: 10 }} />}
              {items.map((item) => {
                const active  = currentPage === item.id
                const pending = item.id === 'servicios'
                  ? TICKETS.filter((t) => t.status === 'Abierto' || t.status === 'En proceso' || t.status === 'Pendiente').length
                  : 0
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : 10,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      width: '100%',
                      padding: collapsed ? '10px 0' : '10px 12px',
                      borderRadius: 9,
                      border: 'none',
                      background: active ? 'rgba(0,168,137,0.18)' : 'transparent',
                      color: active ? '#fff' : 'var(--sidebar-fg)',
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: 2,
                      position: 'relative',
                      transition: 'background .12s',
                    }}
                  >
                    <span style={{ width: 20, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                      <Icon name={item.icon} size={18} />
                    </span>
                    {!collapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {item.label}
                      </span>
                    )}
                    {pending > 0 && (
                      <span style={{
                        minWidth: 16, height: 16, borderRadius: 99, background: '#ef4444', color: '#fff',
                        fontSize: 9.5, fontWeight: 800, display: 'grid', placeItems: 'center',
                        flexShrink: 0, padding: '0 3px',
                        position: collapsed ? 'absolute' : 'static',
                        top: collapsed ? 6 : undefined,
                        right: collapsed ? 8 : undefined,
                      }}>
                        {pending}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Pie — salir */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={onExit}
          title={collapsed ? 'Portal público' : undefined}
          style={{
            width: '100%', padding: collapsed ? '9px 0' : '9px 0',
            borderRadius: 9, border: '1px solid var(--sidebar-border)',
            background: 'transparent', color: 'var(--sidebar-fg)',
            cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background .12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && 'Portal público'}
        </button>
      </div>
    </aside>
  )
}
