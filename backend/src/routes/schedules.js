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

// POST /api/schedules/generate
router.post('/generate', requireRole('Administrador', 'Control Escolar'), async (req, res) => {
  const { spawn } = require('child_process')
  const path = require('path')
  const fs = require('fs')

  try {
    const pythonPathWindows = path.join(__dirname, '..', '..', '..', 'app', 'timetable_mvp', 'venv', 'Scripts', 'python.exe')
    const pythonPathUnix = path.join(__dirname, '..', '..', '..', 'app', 'timetable_mvp', 'venv', 'bin', 'python')
    const scriptPath = path.join(__dirname, '..', '..', '..', 'app', 'timetable_mvp', 'scheduler.py')

    let pythonPath = pythonPathWindows
    if (!fs.existsSync(pythonPath)) {
      pythonPath = pythonPathUnix
    }

    if (!fs.existsSync(pythonPath)) {
      pythonPath = 'python'
    }

    console.log(`Ejecutando script de horarios con: ${pythonPath}`)

    // Pasar variables de entorno del backend (DB_HOST, etc.)
    const env = {
      ...process.env,
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: process.env.DB_PORT || '3306',
      DB_USER: process.env.DB_USER || 'root',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_NAME: process.env.DB_NAME || 'utslrc_sistema'
    }

    const pythonProcess = spawn(pythonPath, [scriptPath], { env })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      console.log(`Proceso de generación finalizó con código: ${code}`)
      if (code === 0) {
        res.json({ success: true, message: 'Horarios generados correctamente en la base de datos.', stdout })
      } else {
        console.error('Error del solver en python:', stderr || stdout)
        res.status(500).json({ error: 'Error al generar los horarios.', details: stderr || stdout })
      }
    })
  } catch (error) {
    console.error('Error al iniciar el generador de horarios:', error)
    res.status(500).json({ error: 'Error interno al ejecutar el generador de horarios.' })
  }
})

module.exports = router
