import { useEffect, useState } from 'react'
import { authService } from '../services/auth'
import { gradeService, attendanceService, type KardexResponse } from '../services'
import { STUDENTS } from '../data/students'
import { SCHEDULE_SLOTS } from '../data/academic'
import { Card, ProgressBar, Button } from '../components/ui'
import { Icon } from '../components/Icon'
import type { PageId } from '../types'

interface Props {
  onNavigate: (page: PageId) => void
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export default function MiEspacio({ onNavigate }: Props) {
  const user    = authService.getCurrentUser()
  const student = STUDENTS.find((s) => s.id === user?.studentId)

  const [kardex,      setKardex]      = useState<KardexResponse | null>(null)
  const [attendance,  setAttendance]  = useState<any>(null)
  const [loadingK,    setLoadingK]    = useState(false)
  const [surveySent,  setSurveySent]  = useState(false)

  // Si hay alumno logueado, carga su kardex y asistencia
  useEffect(() => {
    if (!user?.studentId) return
    setLoadingK(true)
    gradeService.kardex(user.studentId)
      .then((k) => setKardex(k))
      .catch(() => {})
      .finally(() => setLoadingK(false))
    attendanceService.forStudent(user.studentId)
      .then((a) => setAttendance(a))
      .catch(() => {})
  }, [user?.studentId])

  const horario     = student ? SCHEDULE_SLOTS.filter((s) => s.grupo === student.grupo) : []
  const isAlumno    = user?.role === 'Alumno' && student

  // ─── Vista para Alumno logueado ──────────────────────────────────────────
  if (isAlumno) {
    const attPct = attendance?.porcentaje ?? student.asistencia
    const avg    = kardex?.resumen.promedioGeneral ?? student.promedio

    return (
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Saludo */}
        <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--navy))', borderRadius: 18, padding: '24px 28px', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', opacity: .75 }}>Portal del estudiante</div>
          <h1 style={{ fontSize: 26, margin: '8px 0 4px', fontWeight: 800 }}>Hola, {student.nombre.split(' ')[0]} 👋</h1>
          <p style={{ opacity: .8, margin: 0, fontSize: 13 }}>
            {student.expediente} · {student.grupo} · {student.carrera}
          </p>

          {/* KPIs inline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
            {[
              { label: 'Promedio', value: avg.toFixed(1), color: avg >= 9 ? '#4ade80' : avg >= 8 ? '#fbbf24' : '#f87171' },
              { label: 'Asistencia', value: `${attPct}%`, color: attPct >= 85 ? '#4ade80' : attPct >= 70 ? '#fbbf24' : '#f87171' },
              { label: 'Materias cursadas', value: String(kardex?.resumen.totalMaterias ?? 0), color: '#fff' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '12px 16px' }}>
                <small style={{ display: 'block', opacity: .7, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</small>
                <b style={{ fontSize: 22, color }}>{loadingK && label !== 'Asistencia' ? '…' : value}</b>
              </div>
            ))}
          </div>
        </div>

        {/* Grid principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* Acciones rápidas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card>
              <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Accesos rápidos</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {([
                  { page: 'calificaciones' as PageId, icon: 'check'    as const, label: 'Mis calificaciones',  sub: 'Ver parciales y promedio'         },
                  { page: 'kardex'         as PageId, icon: 'file'     as const, label: 'Mi Kardex',           sub: 'Historial académico oficial'       },
                  { page: 'asistencia'     as PageId, icon: 'calendar' as const, label: 'Mi Asistencia',       sub: `${attPct}% de asistencia`          },
                  { page: 'servicios'      as PageId, icon: 'briefcase'as const, label: 'Servicios y trámites',sub: 'Solicitar constancias y más'        },
                ]).map(({ page, icon, label, sub }) => (
                  <button
                    key={page}
                    onClick={() => onNavigate(page)}
                    style={{
                      display: 'flex', gap: 12, alignItems: 'center', padding: 11,
                      border: '1px solid var(--border)', borderRadius: 11, cursor: 'pointer',
                      background: 'transparent', textAlign: 'left', width: '100%', transition: 'background .15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--secondary)', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'var(--primary-dark)' }}>
                      <Icon name={icon} size={17} />
                    </div>
                    <div>
                      <b style={{ fontSize: 13, display: 'block' }}>{label}</b>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Calificaciones recientes */}
            {kardex && kardex.cuatrimestres.length > 0 && (
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15 }}>Calificaciones recientes</h3>
                  <Button variant="ghost" small onClick={() => onNavigate('calificaciones')}>Ver todo</Button>
                </div>
                {kardex.cuatrimestres[kardex.cuatrimestres.length - 1].materias.slice(0, 5).map((m) => (
                  <div key={m.subjectId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{m.materia}</span>
                    <b style={{ color: m.final >= 9 ? '#15803d' : m.final >= 8 ? '#9a6a00' : '#a33b3b' }}>{m.final.toFixed(1)} · {m.letra}</b>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Asistencia + Horario */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Asistencia */}
            <Card>
              <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Mi asistencia</h3>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Porcentaje</span>
                  <b style={{ color: attPct >= 85 ? '#15803d' : attPct >= 70 ? '#9a6a00' : '#a33b3b' }}>{attPct}%</b>
                </div>
                <ProgressBar value={attPct} color={attPct >= 85 ? 'var(--primary)' : attPct >= 70 ? '#f59e0b' : '#ef4444'} />
              </div>
              {attendance && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
                  {[['Asistencias', attendance.asistencias, '#15803d'], ['Faltas', attendance.faltas, '#a33b3b'], ['Retardos', attendance.retardos, '#9a6a00']].map(([label, val, color]) => (
                    <div key={label as string} style={{ background: '#f8fafb', borderRadius: 9, padding: '8px 10px', textAlign: 'center' }}>
                      <b style={{ display: 'block', fontSize: 17, color: color as string }}>{val}</b>
                      <small style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>{label}</small>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Mini horario */}
            {horario.length > 0 && (
              <Card>
                <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Mi horario</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {DAYS.map((day) => {
                    const clases = horario.filter((h) => h.dia === day)
                    if (!clases.length) return null
                    return (
                      <div key={day}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '7px 0 3px' }}>{day}</div>
                        {clases.map((c, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <span style={{ color: 'var(--muted-foreground)', minWidth: 70 }}>{c.hora}</span>
                            <span style={{ fontWeight: 500 }}>{c.materia}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
                <Button variant="ghost" small onClick={() => onNavigate('horarios')} style={{ marginTop: 10 }}>
                  Ver horario completo
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Vista para roles no-alumno (Admin, Docente, etc.) ───────────────────
  const actions: { title: string; description: string; icon: 'chart' | 'file' | 'check' | 'users'; action: () => void; button: string }[] = [
    { title: 'Mis calificaciones', description: 'Consulta los registros de calificaciones del sistema.', icon: 'chart', action: () => onNavigate('calificaciones'), button: 'Ver calificaciones' },
    { title: 'Mi Kardex', description: 'Genera el historial académico oficial de cualquier alumno.', icon: 'file', action: () => onNavigate('kardex'), button: 'Abrir Kardex' },
    { title: 'Encuesta estudiantil', description: 'Comparte tu experiencia para mejorar los servicios universitarios.', icon: 'check', action: () => setSurveySent(true), button: surveySent ? 'Encuesta enviada' : 'Responder encuesta' },
  ]

  return (
    <div style={{ padding: 28, maxWidth: 1180, margin: '0 auto' }}>
      <span style={{ color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '.12em', fontSize: 11, fontWeight: 800 }}>
        Portal institucional
      </span>
      <h1 style={{ fontSize: 34, margin: '7px 0 8px' }}>Mi espacio académico</h1>
      <p style={{ color: 'var(--muted-foreground)', maxWidth: 640, margin: 0, lineHeight: 1.7, fontSize: 13.5 }}>
        Consulta información escolar y completa trámites desde un solo lugar.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 30 }}>
        {actions.map((item) => (
          <article
            key={item.title}
            style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 25, minHeight: 230, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--secondary)', color: 'var(--primary-dark)', display: 'grid', placeItems: 'center' }}>
              <Icon name={item.icon} size={23} />
            </div>
            <h2 style={{ fontSize: 20, margin: '16px 0 8px' }}>{item.title}</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.65, margin: '0 0 auto' }}>{item.description}</p>
            <button
              onClick={item.action}
              disabled={item.title === 'Encuesta estudiantil' && surveySent}
              style={{
                marginTop: 16, alignSelf: 'flex-start', border: 0, borderRadius: 9,
                padding: '10px 14px', background: 'var(--primary)', color: '#fff', fontWeight: 800,
                cursor: (item.title === 'Encuesta estudiantil' && surveySent) ? 'default' : 'pointer',
                opacity: (item.title === 'Encuesta estudiantil' && surveySent) ? .72 : 1,
              }}
            >
              {item.button}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
