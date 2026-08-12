import { TEACHERS } from '../data/teachers'
import { Card, Button } from '../components/ui'

export default function Docentes() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Docentes</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Directorio académico y carga de grupos.</p>
        </div>
        <Button variant="primary" small>+ Nuevo docente</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {TEACHERS.map((t) => (
          <Card key={t.id}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,var(--primary),var(--navy))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 16, marginBottom: 12 }}>
              {t.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{t.nombre}</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 12, margin: 0 }}>Docente · Tecnologías de la Información</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, margin: '16px 0' }}>
              <div style={{ background: '#f8fafb', borderRadius: 10, padding: 10 }}>
                <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10 }}>Grupos</small>
                <b style={{ fontSize: 14 }}>{t.grupos.length}</b>
              </div>
              <div style={{ background: '#f8fafb', borderRadius: 10, padding: 10 }}>
                <small style={{ display: 'block', color: 'var(--muted-foreground)', fontSize: 10 }}>Materias</small>
                <b style={{ fontSize: 14 }}>{t.materias.length}</b>
              </div>
            </div>
            <Button variant="secondary">Ver perfil</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
