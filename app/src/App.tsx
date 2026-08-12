import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import PublicPortal from './pages/PublicPortal'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Grupos from './pages/Grupos'
import ControlAlumnado from './pages/ControlAlumnado'
import Docentes from './pages/Docentes'
import Carreras from './pages/Carreras'
import Materias from './pages/Materias'
import Calificaciones from './pages/Calificaciones'
import Asistencia from './pages/Asistencia'
import Horarios from './pages/Horarios'
import Inscripciones from './pages/Inscripciones'
import Kardex from './pages/Kardex'
import Biblioteca from './pages/Biblioteca'
import Inventarios from './pages/Inventarios'
import PlataformaTrabajos from './pages/PlataformaTrabajos'
import Servicios from './pages/Servicios'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import MiEspacio from './pages/MiEspacio'
import { PAGE_TITLES, ROLE_PAGES } from './nav'
import type { PageId, Role, ViewMode } from './types'
import { authService } from './services/auth'
import { loadAppData, loadPublicData } from './services/loadData'

function LoadingScreen({ label }: { label: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--background)' }}>
      <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13.5 }}>{label}</div>
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--background)', padding: 20 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <p style={{ color: '#a33', fontSize: 13.5, marginBottom: 14 }}>{message}</p>
        <button
          onClick={onRetry}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<ViewMode>('public')
  const [role, setRole] = useState<Role>('Administrador')
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [grupoFiltro, setGrupoFiltro] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [publicStats, setPublicStats] = useState({ totalStudents: 0, totalGroups: 0, promedioGlobal: 0, totalCareers: 0 })

  // Al montar: si ya hay sesión guardada, recarga datos de app directamente;
  // si no, carga los datos públicos para el portal.
  useEffect(() => {
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function bootstrap() {
    setStatus('loading')
    try {
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser()
        await loadAppData()
        if (user) setRole(user.role)
        setView('app')
      } else {
        const stats = await loadPublicData()
        setPublicStats(stats)
        setView('public')
      }
      setStatus('ready')
    } catch (err) {
      setErrorMsg('No se pudo conectar con el servidor. Verifica que el backend esté encendido en http://localhost:4000.')
      setStatus('error')
    }
  }

  async function handleLogin(r: Role) {
    setStatus('loading')
    try {
      await loadAppData()
      setRole(r)
      setCurrentPage(ROLE_PAGES[r].includes('dashboard') ? 'dashboard' : ROLE_PAGES[r][0])
      setView('app')
      setStatus('ready')
    } catch (err) {
      setErrorMsg('Se inició sesión, pero no se pudieron cargar los datos del sistema.')
      setStatus('error')
    }
  }

  function handleExit() {
    authService.logout()
    setView('public')
    bootstrap()
  }

  if (status === 'loading') return <LoadingScreen label="Cargando…" />
  if (status === 'error') return <ErrorScreen message={errorMsg} onRetry={bootstrap} />

  if (view === 'public') {
    return <PublicPortal onGoLogin={() => setView('login')} stats={publicStats} />
  }

  if (view === 'login') {
    return <Login onLogin={handleLogin} onBackToPublic={() => setView('public')} />
  }

  const navigate = (page: PageId) => {
    if (page !== 'alumnos') setGrupoFiltro(undefined)
    setCurrentPage(page)
  }

  const openGroup = (grupo: string) => {
    setGrupoFiltro(grupo)
    setCurrentPage('alumnos')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />
      case 'mi-espacio':
        return <MiEspacio onNavigate={navigate} />
      case 'grupos':
        return <Grupos onOpenGroup={openGroup} />
      case 'alumnos':
        return <ControlAlumnado initialGrupo={grupoFiltro} />
      case 'docentes':
        return <Docentes />
      case 'carreras':
        return <Carreras />
      case 'materias':
        return <Materias />
      case 'calificaciones':
        return <Calificaciones />
      case 'asistencia':
        return <Asistencia />
      case 'horarios':
        return <Horarios />
      case 'inscripciones':
        return <Inscripciones />
      case 'kardex':
        return <Kardex />
      case 'biblioteca':
        return <Biblioteca />
      case 'inventarios':
        return <Inventarios />
      case 'plataforma-trabajos':
        return <PlataformaTrabajos />
      case 'servicios':
        return <Servicios />
      case 'reportes':
        return <Reportes />
      case 'configuracion':
        return <Configuracion role={role} />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', overflow: 'hidden' }}>
      <Sidebar currentPage={currentPage} onNavigate={navigate} role={role} onExit={handleExit} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <TopBar title={PAGE_TITLES[currentPage].title} subtitle={PAGE_TITLES[currentPage].subtitle} role={role} />
        <main style={{ flex: 1, overflowY: 'auto' }}>{renderPage()}</main>
      </div>
    </div>
  )
}
