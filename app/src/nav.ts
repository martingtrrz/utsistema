import type { PageId, Role } from './types'
import type { IconName } from './components/Icon'
export interface NavItem { id: PageId; label: string; icon: IconName }
export interface NavGroup { label: string; items: NavItem[] }
export const NAV: NavGroup[] = [
  { label: 'General',  items: [{ id: 'dashboard',           label: 'Dashboard',             icon: 'grid'     }, { id: 'mi-espacio', label: 'Mi espacio', icon: 'student' }, { id: 'grupos', label: 'Grupos', icon: 'users' }, { id: 'docentes', label: 'Docentes', icon: 'teacher' }] },
  { label: 'Alumnos',  items: [{ id: 'alumnos',             label: 'Alumnos',               icon: 'student'  }, { id: 'calificaciones', label: 'Calificaciones', icon: 'check' }, { id: 'asistencia', label: 'Asistencia', icon: 'calendar' }, { id: 'inscripciones', label: 'Inscripciones', icon: 'file' }, { id: 'kardex', label: 'Kardex', icon: 'file' }] },
  { label: 'Académico',items: [{ id: 'carreras',            label: 'Carreras',              icon: 'target'   }, { id: 'materias', label: 'Materias', icon: 'book' }, { id: 'horarios', label: 'Horarios', icon: 'calendar' }] },
  { label: 'Servicios',items: [{ id: 'biblioteca',          label: 'Biblioteca',            icon: 'library'  }, { id: 'inventarios', label: 'Inventarios', icon: 'box' }, { id: 'plataforma-trabajos', label: 'Plataforma de Trabajos', icon: 'briefcase' }, { id: 'servicios', label: 'Servicios', icon: 'service' }] },
  { label: 'Sistema',  items: [{ id: 'reportes',            label: 'Reportes',              icon: 'chart'    }, { id: 'configuracion', label: 'Configuración', icon: 'settings' }] },
]
export const ALL_PAGE_IDS: PageId[] = NAV.flatMap((g) => g.items.map((i) => i.id))
export const ROLE_PAGES: Record<Role, PageId[]> = {
  Administrador:    ALL_PAGE_IDS.filter((id) => id !== 'mi-espacio'),
  'Control Escolar':ALL_PAGE_IDS.filter((id) => id !== 'mi-espacio'),
  Docente:          ['dashboard', 'grupos', 'alumnos', 'docentes', 'materias', 'calificaciones', 'asistencia', 'horarios', 'kardex', 'biblioteca', 'plataforma-trabajos', 'servicios'],
  Alumno:           ['dashboard', 'mi-espacio', 'calificaciones', 'asistencia', 'horarios', 'kardex', 'biblioteca', 'plataforma-trabajos', 'servicios'],
}
export const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  dashboard:            { title: 'Dashboard',              subtitle: 'Resumen académico · Periodo Enero – Abril 2025' },
  'mi-espacio':         { title: 'Mi espacio',             subtitle: 'Servicios académicos del estudiante' },
  grupos:               { title: 'Grupos',                 subtitle: 'Grupos activos de Tecnologías de la Información' },
  alumnos:              { title: 'Alumnos',                subtitle: 'Expedientes, grupos y seguimiento académico' },
  docentes:             { title: 'Docentes',               subtitle: 'Directorio académico y carga de grupos' },
  carreras:             { title: 'Carreras',               subtitle: 'Oferta educativa institucional' },
  materias:             { title: 'Materias',               subtitle: 'Catálogo de asignaturas por grupo' },
  calificaciones:       { title: 'Calificaciones',         subtitle: 'Evidencias · conocimiento · desempeño · actitud · examen' },
  asistencia:           { title: 'Asistencia',             subtitle: 'Seguimiento de asistencia por alumno y grupo' },
  horarios:             { title: 'Horarios',               subtitle: 'Horario semanal por grupo' },
  inscripciones:        { title: 'Inscripciones',          subtitle: 'Estatus de inscripción por materia' },
  kardex:               { title: 'Kardex',                 subtitle: 'Historial académico por alumno' },
  biblioteca:           { title: 'Biblioteca',             subtitle: 'Acervo, préstamos y devoluciones' },
  inventarios:          { title: 'Inventarios',            subtitle: 'Control de activos y equipo · Escáner de laboratorio' },
  'plataforma-trabajos':{ title: 'Plataforma de Trabajos', subtitle: 'Entrega y revisión de tareas y proyectos' },
  servicios:            { title: 'Servicios',              subtitle: 'Trámites escolares y soporte / incidencias' },
  reportes:             { title: 'Reportes',               subtitle: 'Reportes académicos y administrativos' },
  configuracion:        { title: 'Configuración',          subtitle: 'Perfil, usuarios, roles y configuración académica' },
}

