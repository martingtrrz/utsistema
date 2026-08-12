const express = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function estadoFor(porcentaje) {
  if (porcentaje >= 90) return 'Regular'
  if (porcentaje >= 80) return 'En riesgo'
  return 'Crítico'
}

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM attendance_summary')
  res.json(rows)
})

router.get('/student/:studentId', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM attendance_summary WHERE student_id = ?', [req.params.studentId])
  if (!rows[0]) return res.status(404).json({ error: 'Sin registro de asistencia para este alumno' })
  res.json(rows[0])
})

// Crea o actualiza el resumen de asistencia de un alumno (upsert)
router.put('/student/:studentId', requireRole('Administrador', 'Control Escolar', 'Docente'), async (req, res) => {
  const { asistencias, faltas, retardos, porcentaje } = req.body
  if (asistencias == null || faltas == null || retardos == null || porcentaje == null) {
    return res.status(400).json({ error: 'asistencias, faltas, retardos y porcentaje son requeridos' })
  }
  const estado = estadoFor(porcentaje)

  await pool.query(
    `INSERT INTO attendance_summary (student_id, asistencias, faltas, retardos, porcentaje, estado)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE asistencias=VALUES(asistencias), faltas=VALUES(faltas), retardos=VALUES(retardos), porcentaje=VALUES(porcentaje), estado=VALUES(estado)`,
    [req.params.studentId, asistencias, faltas, retardos, porcentaje, estado]
  )
  await pool.query('UPDATE students SET asistencia = ? WHERE id = ?', [porcentaje, req.params.studentId])

  const [rows] = await pool.query('SELECT * FROM attendance_summary WHERE student_id = ?', [req.params.studentId])
  res.json(rows[0])
})

module.exports = router
