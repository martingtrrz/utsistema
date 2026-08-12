import { useState } from 'react'
import { Icon } from '../components/Icon'
import type { PageId } from '../types'

export default function MiEspacio({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [surveySent, setSurveySent] = useState(false)
  const actions: { title: string; description: string; icon: 'chart' | 'file' | 'check'; action: () => void; button: string }[] = [
    { title: 'Mis calificaciones', description: 'Consulta tus parciales, promedio y materias cursadas.', icon: 'chart', action: () => onNavigate('calificaciones'), button: 'Ver calificaciones' },
    { title: 'Mi Kardex', description: 'Genera tu historial académico oficial y envíalo a impresión.', icon: 'file', action: () => onNavigate('kardex'), button: 'Abrir Kardex' },
    { title: 'Encuesta estudiantil', description: 'Comparte tu experiencia para mejorar los servicios universitarios.', icon: 'check', action: () => setSurveySent(true), button: surveySent ? 'Encuesta enviada' : 'Responder encuesta' },
  ]
  return <div style={{ padding: 28, maxWidth: 1180, margin: '0 auto' }}>
    <span style={{ color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '.12em', fontSize: 11, fontWeight: 800 }}>Portal del estudiante</span>
    <h1 style={{ fontSize: 38, margin: '7px 0 8px' }}>Mi espacio académico</h1>
    <p style={{ color: 'var(--muted-foreground)', maxWidth: 640, margin: 0, lineHeight: 1.7 }}>Consulta tu información escolar y completa tus trámites desde un solo lugar.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 30 }}>
      {actions.map((item) => <article key={item.title} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 18, padding: 25, minHeight: 230, display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--secondary)', color: 'var(--primary-dark)', display: 'grid', placeItems: 'center' }}><Icon name={item.icon} size={23} /></div>
        <h2 style={{ fontSize: 23, margin: '20px 0 8px' }}>{item.title}</h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{item.description}</p>
        <button onClick={item.action} disabled={item.title === 'Encuesta estudiantil' && surveySent} style={{ marginTop: 'auto', alignSelf: 'flex-start', border: 0, borderRadius: 9, padding: '10px 14px', background: 'var(--primary)', color: '#fff', fontWeight: 800, cursor: surveySent ? 'default' : 'pointer', opacity: surveySent && item.title === 'Encuesta estudiantil' ? .72 : 1 }}>{item.button}</button>
      </article>)}
    </div>
  </div>
}
