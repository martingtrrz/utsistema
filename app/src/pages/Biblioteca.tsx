import { useState } from 'react'
import { ALUMNOS } from '../data/alumnos'
import { Card, StatCard, Badge, Button, Input, Table, Tabs } from '../components/ui'

interface Libro {
  isbn: string
  titulo: string
  autor: string
  categoria: string
  ejemplares: number
  disponibles: number
}

const CATALOGO: Libro[] = [
  { isbn: '978-607-15-1234', titulo: 'Estructuras de Datos y Algoritmos', autor: 'Aho, Hopcroft & Ullman', categoria: 'Programación', ejemplares: 6, disponibles: 2 },
  { isbn: '978-607-15-2211', titulo: 'Redes de Computadoras', autor: 'Andrew S. Tanenbaum', categoria: 'Redes', ejemplares: 4, disponibles: 4 },
  { isbn: '978-607-15-3390', titulo: 'Bases de Datos: Diseño y Gestión', autor: 'Ramez Elmasri', categoria: 'Bases de Datos', ejemplares: 5, disponibles: 1 },
  { isbn: '978-607-15-4471', titulo: 'Ingeniería de Software Moderna', autor: 'Ian Sommerville', categoria: 'Software', ejemplares: 3, disponibles: 0 },
  { isbn: '978-607-15-5502', titulo: 'Metodología de la Investigación', autor: 'Roberto Hernández Sampieri', categoria: 'General', ejemplares: 8, disponibles: 5 },
  { isbn: '978-607-15-6689', titulo: 'Seguridad Informática y Ciberseguridad', autor: 'Álvaro Gómez Vieites', categoria: 'Seguridad', ejemplares: 3, disponibles: 3 },
]

interface Prestamo {
  id: string
  libro: string
  alumno: string
  fechaPrestamo: string
  fechaLimite: string
  status: 'Vigente' | 'Vencido' | 'Devuelto'
}

function buildPrestamos(): Prestamo[] {
  const alumnosMuestra = ALUMNOS.slice(0, 5)
  if (alumnosMuestra.length < 5) return []
  return [
    { id: 'P-1001', libro: 'Estructuras de Datos y Algoritmos', alumno: alumnosMuestra[0].nombre, fechaPrestamo: '2026-07-28', fechaLimite: '2026-08-11', status: 'Vigente' },
    { id: 'P-1002', libro: 'Bases de Datos: Diseño y Gestión', alumno: alumnosMuestra[1].nombre, fechaPrestamo: '2026-07-15', fechaLimite: '2026-07-29', status: 'Vencido' },
    { id: 'P-1003', libro: 'Ingeniería de Software Moderna', alumno: alumnosMuestra[2].nombre, fechaPrestamo: '2026-07-30', fechaLimite: '2026-08-13', status: 'Vigente' },
    { id: 'P-1004', libro: 'Metodología de la Investigación', alumno: alumnosMuestra[3].nombre, fechaPrestamo: '2026-07-01', fechaLimite: '2026-07-15', status: 'Devuelto' },
    { id: 'P-1005', libro: 'Ingeniería de Software Moderna', alumno: alumnosMuestra[4].nombre, fechaPrestamo: '2026-08-02', fechaLimite: '2026-08-16', status: 'Vigente' },
  ]
}

const STATUS_STYLE: Record<Prestamo['status'], { bg: string; color: string }> = {
  Vigente: { bg: '#eff6ff', color: '#1d4ed8' },
  Vencido: { bg: '#fef2f2', color: '#b91c1c' },
  Devuelto: { bg: '#f0faf4', color: '#15803d' },
}

export default function Biblioteca() {
  const [tab, setTab] = useState('catalogo')
  const [query, setQuery] = useState('')

  const PRESTAMOS = buildPrestamos()

  const catalogoFiltrado = CATALOGO.filter(
    (l) => query.trim() === '' || l.titulo.toLowerCase().includes(query.toLowerCase()) || l.autor.toLowerCase().includes(query.toLowerCase())
  )

  const vigentes = PRESTAMOS.filter((p) => p.status === 'Vigente').length
  const vencidos = PRESTAMOS.filter((p) => p.status === 'Vencido').length

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Títulos en acervo" value={CATALOGO.length} icon="▨" tint="var(--secondary)" />
        <StatCard label="Ejemplares totales" value={CATALOGO.reduce((s, l) => s + l.ejemplares, 0)} icon="▧" tint="var(--gold-light)" />
        <StatCard label="Préstamos vigentes" value={vigentes} icon="◔" tint="#eff6ff" />
        <StatCard label="Préstamos vencidos" value={vencidos} icon="◈" tint="#fef2f2" />
      </div>

      <Card>
        <Tabs
          tabs={[
            { id: 'catalogo', label: 'Catálogo' },
            { id: 'prestamos', label: 'Préstamos' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'catalogo' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
              <Input value={query} onChange={setQuery} placeholder="Buscar por título o autor…" style={{ minWidth: 260 }} />
              <Button variant="primary" small>+ Registrar título</Button>
            </div>
            <Table headers={['ISBN', 'Título', 'Autor', 'Categoría', 'Ejemplares', 'Disponibles']}>
              {catalogoFiltrado.map((l) => (
                <tr key={l.isbn} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11.5 }}>{l.isbn}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{l.titulo}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{l.autor}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{l.categoria}</td>
                  <td style={{ padding: '10px 12px' }}>{l.ejemplares}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      text={`${l.disponibles} disp.`}
                      bg={l.disponibles > 0 ? '#f0faf4' : '#fef2f2'}
                      color={l.disponibles > 0 ? '#15803d' : '#b91c1c'}
                    />
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}

        {tab === 'prestamos' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Button variant="primary" small>+ Nuevo préstamo</Button>
            </div>
            <Table headers={['Folio', 'Libro', 'Alumno', 'Préstamo', 'Límite', 'Status']}>
              {PRESTAMOS.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.libro}</td>
                  <td style={{ padding: '10px 12px' }}>{p.alumno}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{p.fechaPrestamo}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted-foreground)' }}>{p.fechaLimite}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge text={p.status} bg={STATUS_STYLE[p.status].bg} color={STATUS_STYLE[p.status].color} />
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </div>
  )
}