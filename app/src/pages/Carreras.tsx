import { useState } from 'react'
import { CAREERS, SUBJECTS } from '../data/academic'
import { STUDENTS } from '../data/students'
import { GROUPS_DATA } from '../data/groups'
import { Card, StatCard } from '../components/ui'

export default function Carreras() {
  const [selected, setSelected] = useState<string | null>(null)

  const statsFor = (carrera: typeof CAREERS[number]) => {
    const alumnos = STUDENTS.filter((s) => s.carrera === carrera.nombre || s.carrera?.includes(carrera.siglas))
    const grupos  = GROUPS_DATA.filter((g) => g.carrera === carrera.nombre || g.carrera?.includes(carrera.siglas))
    const materias = SUBJECTS.filter((s) => {
      const g = GROUPS_DATA.find((gd) => gd.id === s.grupo)
      return g && (g.carrera === carrera.nombre || g.carrera?.includes(carrera.siglas))
    })
    const promedio = alumnos.length
      ? (alumnos.reduce((a, s) => a + s.promedio, 0) / alumnos.length).toFixed(1)
      : '—'
    const asistencia = alumnos.length
      ? Math.round(alumnos.reduce((a, s) => a + s.asistencia, 0) / alumnos.length)
      : 0
    return { alumnos: alumnos.length, grupos: grupos.length, materias: materias.length, promedio, asistencia }
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, margin: 0 }}>Carreras</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>
          Oferta educativa institucional vigente con indicadores académicos.
        </p>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <StatCard label="Carreras activas" value={CAREERS.length}   icon="◍" tint="var(--secondary)" />
        <StatCard label="Total alumnos"    value={STUDENTS.length}  icon="◔" tint="#f0faf4" />
        <StatCard label="Total grupos"     value={GROUPS_DATA.length} icon="◫" tint="var(--gold-light)" />
      </div>

      {/* Tarjetas de carreras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {CAREERS.map((c) => {
          const stats = statsFor(c)
          const isOpen = selected === c.id
          return (
            <Card key={c.id} style={{ cursor: 'default' }}>
              {/* Encabezado de carrera */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, color: 'var(--primary-dark)',
                      textTransform: 'uppercase', letterSpacing: '.08em',
                      background: 'var(--secondary)', borderRadius: 6, padding: '2px 8px',
                    }}>{c.nivel}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#fff',
                      background: 'var(--primary)', borderRadius: 6, padding: '2px 8px',
                    }}>{c.siglas}</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{c.nombre}</h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
                    {c.descripcion}
                  </p>
                </div>
              </div>

              {/* Stats cruzadas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '14px 0' }}>
                {[
                  { label: 'Alumnos',   value: stats.alumnos,            color: undefined },
                  { label: 'Grupos',    value: stats.grupos,             color: undefined },
                  { label: 'Promedio',  value: stats.promedio,           color: Number(stats.promedio) >= 9 ? '#15803d' : Number(stats.promedio) >= 8 ? '#9a6a00' : '#a33b3b' },
                  { label: 'Asistencia',value: `${stats.asistencia}%`,  color: stats.asistencia >= 85 ? '#15803d' : stats.asistencia >= 70 ? '#9a6a00' : '#a33b3b' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#f8fafb', borderRadius: 9, padding: '9px 10px', textAlign: 'center' }}>
                    <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</small>
                    <b style={{ fontSize: 16, color: color ?? 'var(--foreground)' }}>{value}</b>
                  </div>
                ))}
              </div>

              {/* Duración y modalidad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                  <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10 }}>Duración</small>
                  <b style={{ fontSize: 13 }}>{c.duracion}</b>
                </div>
                <div style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px' }}>
                  <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10 }}>Modalidad</small>
                  <b style={{ fontSize: 13 }}>{c.modalidad}</b>
                </div>
              </div>

              {/* Expandir para ver grupos */}
              <button
                onClick={() => setSelected(isOpen ? null : c.id)}
                style={{
                  width: '100%', padding: '8px 0', border: '1px solid var(--border)',
                  borderRadius: 8, background: 'transparent', cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 600, color: 'var(--muted-foreground)',
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {isOpen ? '▲ Ocultar grupos' : `▼ Ver grupos (${stats.grupos})`}
              </button>

              {/* Lista de grupos de esta carrera */}
              {isOpen && stats.grupos > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {GROUPS_DATA.filter((g) => g.carrera === c.nombre || g.carrera?.includes(c.siglas)).map((g) => {
                    const alumnosGrupo = STUDENTS.filter((s) => s.grupo === g.id).length
                    return (
                      <div key={g.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: 'var(--secondary)', borderRadius: 8, fontSize: 12.5,
                      }}>
                        <div>
                          <b>{g.nombre}</b>
                          <span style={{ color: 'var(--muted-foreground)', marginLeft: 6 }}>{g.cuatrimestre} · {g.periodo}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{alumnosGrupo} alumnos</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {isOpen && stats.grupos === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 10, marginBottom: 0 }}>
                  Sin grupos registrados para esta carrera.
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
