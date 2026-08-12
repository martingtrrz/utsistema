export interface EvalComponents {
  evidencias: number
  conocimiento: number
  desempeno: number
  actitud: number
  examen: number
}

// Fórmula centralizada de evaluación (misma que usa el backend)
// Evidencias 20% + Conocimiento 30% + Desempeño 20% + Actitud 10% + Examen 20%
export const WEIGHTS = { evidencias: 0.2, conocimiento: 0.3, desempeno: 0.2, actitud: 0.1, examen: 0.2 }

export function computeFinal(c: EvalComponents) {
  const total =
    c.evidencias * WEIGHTS.evidencias +
    c.conocimiento * WEIGHTS.conocimiento +
    c.desempeno * WEIGHTS.desempeno +
    c.actitud * WEIGHTS.actitud +
    c.examen * WEIGHTS.examen
  return Math.round(total * 10) / 10
}

// Escala institucional de acreditación (misma regla que usa el backend)
export type LetterGrade = 'NA' | 'SA' | 'DE' | 'AU'

export const LETTER_GRADE_INFO: Record<LetterGrade, { label: string; bg: string; color: string }> = {
  NA: { label: 'No acreditado', bg: '#fdeeee', color: '#b42318' },
  SA: { label: 'Satisfactorio', bg: '#eff6ff', color: '#1d4ed8' },
  DE: { label: 'Destacado', bg: '#f0faf4', color: '#15803d' },
  AU: { label: 'Autónomo', bg: '#fbf3e2', color: '#9a6a00' },
}

export function letterGrade(final: number): LetterGrade {
  if (final < 8) return 'NA'
  if (final < 9) return 'SA'
  if (final < 9.7) return 'DE'
  return 'AU'
}

export interface GradeRecord {
  id: string
  studentId: string
  materia: string
  parcial: string
  components: EvalComponents
  final: number
}

export const GRADES: GradeRecord[] = []

export function setGrades(list: GradeRecord[]) {
  GRADES.length = 0
  GRADES.push(...list)
}

export function gradesForStudent(studentId: string) {
  return GRADES.filter((g) => g.studentId === studentId)
}
