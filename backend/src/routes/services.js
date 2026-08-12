const express = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const { status, categoria, studentId } = req.query
  let sql = 'SELECT * FROM service_tickets WHERE 1=1'
  const params = []
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (categoria) {
    sql += ' AND categoria = ?'
    params.push(categoria)
  }
  if (studentId) {
    sql += ' AND student_id = ?'
    params.push(studentId)
  }
  sql += ' ORDER BY fecha DESC'
  const [rows] = await pool.query(sql, params)
  res.json(rows)
})

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM service_tickets WHERE id = ?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Ticket no encontrado' })
  res.json(rows[0])
})

// Cualquier usuario autenticado puede abrir un ticket (trámite o soporte)
router.post('/', async (req, res) => {
  const { student_id, tipo, categoria, fecha } = req.body
  if (!student_id || !tipo || !categoria) {
    return res.status(400).json({ error: 'student_id, tipo y categoria son requeridos' })
  }
  const [countRows] = await pool.query('SELECT COUNT(*) AS c FROM service_tickets')
  const n = countRows[0].c + 1
  const id = `TK-${1000 + n}`
  const folio = `SE-${new Date().getFullYear()}-${String(300 + n).padStart(4, '0')}`
  const status = categoria === 'Trámite escolar' ? 'En proceso' : 'Abierto'

  await pool.query(
    'INSERT INTO service_tickets (id, folio, student_id, tipo, categoria, fecha, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, folio, student_id, tipo, categoria, fecha || new Date().toISOString().slice(0, 10), status]
  )
  const [rows] = await pool.query('SELECT * FROM service_tickets WHERE id = ?', [id])
  res.status(201).json(rows[0])
})

router.put('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'status es requerido' })

  const [result] = await pool.query('UPDATE service_tickets SET status = ? WHERE id = ?', [status, req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Ticket no encontrado' })
  const [rows] = await pool.query('SELECT * FROM service_tickets WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

router.delete('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const [result] = await pool.query('DELETE FROM service_tickets WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Ticket no encontrado' })
  res.status(204).end()
})

module.exports = router
