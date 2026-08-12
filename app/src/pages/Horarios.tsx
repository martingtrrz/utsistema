import { useState, useEffect } from 'react'
import { GROUPS } from '../data/students'
import { SCHEDULE_SLOTS } from '../data/academic'
import { TEACHERS } from '../data/teachers'
import { Card, Table, Select, Button } from '../components/ui'
import { authService } from '../services/auth'
import { api } from '../services/api'
import { loadAppData } from '../services/loadData'

export default function Horarios() {
  const [viewMode, setViewMode] = useState<'grupo' | 'docente'>('grupo')
  const [grupo, setGrupo] = useState(GROUPS[0])
  const [docente, setDocente] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Inicializar docente cuando la lista se cargue
  useEffect(() => {
    if (TEACHERS.length > 0 && !docente) {
      setDocente(TEACHERS[0].nombre)
    }
  }, [docente])

  const slots = viewMode === 'grupo'
    ? SCHEDULE_SLOTS.filter((s) => s.grupo === grupo)
    : SCHEDULE_SLOTS.filter((s) => s.docente === docente)

  const user = authService.getCurrentUser()
  const isAdmin = user?.role === 'Administrador' || user?.role === 'Control Escolar'

  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

  // Extraer las horas únicas y ordenarlas cronológicamente por su hora de inicio
  const uniqueHours = Array.from(new Set(slots.map((s) => s.hora))).sort((a, b) => {
    const getStart = (h: string) => {
      const match = h.match(/(\d{2}):(\d{2})/)
      if (!match) return 0
      return parseInt(match[1], 10) + parseInt(match[2], 10) / 60
    }
    return getStart(a) - getStart(b)
  })

  const handleGenerate = async () => {
    const confirmGen = window.confirm(
      '¿Estás seguro de que deseas generar nuevos horarios para el cuatrimestre? Esto reemplazará el horario actual.'
    )
    if (!confirmGen) return

    setGenerating(true)
    setProgress(0)
    setStatus(null)

    // Simulación de carga fluida
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90
        const increment = Math.max(1, Math.floor((95 - prev) * 0.12))
        return prev + increment
      })
    }, 150)

    try {
      const res = await api.post<{ message: string }>('/schedules/generate')
      clearInterval(interval)
      setProgress(100)

      // Breve retraso para que el usuario pueda ver el 100%
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Recargar datos globales de la aplicación para actualizar los horarios mostrados en pantalla
      await loadAppData()
      setStatus({
        message: res.message || 'Horarios generados y guardados correctamente.',
        type: 'success',
      })
    } catch (err: any) {
      clearInterval(interval)
      setProgress(0)
      console.error(err)
      setStatus({
        message: err.message || 'Error al intentar generar los horarios.',
        type: 'error',
      })
    } finally {
      setTimeout(() => {
        setGenerating(false)
        setProgress(0)
      }, 500)
    }
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {generating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: '#f3f4f6',
          zIndex: 9999,
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--primary)',
            transition: 'width 0.2s ease-out',
            boxShadow: '0 0 10px var(--primary)',
          }} />
        </div>
      )}
      {status && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: status.type === 'success' ? 'rgba(25, 183, 124, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'var(--primary)' : '#ef4444'}`,
            color: status.type === 'success' ? 'var(--primary-dark)' : '#b91c1c',
            fontSize: 13.5,
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{status.message}</span>
          <button
            onClick={() => setStatus(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Horarios</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Horario semanal por grupo o profesor.</p>
          
          {/* Segmented Control / Tabs */}
          <div style={{ display: 'flex', gap: 4, background: '#e5eaee', padding: 4, borderRadius: 8, marginTop: 12, width: 'max-content' }}>
            <button
              onClick={() => setViewMode('grupo')}
              style={{
                border: 'none',
                background: viewMode === 'grupo' ? '#fff' : 'transparent',
                color: viewMode === 'grupo' ? 'var(--foreground)' : 'var(--muted-foreground)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'grupo' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                transform: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Por Grupo
            </button>
            <button
              onClick={() => setViewMode('docente')}
              style={{
                border: 'none',
                background: viewMode === 'docente' ? '#fff' : 'transparent',
                color: viewMode === 'docente' ? 'var(--foreground)' : 'var(--muted-foreground)',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'docente' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                transform: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Por Profesor
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && (
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                borderColor: generating ? 'var(--border)' : 'var(--primary)',
                boxShadow: generating ? 'none' : '0 4px 10px rgba(0, 0, 0, 0.08)',
              }}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg
                    style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </span>
              ) : (
                'Generar Horarios'
              )}
            </Button>
          )}
          {viewMode === 'grupo' ? (
            <Select value={grupo} onChange={setGrupo} options={[...GROUPS]} />
          ) : (
            <Select
              value={docente}
              onChange={setDocente}
              options={Array.from(new Set(TEACHERS.map((t) => t.nombre))).sort()}
            />
          )}
        </div>
      </div>

      {generating && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: '4px solid var(--primary)', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
            <span style={{ color: 'var(--foreground)' }}>Generando horarios optimizados con Inteligencia Artificial...</span>
            <span style={{ color: 'var(--primary-dark)' }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#e5eaee', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                borderRadius: 4,
                transition: 'width 0.15s ease-out',
              }}
            />
          </div>
          <small style={{ color: 'var(--muted-foreground)', fontSize: 11.5, display: 'block' }}>
            El solver de programación lineal CP-SAT está analizando combinaciones de aulas, docentes y restricciones de horarios...
          </small>
        </Card>
      )}
      {uniqueHours.length === 0 ? (
        <Card style={{ display: 'grid', placeItems: 'center', padding: 48, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Sin horario disponible</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0 }}>
              No se han encontrado registros de horarios para este grupo.
            </p>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 16 }}>
          <Table headers={['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']}>
            {uniqueHours.map((hour, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--navy)', width: 120, verticalAlign: 'middle' }}>
                  {hour}
                </td>
                {DAYS.map((day) => {
                  const slot = slots.find((s) => s.dia === day && s.hora === hour)
                  return (
                    <td key={day} style={{ padding: '8px', verticalAlign: 'top', width: '18%' }}>
                      {slot ? (
                        <div
                          style={{
                            background: 'var(--secondary)',
                            borderLeft: '4px solid var(--primary)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                            transition: 'transform 0.15s ease',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--foreground)', lineHeight: 1.25 }}>
                            {slot.materia}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontWeight: 500 }}>
                            {viewMode === 'grupo' ? slot.docente : `Grupo: ${slot.grupo}`}
                          </div>
                          <div
                            style={{
                              alignSelf: 'flex-start',
                              fontSize: 9,
                              fontWeight: 700,
                              background: 'var(--navy)',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: 4,
                              marginTop: 4,
                            }}
                          >
                            {slot.aula}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            minHeight: 70,
                            border: '1px dashed var(--border)',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#b0bcd4',
                            fontSize: 14,
                          }}
                        >
                          -
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  )
}
