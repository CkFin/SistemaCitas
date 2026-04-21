const express = require('express');
const oracledb = require('oracledb');

const app = express();
const port = 3000;

const dbConfig = {
   user: "MAICOLJOTAa",
   password: "2025",
   connectString: "localhost:1521/ORCLPDB"

};

app.use(express.json());

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

app.get('/estudiantes', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "SELECT * FROM ESTUDIANTE",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al listar estudiantes:', err);
    res.status(500).json({ error: 'Error al listar estudiantes' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.get('/estudiantes/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "SELECT * FROM ESTUDIANTE WHERE ID = :id",
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (err) {
    console.error("Error detallado:", err);
    console.error('Error al buscar estudiante:', err);
    res.status(500).json({ error: 'Error al buscar estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.post('/estudiantes', async (req, res) => {
  const { codigo, nombre, carreraID } = req.body;
  if (!codigo || !nombre || !carreraID) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `INSERT INTO ESTUDIANTE (ID, CODIGO, NOMBRE, CARRERA_ID) 
       VALUES (SEQ_ESTUDIANTE.NEXTVAL, :codigo, :nombre, :carreraID)`,
      { codigo, nombre, carreraID },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Estudiante creado exitosamente' });
  } catch (err) {
    console.error('Error al crear estudiante:', err);
    res.status(500).json({ error: 'Error al crear estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.put('/estudiantes/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, nombre, carreraID } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    let updateQuery = 'UPDATE ESTUDIANTE SET ';
    const binds = { id };
    const updates = [];

    if (codigo) {
      updates.push('CODIGO = :codigo');
      binds.codigo = codigo;
    }
    if (nombre) {
      updates.push('NOMBRE = :nombre');
      binds.nombre = nombre;
    }
    if (carreraID) {
      updates.push('CARRERA_ID = :carreraID');
      binds.carreraID = carreraID;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
    }

    updateQuery += updates.join(', ') + ' WHERE ID = :id';
    const result = await connection.execute(updateQuery, binds, { autoCommit: true });

    if (result.rowsAffected === 0) {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    } else {
      res.status(200).json({ message: 'Estudiante actualizado exitosamente' });
    }
  } catch (err) {
    console.error('Error al actualizar estudiante:', err);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.delete('/estudiantes/:id', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "DELETE FROM ESTUDIANTE WHERE ID = :id",
      [req.params.id],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      res.status(404).json({ message: 'Estudiante no encontrado' });
    } else {
      res.status(200).json({ message: 'Estudiante eliminado exitosamente' });
    }
  } catch (err) {
    console.error('Error al eliminar estudiante:', err);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada JOTA' });
});