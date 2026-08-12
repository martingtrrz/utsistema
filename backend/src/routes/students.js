const express = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/students?grupo=IDGS%208-3&q=texto
router.get('/', async (req, res) => {
  const { grupo, q } = req.query
  let sql = 'SELECT * FROM students WHERE 1=1'
  const params = []

  if (grupo) {
    sql += ' AND group_id = ?'
    params.push(grupo)
  }
  if (q) {
    sql += ' AND (nombre LIKE ? OR expediente LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }
  sql += ' ORDER BY group_id, no'

  const [rows] = await pool.query(sql, params)
  res.json(rows)
})

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Alumno no encontrado' })
  res.json(rows[0])
})

router.post('/', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const { id, no, expediente, nombre, group_id, email, status, career_id, cuatrimestre, periodo, promedio, asistencia } = req.body
  if (!id || !nombre || !group_id || !career_id) {
    return res.status(400).json({ error: 'id, nombre, group_id y career_id son requeridos' })
  }
  try {
    await pool.query(
      `INSERT INTO students (id, no, expediente, nombre, group_id, email, status, career_id, cuatrimestre, periodo, promedio, asistencia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, no || 0, expediente || '', nombre, group_id, email || null, status || 'Activo', career_id, cuatrimestre || null, periodo || null, promedio || 0, asistencia || 0]
    )
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un alumno con ese id o email' })
    console.error(err)
    res.status(500).json({ error: 'Error al crear alumno' })
  }
})

router.put('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const fields = ['no', 'expediente', 'nombre', 'group_id', 'email', 'status', 'career_id', 'cuatrimestre', 'periodo', 'promedio', 'asistencia']
  const updates = []
  const params = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`)
      params.push(req.body[f])
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Nada para actualizar' })
  params.push(req.params.id)

  const [result] = await pool.query(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params)
  if (!result.affectedRows) return res.status(404).json({ error: 'Alumno no encontrado' })
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

router.delete('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Alumno no encontrado' })
  res.status(204).end()
})

module.exports = router
