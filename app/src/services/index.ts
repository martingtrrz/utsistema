// Capa de servicios real: cada función habla con la API REST (backend Express/MySQL)
// en vez de devolver arreglos en memoria. Úsala para altas/bajas/cambios desde las
// páginas; para lectura de listados ya poblados, las páginas siguen leyendo
// directamente de src/data/* (ver src/services/loadData.ts).
import { api } from './api'

export const studentService = {
  getAll: () => api.get('/students'),
  getByGroup: (grupo: string) => api.get(`/students?grupo=${encodeURIComponent(grupo)}`),
  getById: (id: string) => api.get(`/students/${id}`),
  search: (q: string) => api.get(`/students?q=${encodeURIComponent(q)}`),
  create: (data: unknown) => api.post('/students', data),
  update: (id: string, data: unknown) => api.put(`/students/${id}`, data),
  remove: (id: string) => api.delete(`/students/${id}`),
}

export const groupService = {
  getAll: () => api.get('/groups'),
  getById: (id: string) => api.get(`/groups/${id}`),
  average: (grupo: string) => api.get(`/groups/${grupo}/average`),
  attendance: (grupo: string) => api.get(`/groups/${grupo}/attendance`),
  create: (data: unknown) => api.post('/groups', data),
  update: (id: string, data: unknown) => api.put(`/groups/${id}`, data),
  remove: (id: string) => api.delete(`/groups/${id}`),
}

export const teacherService = {
  getAll: () => api.get('/teachers'),
  getById: (id: string) => api.get(`/teachers/${id}`),
  create: (data: unknown) => api.post('/teachers', data),
  update: (id: string, data: unknown) => api.put(`/teachers/${id}`, data),
  remove: (id: string) => api.delete(`/teachers/${id}`),
}

export const subjectService = {
  getAll: () => api.get('/subjects'),
  getByGroup: (grupo: string) => api.get(`/subjects?grupo=${encodeURIComponent(grupo)}`),
  create: (data: unknown) => api.post('/subjects', data),
  update: (id: string, data: unknown) => api.put(`/subjects/${id}`, data),
  remove: (id: string) => api.delete(`/subjects/${id}`),
}

export const careerService = {
  getAll: () => api.get('/careers'),
  create: (data: unknown) => api.post('/careers', data),
  update: (id: string, data: unknown) => api.put(`/careers/${id}`, data),
  remove: (id: string) => api.delete(`/careers/${id}`),
}

export const scheduleService = {
  forGroup: (grupo: string) => api.get(`/schedules?grupo=${encodeURIComponent(grupo)}`),
  create: (data: unknown) => api.post('/schedules', data),
  update: (id: number, data: unknown) => api.put(`/schedules/${id}`, data),
  remove: (id: number) => api.delete(`/schedules/${id}`),
}

export const gradeService = {
  getAll: () => api.get('/grades'),
  forStudent: (studentId: string) => api.get(`/grades/student/${studentId}`),
  create: (data: unknown) => api.post('/grades', data),
  update: (id: string, data: unknown) => api.put(`/grades/${id}`, data),
  remove: (id: string) => api.delete(`/grades/${id}`),
  /** Genera el kardex oficial de un alumno directamente desde el backend/BD. */
  kardex: (studentId: string) => api.get<KardexResponse>(`/grades/kardex/${studentId}`),
}

export interface KardexMateria {
  subjectId: string
  materia: string
  creditos: number
  parcial: string
  final: number
  letra: 'NA' | 'SA' | 'DE' | 'AU'
}

export interface KardexCuatrimestre {
  cuatrimestre: string
  periodo: string
  materias: KardexMateria[]
  promedio: number
}

export interface KardexResponse {
  alumno: { id: string; expediente: string; nombre: string; carrera: string; grupo: string; status: string }
  cuatrimestres: KardexCuatrimestre[]
  resumen: { promedioGeneral: number; totalMaterias: number; acreditadas: number; noAcreditadas: number }
  generadoEn: string
}

export const attendanceService = {
  getAll: () => api.get('/attendance'),
  forStudent: (studentId: string) => api.get(`/attendance/student/${studentId}`),
  update: (studentId: string, data: unknown) => api.put(`/attendance/student/${studentId}`, data),
}

export const serviceTicketService = {
  getAll: () => api.get('/services'),
  create: (data: unknown) => api.post('/services', data),
  update: (id: string, data: unknown) => api.put(`/services/${id}`, data),
  remove: (id: string) => api.delete(`/services/${id}`),
}

export const enrollmentService = {
  getAll: () => api.get('/enrollments'),
  forStudent: (studentId: string) => api.get(`/enrollments/student/${studentId}`),
  create: (data: unknown) => api.post('/enrollments', data),
  update: (id: string, data: unknown) => api.put(`/enrollments/${id}`, data),
  remove: (id: string) => api.delete(`/enrollments/${id}`),
}

export { authService } from './auth'
export { loadAppData, loadPublicData } from './loadData'
