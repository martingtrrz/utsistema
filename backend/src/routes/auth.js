const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const { requireAuth, requireRole } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'username y password son requeridos' })
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const payload = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      role: user.role,
      studentId: user.student_id,
      teacherId: user.teacher_id,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    })

    res.json({ token, user: payload })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

// POST /api/auth/users - crear usuarios (solo Administrador)
router.post('/users', requireAuth, requireRole('Administrador'), async (req, res) => {
  const { username, password, nombre, role, studentId, teacherId } = req.body
  const validRoles = ['Administrador', 'Control Escolar', 'Docente', 'Alumno']

  if (!username || !password || !nombre || !role) {
    return res.status(400).json({ error: 'username, password, nombre y role son requeridos' })
  }
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'role inválido' })
  }

  try {
    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, nombre, role, student_id, teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hash, nombre, role, studentId || null, teacherId || null]
    )
    res.status(201).json({ id: result.insertId, username, nombre, role })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese username ya existe' })
    }
    console.error(err)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

module.exports = router
