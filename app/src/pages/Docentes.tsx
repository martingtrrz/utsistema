import { useState } from 'react'
import { TEACHERS, type Teacher } from '../data/teachers'
import { GROUPS_DATA } from '../data/groups'
import { Card, Button, StatCard, Input } from '../components/ui'

export default function Docentes() {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Teacher | null>(null)

  const filtered = TEACHERS.filter(
    (t) =>
      query.trim() === '' ||
      t.nombre.toLowerCase().includes(query.toLowerCase()) ||
      t.email?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Docentes</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
            Directorio académico y carga de grupos.
          </p>
        </div>
        <Input value={query} onChange={setQuery} placeholder="Buscar docente…" style={{ minWidth: 240 }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <StatCard label="Total docentes"   value={TEACHERS.length}                                                     icon="◍" tint="var(--secondary)" />
        <StatCard label="Grupos cubiertos" value={[...new Set(TEACHERS.flatMap((t) => t.grupos))].length}              icon="◫" tint="var(--gold-light)" />
        <StatCard label="Materias activas" value={[...new Set(TEACHERS.flatMap((t) => t.materias))].length}            icon="◔" tint="#eff6ff" />
      </div>

      {/* Tarjetas de docentes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {filtered.map((t) => (
          <Card key={t.id}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--navy))',
                  color: '#fff', display: 'grid', placeItems: 'center',
                  fontWeight: 900, fontSize: 16,
                }}
              >
                {t.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: 14.5, fontWeight: 700 }}>{t.nombre}</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: 11.5, margin: 0 }}>{t.grado || 'Docente'}</p>
                {t.email && (
                  <p style={{ color: 'var(--primary)', fontSize: 11, margin: '2px 0 0' }}>{t.email}</p>
                )}
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Grupos</small>
                <b style={{ fontSize: 18 }}>{t.grupos.length}</b>
              </div>
              <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Materias</small>
                <b style={{ fontSize: 18 }}>{t.materias.length}</b>
              </div>
            </div>

            <Button variant="secondary" onClick={() => setSelected(t)}>Ver perfil completo</Button>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '40px 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
            No se encontraron docentes.
          </div>
        )}
      </div>

      {selected && <DocenteDrawer docente={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ─── Drawer de perfil de docente ──────────────────────────────────────────────
function DocenteDrawer({ docente, onClose }: { docente: Teacher; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 440, maxWidth: '92vw', background: '#fff', height: '100%', overflowY: 'auto', padding: 24, boxShadow: '-8px 0 40px rgba(0,0,0,.12)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              style={{
                width: 58, height: 58, borderRadius: 16, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), var(--navy))',
                color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 19,
              }}
            >
              {docente.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{docente.nombre}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>{docente.grado || 'Docente'}</div>
              {docente.email && <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>{docente.email}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f2f5f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {/* Datos generales */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>Información general</SectionTitle>
          <InfoRow label="ID"     value={docente.id} />
          <InfoRow label="Grado"  value={docente.grado || '—'} />
          <InfoRow label="Email"  value={docente.email || '—'} />
        </div>

        {/* Grupos asignados */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>Grupos asignados ({docente.grupos.length})</SectionTitle>
          {docente.grupos.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Sin grupos asignados.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {docente.grupos.map((g) => {
                const info = GROUPS_DATA.find((gd) => gd.id === g)
                return (
                  <span
                    key={g}
                    style={{ padding: '5px 12px', borderRadius: 99, background: 'var(--secondary)', color: 'var(--primary-dark)', fontSize: 12.5, fontWeight: 600 }}
                  >
                    {info?.nombre ?? g}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Materias que imparte */}
        <div>
          <SectionTitle>Materias que imparte ({docente.materias.length})</SectionTitle>
          {docente.materias.length === 0 ? (
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Sin materias asignadas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {docente.materias.map((m, i) => (
                <div
                  key={i}
                  style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
      {children}
    </div>
  )
}
