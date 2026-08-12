const express = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

// GET /api/schedules?grupo=IDGS%208-3
router.get('/', async (req, res) => {
  const { grupo } = req.query
  let sql = `
    SELECT sl.id, sl.group_id, sl.dia, sl.hora, sl.aula,
           s.id AS subject_id, s.nombre AS materia, s.docente_nombre AS docente
    FROM schedule_slots sl
    JOIN subjects s ON s.id = sl.subject_id
    WHERE 1=1`
  const params = []
  if (grupo) {
    sql += ' AND sl.group_id = ?'
    params.push(grupo)
  }
  sql += ' ORDER BY FIELD(sl.dia, "Lunes","Martes","Miércoles","Jueves","Viernes"), sl.hora'

  const [rows] = await pool.query(sql, params)
  res.json(rows)
})

router.post('/', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const { group_id, dia, hora, subject_id, aula } = req.body
  if (!group_id || !dia || !hora || !subject_id) {
    return res.status(400).json({ error: 'group_id, dia, hora y subject_id son requeridos' })
  }
  const [result] = await pool.query(
    'INSERT INTO schedule_slots (group_id, dia, hora, subject_id, aula) VALUES (?, ?, ?, ?, ?)',
    [group_id, dia, hora, subject_id, aula || null]
  )
  const [rows] = await pool.query('SELECT * FROM schedule_slots WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
})

router.put('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const fields = ['group_id', 'dia', 'hora', 'subject_id', 'aula']
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

  const [result] = await pool.query(`UPDATE schedule_slots SET ${updates.join(', ')} WHERE id = ?`, params)
  if (!result.affectedRows) return res.status(404).json({ error: 'Horario no encontrado' })
  const [rows] = await pool.query('SELECT * FROM schedule_slots WHERE id = ?', [req.params.id])
  res.json(rows[0])
})

router.delete('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const [result] = await pool.query('DELETE FROM schedule_slots WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Horario no encontrado' })
  res.status(204).end()
})

module.exports = router
