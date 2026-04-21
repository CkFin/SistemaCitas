const readline = require('readline');
const oracledb = require('oracledb');


const dbConfig = {
  user: "MAICOLJOTAa",
  password: "2025",
  connectString: "localhost:1521/ORCLPDB"

};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


function mostrarMenu() {
  console.log('\n=== MENÚ DE ESTUDIANTES ===');
  console.log('1. Listar todos los estudiantes');
  console.log('2. Buscar estudiante por ID');
  console.log('3. Crear nuevo estudiante');
  console.log('4. Actualizar estudiante');
  console.log('5. Eliminar estudiante');
  console.log('6. Salir');
  
  rl.question('Seleccione una opción: ', (opcion) => {
    switch(opcion) {
      case '1':
        mostrarEstudiantes();
        break;
      case '2':
        buscarEstudiante();
        break;
      case '3':
        crearEstudiante();
        break;
      case '4':
        actualizarEstudiante();
        break;
      case '5':
        eliminarEstudiante();
        break;
      case '6':
        rl.close();
        break;
      default:
        console.log('Opción no válida. Intente de nuevo.');
        mostrarMenu();
    }
  });
}

async function mostrarEstudiantes() {
  let connection;
  try {
    
    connection = await oracledb.getConnection(dbConfig);
    console.log("Conexión exitosa a Oracle");
    const result = await connection.execute("SELECT * FROM ESTUDIANTE", [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });

    console.log("Estudiantes:", result.rows);
   // await connection.execute("CREATE SEQUENCE SEQ_ESTUDIANTE START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE");
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


async function buscarEstudiante() {
  rl.question('\nIngrese el ID del estudiante a buscar: ', async (id) => {
    try {
      const connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(
        "SELECT * FROM ESTUDIANTE WHERE ID = :id",
        [id],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (result.rows.length === 0) {
        console.log('No se encontró ningún estudiante con ese ID.');
      } else {
        console.log('\n=== ESTUDIANTE ENCONTRADO ===');
        console.table(result.rows);
      }
      
      await connection.close();
      mostrarMenu();
    } catch (err) {
      console.error('Error al buscar estudiante:', err);
      mostrarMenu();
    }
  });
}

async function crearEstudiante() {
  console.log('\n=== NUEVO ESTUDIANTE ===');
  
  const estudiante = {};
  
  rl.question('Codigo: ', (codigo) => {
    estudiante.codigo = codigo;
    rl.question('nombre: ', (nombre) => {
      estudiante.nombre = nombre;
        rl.question('CarreraID: ', async (carreraID) => {
          estudiante.carreraID = carreraID;
          
          try {
            const connection = await oracledb.getConnection(dbConfig);
            const result = await connection.execute(
              `INSERT INTO ESTUDIANTE (ID, CODIGO, NOMBRE, CARRERA_ID) 
               VALUES (SEQ_ESTUDIANTE.NEXTVAL, :codigo, :nombre, :carreraID)`,
              {
                codigo: estudiante.codigo,
                nombre: estudiante.nombre,
                carreraID: estudiante.carreraID
              },
              { autoCommit: true }
            );
            
            console.log('\nEstudiante creado exitosamente!');
            await connection.close();
            mostrarMenu();
          } catch (err) {
            console.error('Error al crear estudiante:', err);
            mostrarMenu();
          }
        });
    });
  });
}

async function actualizarEstudiante() {
  console.log('\n=== ACTUALIZAR ESTUDIANTE ===');
  
  rl.question('Ingrese el ID del estudiante a actualizar: ', (id) => {
    const estudiante = { id: id };
    
    rl.question('Nuevo codigo (dejar vacío para no cambiar): ', (codigo) => {
      if (codigo) estudiante.codigo = codigo;
      rl.question('Nuevo nombre (dejar vacío para no cambiar): ', (nombre) => {
        if (nombre) estudiante.nombre = nombre;
        rl.question('Nueva carreraID (dejar vacío para no cambiar): ', async (carreraID) => {
          if (carreraID) estudiante.carreraID = carreraID;
     
            
            try {
              const connection = await oracledb.getConnection(dbConfig);
              
              let updateQuery = 'UPDATE ESTUDIANTE SET ';
              const binds = { id: id };
              const updates = [];
              
              if (estudiante.codigo) {
                updates.push('CODIGO = :codigo');
                binds.codigo = estudiante.codigo;
              }
              if (estudiante.nombre) {
                updates.push('NOMBRE = :nombre');
                binds.nombre = estudiante.nombre;
              }
              if (estudiante.carreraID) {
                updates.push('CARRERA_ID = :carreraID');
                binds.carreraID = estudiante.carreraID;
              }
              
              if (updates.length === 0) {
                console.log('No se proporcionaron datos para actualizar.');
                await connection.close();
                mostrarMenu();
                return;
              }
              
              updateQuery += updates.join(', ') + ' WHERE ID = :id';
              
              const result = await connection.execute(
                updateQuery,
                binds,
                { autoCommit: true }
              );
              
              if (result.rowsAffected === 0) {
                console.log('No se encontró ningún estudiante con ese ID.');
              } else {
                console.log('Estudiante actualizado exitosamente!');
              }
              
              await connection.close();
              mostrarMenu();
            } catch (err) {
              console.error('Error al actualizar estudiante:', err);
              mostrarMenu();
            }
          });
        });
      });
    });
}

async function eliminarEstudiante() {
  rl.question('\nIngrese el ID del estudiante a eliminar: ', async (id) => {
    try {
      const connection = await oracledb.getConnection(dbConfig);
      const result = await connection.execute(
        "DELETE FROM ESTUDIANTE WHERE ID = :id",
        [id],
        { autoCommit: true }
      );
      
      if (result.rowsAffected === 0) {
        console.log('No se encontró ningún estudiante con ese ID.');
      } else {
        console.log('Estudiante eliminado exitosamente!');
      }
      
      await connection.close();
      mostrarMenu();
    } catch (err) {
      console.error('Error al eliminar estudiante:', err);
      mostrarMenu();
    }
  });
}

console.log('=== SISTEMA DE GESTIÓN DE ESTUDIANTES ===');
mostrarMenu();

rl.on('close', () => {
  console.log('\nEstudien hasta luego');
  process.exit(0);
});