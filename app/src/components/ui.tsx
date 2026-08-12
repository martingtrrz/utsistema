import { useState, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon, tint }: { label: string; value: string | number; icon: string; tint?: string }) {
  const icons: Record<string, IconName> = { Alumnos: 'student', 'Alumnos totales': 'student', Grupos: 'users', 'Promedio general': 'chart', Asistencia: 'calendar', 'Títulos en acervo': 'library', 'Ejemplares totales': 'file' }
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: tint ?? 'var(--secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 19,
          flexShrink: 0,
        }}
      >
        <Icon name={icons[label] ?? 'grid'} size={20} style={{ color: 'var(--primary-dark)' }} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</div>
      </div>
    </Card>
  )
}

export function Badge({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  small,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost'
  small?: boolean
  type?: 'button' | 'submit'
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: '#fff', border: '1px solid var(--primary)' },
    secondary: { background: '#fff', color: 'var(--foreground)', border: '1px solid var(--border)' },
    gold: { background: 'var(--gold)', color: '#fff', border: '1px solid var(--gold)' },
    ghost: { background: 'transparent', color: 'var(--primary)', border: '1px solid transparent' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...styles[variant],
        borderRadius: 7,
        padding: small ? '6px 12px' : '9px 16px',
        fontSize: small ? 12.5 : 13.5,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  style?: React.CSSProperties
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '8px 12px',
        borderRadius: 7,
        border: '1px solid var(--border)',
        fontSize: 13,
        outline: 'none',
        ...style,
      }}
    />
  )
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  color: 'var(--muted-foreground)',
                  fontWeight: 600,
                  fontSize: 11.5,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Select({
  value,
  onChange,
  options,
  style,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  style?: React.CSSProperties
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '8px 12px',
        borderRadius: 7,
        border: '1px solid var(--border)',
        fontSize: 13,
        outline: 'none',
        background: '#fff',
        color: 'var(--foreground)',
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function Modal({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,24,33,.48)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, maxWidth: width, width: '100%', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,.25)' }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ fontSize: 15 }}>{title}</b>
          <button
            onClick={onClose}
            style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ title, subtitle, icon = '▧' }: { title: string; subtitle?: string; icon?: string }) {
  return (
    <div style={{ padding: 50, textAlign: 'center', color: 'var(--muted-foreground)' }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
      <strong style={{ display: 'block', color: 'var(--foreground)', marginBottom: 6 }}>{title}</strong>
      {subtitle && <span>{subtitle}</span>}
    </div>
  )
}

export function ProgressBar({ value, color = 'var(--primary)' }: { value: number; color?: string }) {
  return (
    <div style={{ height: 7, borderRadius: 99, background: '#edf1f2', overflow: 'hidden' }}>
      <div style={{ display: 'block', height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 99 }} />
    </div>
  )
}

export function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 22,
        bottom: 22,
        background: 'var(--navy)',
        color: '#fff',
        padding: '13px 16px',
        borderRadius: 11,
        boxShadow: 'var(--shadow)',
        display: show ? 'block' : 'none',
        zIndex: 200,
        fontSize: 12,
        transition: 'opacity .2s',
      }}
    >
      {message}
    </div>
  )
}

export function useToast() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const fire = (m: string) => {
    setMsg(m)
    setShow(true)
    setTimeout(() => setShow(false), 2200)
  }
  return { msg, show, fire }
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            borderBottom: active === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            color: active === t.id ? 'var(--primary)' : 'var(--muted-foreground)',
            fontWeight: active === t.id ? 600 : 500,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
