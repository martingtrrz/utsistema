import { useState } from 'react'
import { Card, StatCard, Badge, Button, Input, Table } from '../components/ui'

interface Activo {
  id: string
  nombre: string
  categoria: string
  ubicacion: string
  responsable: string
  status: 'Disponible' | 'En uso' | 'Prestado' | 'En reparación' | 'Baja'
  valor: string
  qr: string
}

const ACTIVOS: Activo[] = [
  { id: 'INV-2024-001', nombre: 'Laptop Dell Inspiron 15', categoria: 'Cómputo', ubicacion: 'Lab TI A-204', responsable: 'Dr. Ramírez', status: 'Disponible', valor: '$14,500', qr: 'QR-A001' },
  { id: 'INV-2024-002', nombre: 'Proyector Epson PowerLite', categoria: 'Audio/Video', ubicacion: 'Aula B-106', responsable: 'Administración', status: 'En uso', valor: '$9,800', qr: 'QR-A002' },
  { id: 'INV-2023-089', nombre: 'Osciloscopio Digital 4CH', categoria: 'Laboratorio', ubicacion: 'Lab Electrónica', responsable: 'Ing. Castro', status: 'Disponible', valor: '$22,000', qr: 'QR-B089' },
  { id: 'INV-2023-045', nombre: 'Impresora 3D Ultimaker S3', categoria: 'Manufactura', ubicacion: 'Lab Mecatrónica', responsable: 'Tec. Flores', status: 'En reparación', valor: '$38,000', qr: 'QR-C045' },
  { id: 'INV-2022-011', nombre: 'Servidor HPE ProLiant DL', categoria: 'Infraestructura', ubicacion: 'Centro Cómputo', responsable: 'TI Institucional', status: 'Disponible', valor: '$85,000', qr: 'QR-D011' },
  { id: 'INV-2024-018', nombre: 'Tablet Samsung Galaxy Tab', categoria: 'Cómputo', ubicacion: 'Préstamos', responsable: 'Biblioteca', status: 'Prestado', valor: '$7,200', qr: 'QR-A018' },
  { id: 'INV-2024-027', nombre: 'Switch Cisco 24 puertos', categoria: 'Redes', ubicacion: 'Lab Redes A-201', responsable: 'Ing. Duarte', status: 'Disponible', valor: '$11,300', qr: 'QR-E027' },
  { id: 'INV-2023-060', nombre: 'Scanner de código de barras', categoria: 'Cómputo', ubicacion: 'Control Escolar', responsable: 'Servicios Escolares', status: 'En uso', valor: '$1,850', qr: 'QR-F060' },
]

const STATUS_STYLES: Record<Activo['status'], { bg: string; color: string }> = {
  Disponible: { bg: '#f0faf4', color: '#15803d' },
  'En uso': { bg: '#eff6ff', color: '#1d4ed8' },
  Prestado: { bg: '#fefce8', color: '#a16207' },
  'En reparación': { bg: '#fff7ed', color: '#c2410c' },
  Baja: { bg: '#fef2f2', color: '#b91c1c' },
}

export default function Inventarios() {
  const [query, setQuery] = useState('')
  const [scanCode, setScanCode] = useState('')
  const [scanResult, setScanResult] = useState<Activo | null | 'not-found'>(null)
  const [scanning, setScanning] = useState(false)

  const filtered = ACTIVOS.filter(
    (a) =>
      query.trim() === '' ||
      a.nombre.toLowerCase().includes(query.toLowerCase()) ||
      a.id.toLowerCase().includes(query.toLowerCase())
  )

  function runScan(code: string) {
    const found = ACTIVOS.find((a) => a.qr.toLowerCase() === code.toLowerCase() || a.id.toLowerCase() === code.toLowerCase())
    setScanResult(found ?? 'not-found')
  }

  function simulateCameraScan() {
    setScanning(true)
    setTimeout(() => {
      const random = ACTIVOS[Math.floor(Math.random() * ACTIVOS.length)]
      setScanCode(random.qr)
      setScanResult(random)
      setScanning(false)
    }, 1200)
  }

  const stats = {
    total: ACTIVOS.length,
    disponibles: ACTIVOS.filter((a) => a.status === 'Disponible').length,
    enUso: ACTIVOS.filter((a) => a.status === 'En uso' || a.status === 'Prestado').length,
    reparacion: ACTIVOS.filter((a) => a.status === 'En reparación').length,
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Activos registrados" value={stats.total} icon="▩" tint="var(--secondary)" />
        <StatCard label="Disponibles" value={stats.disponibles} icon="✓" tint="#f0faf4" />
        <StatCard label="En uso / prestado" value={stats.enUso} icon="◔" tint="#eff6ff" />
        <StatCard label="En reparación" value={stats.reparacion} icon="◈" tint="#fff7ed" />
      </div>

      {/* Scanner - pantalla de laboratorio */}
      <Card style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #123a7a 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Escáner de equipo — Pantalla de Laboratorio</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, maxWidth: 420 }}>
              Escanea el código QR/código de barras de un activo para consultar su estado al instante, o captura el código
              manualmente.
            </div>
          </div>
          <Badge text="Modo laboratorio" bg="rgba(255,255,255,0.18)" color="#fff" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            value={scanCode}
            onChange={setScanCode}
            placeholder="Código QR / ID de activo (ej. QR-A001)"
            style={{ minWidth: 260, background: '#fff' }}
          />
          <Button variant="gold" onClick={() => runScan(scanCode)}>
            Buscar código
          </Button>
          <Button variant="secondary" onClick={simulateCameraScan}>
            {scanning ? 'Escaneando…' : 'Escanear con cámara'}
          </Button>
        </div>

        {scanResult && (
          <div
            style={{
              marginTop: 16,
              background: '#fff',
              borderRadius: 10,
              padding: 16,
              color: 'var(--foreground)',
            }}
          >
            {scanResult === 'not-found' ? (
              <div style={{ color: '#b91c1c', fontSize: 13.5, fontWeight: 600 }}>
                No se encontró ningún activo con el código "{scanCode}".
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{scanResult.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {scanResult.id} · {scanResult.ubicacion} · Responsable: {scanResult.responsable}
                  </div>
                </div>
                <Badge text={scanResult.status} bg={STATUS_STYLES[scanResult.status].bg} color={STATUS_STYLES[scanResult.status].color} />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
          <Input value={query} onChange={setQuery} placeholder="Buscar activo por nombre o folio…" style={{ minWidth: 260 }} />
          <Button variant="primary" small>
            + Registrar activo
          </Button>
        </div>
        <Table headers={['Folio', 'Nombre', 'Categoría', 'Ubicación', 'Responsable', 'Valor', 'Status']}>
          {filtered.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{a.id}</td>
              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{a.nombre}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.categoria}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.ubicacion}</td>
              <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{a.responsable}</td>
              <td style={{ padding: '10px 12px' }}>{a.valor}</td>
              <td style={{ padding: '10px 12px' }}>
                <Badge text={a.status} bg={STATUS_STYLES[a.status].bg} color={STATUS_STYLES[a.status].color} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
