const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Cambia según tu configuración
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'tonypecas16',
  database: 'HospitalDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Listar citas (con paciente y médico)
app.get('/api/citas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id_cita, c.id_paciente, c.id_medico, c.fecha, c.hora, c.motivo, c.estado,
              p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
              m.nombre AS medico_nombre, m.apellido AS medico_apellido
       FROM Citas c
       LEFT JOIN Pacientes p ON c.id_paciente = p.id_paciente
       LEFT JOIN Medicos m ON c.id_medico = m.id_medico
       ORDER BY c.fecha, c.hora`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando citas' });
  }
});

// Crear cita
app.post('/api/citas', async (req, res) => {
  const { id_paciente, id_medico, fecha, hora, motivo, estado } = req.body;
  if (!id_paciente || !id_medico || !fecha || !hora) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO Citas (id_paciente, id_medico, fecha, hora, motivo, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_paciente, id_medico, fecha, hora, motivo || '', estado || 'Programada']
    );
    res.status(201).json({ id_cita: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando cita' });
  }
});

// Actualizar cita
app.put('/api/citas/:id', async (req, res) => {
  const id = req.params.id;
  const { id_paciente, id_medico, fecha, hora, motivo, estado } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Citas SET id_paciente=?, id_medico=?, fecha=?, hora=?, motivo=?, estado=? WHERE id_cita=?`,
      [id_paciente, id_medico, fecha, hora, motivo, estado, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando cita' });
  }
});

// Eliminar cita
app.delete('/api/citas/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.query(`DELETE FROM Citas WHERE id_cita = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando cita' });
  }
});

// Endpoints auxiliares: pacientes y medicos para poblar selects
app.get('/api/pacientes', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id_paciente, nombre, apellido FROM Pacientes ORDER BY nombre`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando pacientes' });
  }
});

// Reemplazar/actualizar GET /api/medicos para incluir especialidad y departamento
app.get('/api/medicos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.id_medico,
        m.nombre,
        m.apellido,
        m.id_especialidad,
        e.nombre AS especialidad,
        m.id_departamento,
        d.nombre AS departamento,
        m.telefono,
        m.correo
      FROM Medicos m
      LEFT JOIN Especialidades e ON m.id_especialidad = e.id_especialidad
      LEFT JOIN Departamentos d ON m.id_departamento = d.id_departamento
      ORDER BY m.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error listando medicos:', err);
    res.status(500).json({ error: 'Error listando medicos' });
  }
});

// Nuevo: listar especialidades
app.get('/api/especialidades', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id_especialidad, nombre FROM Especialidades ORDER BY nombre`);
    console.log(`GET /api/especialidades -> ${rows.length} filas`);
    res.json(rows);
  } catch (err) {
    console.error('Error listando especialidades:', err);
    res.status(500).json({ error: 'Error listando especialidades' });
  }
});

// Nuevo: listar departamentos
app.get('/api/departamentos', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id_departamento, nombre FROM Departamentos ORDER BY nombre`);
    console.log(`GET /api/departamentos -> ${rows.length} filas`);
    res.json(rows);
  } catch (err) {
    console.error('Error listando departamentos:', err);
    res.status(500).json({ error: 'Error listando departamentos' });
  }
});

// Nuevo: distribución de citas por especialidad (para la tabla)
app.get('/api/citas_por_especialidad', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(e.nombre,'Sin especialidad') AS especialidad,
        COUNT(*) AS total_citas,
        SUM(CASE WHEN c.estado='Completada' THEN 1 ELSE 0 END) AS completadas,
        SUM(CASE WHEN c.estado='Programada' THEN 1 ELSE 0 END) AS programadas,
        SUM(CASE WHEN c.estado='Cancelada' THEN 1 ELSE 0 END) AS canceladas
      FROM Citas c
      LEFT JOIN Medicos m ON c.id_medico = m.id_medico
      LEFT JOIN Especialidades e ON m.id_especialidad = e.id_especialidad
      GROUP BY COALESCE(e.id_especialidad,0), COALESCE(e.nombre,'Sin especialidad')
      ORDER BY total_citas DESC
    `);
    console.log(`GET /api/citas_por_especialidad -> ${rows.length} filas`);
    res.json(rows);
  } catch (err) {
    console.error('Error /api/citas_por_especialidad:', err);
    res.status(500).json({ error: 'Error obteniendo distribución por especialidad' });
  }
});

// --- Nuevos endpoints para crear Pacientes y Médicos ---
app.post('/api/pacientes', async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, sexo, direccion, telefono, correo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
  try {
    const [result] = await pool.query(
      `INSERT INTO Pacientes (nombre, apellido, fecha_nacimiento, sexo, direccion, telefono, correo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre || null, apellido || null, fecha_nacimiento || null, sexo || null, direccion || null, telefono || null, correo || null]
    );
    res.status(201).json({ id_paciente: result.insertId });
  } catch (err) {
    console.error('Error creando paciente:', err);
    res.status(500).json({ error: 'Error creando paciente' });
  }
});

app.post('/api/medicos', async (req, res) => {
  const { nombre, apellido, telefono, correo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es requerido' });
  try {
    const [result] = await pool.query(
      `INSERT INTO Medicos (nombre, apellido, telefono, id_especialidad, id_departamento, correo)
       VALUES (?, ?, ?, NULL, NULL, ?)`,
      [nombre || null, apellido || null, telefono || null, correo || null]
    );
    res.status(201).json({ id_medico: result.insertId });
  } catch (err) {
    console.error('Error creando medico:', err);
    res.status(500).json({ error: 'Error creando medico' });
  }
});

app.listen(PORT, () => {
  console.log(`API Citas corriendo en http://127.0.0.1:${PORT}`);
});
