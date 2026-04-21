const oracledb = require('oracledb');


const dbConfig = {
  user: "MAICOLJOTAa",
  password: "2025",
  connectString: "localhost:1521/ORCLPDB"

};

async function mostrarEstudiantes() {
  let connection;
  try {
    
    connection = await oracledb.getConnection(dbConfig);
    console.log("Conexión exitosa a Oracle");
    const result = await connection.execute("SELECT * FROM ESTUDIANTE", [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    console.log("Estudiantes:", result.rows);
  } catch (err) {
    console.error("Error en la conexión:", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Conexión cerrada");
      } catch (err) {
        console.error("Error al cerrar la conexión:", err);
      }
    }
  }
}

mostrarEstudiantes();
