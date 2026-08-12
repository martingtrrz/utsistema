const express = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

const WEIGHTS = { evidencias: 0.2, conocimiento: 0.3, desempeno: 0.2, actitud: 0.1, examen: 0.2 }

function computeFinal(c) {
  const total =
    c.evidencias * WEIGHTS.evidencias +
    c.conocimiento * WEIGHTS.conocimiento +
    c.desempeno * WEIGHTS.desempeno +
    c.actitud * WEIGHTS.actitud +
    c.examen * WEIGHTS.examen
  return Math.round(total * 10) / 10
}

// Escala institucional de acreditación
// < 8.0 => NA (No acreditado) · 8.0-8.9 => SA (Satisfactorio)
// 9.0-9.6 => DE (Destacado) · 9.7-10 => AU (Autónomo)
function letterGrade(final) {
  if (final < 8) return 'NA'
  if (final < 9) return 'SA'
  if (final < 9.7) return 'DE'
  return 'AU'
}

router.get('/', async (req, res) => {
  const { studentId, subjectId } = req.query
  let sql = 'SELECT * FROM grade_records WHERE 1=1'
  const params = []
  if (studentId) {
    sql += ' AND student_id = ?'
    params.push(studentId)
  }
  if (subjectId) {
    sql += ' AND subject_id = ?'
    params.push(subjectId)
  }
  const [rows] = await pool.query(sql, params)
  res.json(rows)
})

router.get('/student/:studentId', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM grade_records WHERE student_id = ?', [req.params.studentId])
  res.json(rows)
})

// GET /api/grades/kardex/:studentId
// Genera el kardex oficial de un alumno a partir de la base de datos:
// calificaciones agrupadas por cuatrimestre, con letra de acreditación y resumen general.
router.get('/kardex/:studentId', async (req, res) => {
  const { studentId } = req.params

  // Un alumno solo puede generar su propio kardex; el resto de roles puede
  // consultar el de cualquier alumno.
  if (req.user.role === 'Alumno' && req.user.studentId !== studentId) {
    return res.status(403).json({ error: 'No tienes permiso para ver este kardex' })
  }

  const [studentRows] = await pool.query(
    `SELECT s.*, c.nombre AS carrera_nombre, g.nombre AS grupo_nombre
     FROM students s
     JOIN careers c ON c.id = s.career_id
     JOIN \`groups\` g ON g.id = s.group_id
     WHERE s.id = ?`,
    [studentId]
  )
  const student = studentRows[0]
  if (!student) return res.status(404).json({ error: 'Alumno no encontrado' })

  const [gradeRows] = await pool.query(
    `SELECT gr.id, gr.subject_id, gr.parcial, gr.final,
            sub.nombre AS materia, sub.creditos,
            g.cuatrimestre, g.periodo
     FROM grade_records gr
     JOIN subjects sub ON sub.id = gr.subject_id
     JOIN \`groups\` g ON g.id = sub.group_id
     WHERE gr.student_id = ?
     ORDER BY g.cuatrimestre, sub.nombre, gr.parcial`,
    [studentId]
  )

  const porCuatrimestre = new Map()
  for (const row of gradeRows) {
    const key = row.cuatrimestre || 'N/A'
    if (!porCuatrimestre.has(key)) {
      porCuatrimestre.set(key, { cuatrimestre: key, periodo: row.periodo, materias: [] })
    }
    const final = Number(row.final)
    porCuatrimestre.get(key).materias.push({
      subjectId: row.subject_id,
      materia: row.materia,
      creditos: row.creditos,
      parcial: row.parcial,
      final,
      letra: letterGrade(final),
    })
  }

  const cuatrimestres = [...porCuatrimestre.values()].map((c) => {
    const promedio = c.materias.length ? c.materias.reduce((a, m) => a + m.final, 0) / c.materias.length : 0
    return { ...c, promedio: Math.round(promedio * 10) / 10 }
  })

  const totalMaterias = gradeRows.length
  const acreditadas = gradeRows.filter((r) => Number(r.final) >= 8).length
  const noAcreditadas = totalMaterias - acreditadas
  const promedioGeneral = totalMaterias ? gradeRows.reduce((a, r) => a + Number(r.final), 0) / totalMaterias : 0

  res.json({
    alumno: {
      id: student.id,
      expediente: student.expediente,
      nombre: student.nombre,
      carrera: student.carrera_nombre,
      grupo: student.grupo_nombre,
      status: student.status,
    },
    cuatrimestres,
    resumen: {
      promedioGeneral: Math.round(promedioGeneral * 10) / 10,
      totalMaterias,
      acreditadas,
      noAcreditadas,
    },
    generadoEn: new Date().toISOString(),
  })
})

// Administrador, Control Escolar y Docente pueden registrar/editar calificaciones
router.post('/', requireRole('Administrador', 'Control Escolar', 'Docente'), async (req, res) => {
  const { student_id, subject_id, parcial, evidencias, conocimiento, desempeno, actitud, examen } = req.body
  if (!student_id || !subject_id || evidencias == null || conocimiento == null || desempeno == null || actitud == null || examen == null) {
    return res.status(400).json({ error: 'student_id, subject_id y los 5 componentes son requeridos' })
  }
  const final = computeFinal({ evidencias, conocimiento, desempeno, actitud, examen })
  const id = `${student_id}-${subject_id}`

  try {
    await pool.query(
      `INSERT INTO grade_records (id, student_id, subject_id, parcial, evidencias, conocimiento, desempeno, actitud, examen, final)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, student_id, subject_id, parcial || 'Parcial 1', evidencias, conocimiento, desempeno, actitud, examen, final]
    )
    const [rows] = await pool.query('SELECT * FROM grade_records WHERE id = ?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una calificación para ese alumno/materia/parcial' })
    console.error(err)
    res.status(500).json({ error: 'Error al registrar calificación' })
  }
})

router.put('/:id', requireRole('Administrador', 'Control Escolar', 'Docente'), async (req, res) => {
  const { evidencias, conocimiento, desempeno, actitud, examen, parcial } = req.body

  const [existingRows] = await pool.query('SELECT * FROM grade_records WHERE id = ?', [req.params.id])
  const existing = existingRows[0]
  if (!existing) return res.status(404).json({ error: 'Calificación no encontrada' })

  const merged = {
    evidencias: evidencias ?? existing.evidencias,
    conocimiento: conocimiento ?? existing.conocimiento,
    desempeno: desempeno ?? existing.desempeno,
    actitud: actitud ?? existing.actitud,
    examen: examen ?? existing.examen,
  }
  const final = computeFinal(merged)

  await pool.query(
    `UPDATE grade_records SET evidencias=?, conocimiento=?, desempeno=?, actitud=?, examen=?, final=?, parcial=?
     WHERE id = ?`,
    [merged.evidencias, merged.conocimiento, merged.desempeno, merged.actitud, merged.examen, final, parcial || existing.parcial, req.params.id]
  )
  const [rows] = await pool.query('SELECT * FROM grade_records WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

router.delete('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const [result] = await pool.query('DELETE FROM grade_records WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Calificación no encontrada' })
  res.status(204).end()
})

module.exports = router
