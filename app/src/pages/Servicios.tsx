import { useState } from 'react'
import { TICKETS } from '../data/services'
import { Card, Table, Badge, Tabs, Button } from '../components/ui'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  'En proceso': { bg: '#fff4dc', color: '#9a6a00' },
  'Listo para recoger': { bg: '#eff6ff', color: '#1d4ed8' },
  Entregado: { bg: '#f0faf4', color: '#15803d' },
  Rechazado: { bg: '#fde9e9', color: '#a33b3b' },
  Abierto: { bg: '#fde9e9', color: '#a33b3b' },
  Resuelto: { bg: '#f0faf4', color: '#15803d' },
}

export default function Servicios() {
  const [tab, setTab] = useState<'tramites' | 'soporte'>('tramites')
  const rows = TICKETS.filter((t) => (tab === 'tramites' ? t.categoria === 'Trámite escolar' : t.categoria === 'Soporte / Incidencia'))

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>Servicios</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '6px 0 0' }}>Trámites escolares, solicitudes, tickets e incidencias.</p>
        </div>
        <Button variant="primary" small>+ Nueva solicitud</Button>
      </div>

      <Card>
        <Tabs
          tabs={[
            { id: 'tramites', label: 'Trámites escolares' },
            { id: 'soporte', label: 'Soporte / Incidencias' },
          ]}
          active={tab}
          onChange={(id) => setTab(id as 'tramites' | 'soporte')}
        />
        <Table headers={['Folio', 'Solicitante', 'Tipo', 'Fecha', 'Status']}>
          {rows.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{t.folio}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{t.solicitante}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{t.tipo}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{t.fecha}</td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={t.status} bg={STATUS_STYLE[t.status].bg} color={STATUS_STYLE[t.status].color} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
