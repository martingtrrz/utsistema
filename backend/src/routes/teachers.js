const express = require('express')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const [teachers] = await pool.query('SELECT * FROM teachers ORDER BY nombre')
  const [tg] = await pool.query('SELECT * FROM teacher_groups')
  const [subs] = await pool.query('SELECT id, nombre, teacher_id FROM subjects')

  const result = teachers.map((t) => ({
    ...t,
    grupos: tg.filter((g) => g.teacher_id === t.id).map((g) => g.group_id),
    materias: subs.filter((s) => s.teacher_id === t.id).map((s) => s.nombre),
  }))
  res.json(result)
})

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Docente no encontrado' })
  const [tg] = await pool.query('SELECT group_id FROM teacher_groups WHERE teacher_id = ?', [req.params.id])
  const [subs] = await pool.query('SELECT id, nombre FROM subjects WHERE teacher_id = ?', [req.params.id])
  res.json({ ...rows[0], grupos: tg.map((g) => g.group_id), materias: subs.map((s) => s.nombre) })
})

router.post('/', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const { id, nombre, grado, email, grupos } = req.body
  if (!id || !nombre) return res.status(400).json({ error: 'id y nombre son requeridos' })

  try {
    await pool.query('INSERT INTO teachers (id, nombre, grado, email) VALUES (?, ?, ?, ?)', [id, nombre, grado || null, email || null])
    if (Array.isArray(grupos)) {
      for (const g of grupos) {
        await pool.query('INSERT INTO teacher_groups (teacher_id, group_id) VALUES (?, ?)', [id, g])
      }
    }
    const [rows] = await pool.query('SELECT * FROM teachers WHERE id = ?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ese docente ya existe' })
    console.error(err)
    res.status(500).json({ error: 'Error al crear docente' })
  }
})

router.put('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const fields = ['nombre', 'grado', 'email']
  const updates = []
  const params = []
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`)
      params.push(req.body[f])
    }
  }
  if (updates.length) {
    params.push(req.params.id)
    await pool.query(`UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`, params)
  }

  if (Array.isArray(req.body.grupos)) {
    await pool.query('DELETE FROM teacher_groups WHERE teacher_id = ?', [req.params.id])
    for (const g of req.body.grupos) {
      await pool.query('INSERT INTO teacher_groups (teacher_id, group_id) VALUES (?, ?)', [req.params.id, g])
    }
  }

  const [rows] = await pool.query('SELECT * FROM teachers WHERE id = ?', [req.params.id])
  if (!rows[0]) return res.status(404).json({ error: 'Docente no encontrado' })
  res.json(rows[0])
})

router.delete('/:id', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const [result] = await pool.query('DELETE FROM teachers WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ error: 'Docente no encontrado' })
  res.status(204).end()
})

module.exports = router
