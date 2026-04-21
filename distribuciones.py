import pandas as pd
import matplotlib.pyplot as plt 
from flask import Flask,jsonify,request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos MySQL
db_config = {
    'host': 'localhost',
    'database': 'HospitalDB',  # Nueva base de datos
    'user': 'root',
    'password': 'tonypecas16'
}

def get_db_connection():
    """Crear conexión a la base de datos MySQL existente"""
    try:
        connection = mysql.connector.connect(**db_config)
        print("Conexión exitosa a HospitalDB")
        return connection
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None

def get_tables_info():
    """Obtener información sobre las tablas y vistas existentes"""
    try:
        connection = get_db_connection()
        if not connection:
            return None
            
        cursor = connection.cursor()
        
        # Mostrar tablas disponibles
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        print("Tablas disponibles:")
        for table in tables:
            print(f"  - {table[0]}")
            
        cursor.close()
        connection.close()
        
        return tables
        
    except Error as e:
        print(f"Error obteniendo tablas: {e}")
        return None

def execute_custom_query(query):
    """Ejecutar consulta personalizada"""
    try:
        connection = get_db_connection()
        if not connection:
            return []
            
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query)
        result = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return result
        
    except Error as e:
        print(f"Error ejecutando consulta: {e}")
        return []

# Inicializar conexión
print("Conectando a HospitalDB...")
tables = get_tables_info()

if tables:
    print("Conexión exitosa. Base de datos Hospital lista...")
else:
    print("No se pudo conectar a MySQL")

@app.route("/pacientes",methods=['GET'])
def funcionPacientes():
    """Obtener todos los pacientes"""
    query = "SELECT * FROM Pacientes"
    data = execute_custom_query(query)
    
    if data:
        print("Pacientes obtenidos desde MySQL")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener pacientes"})

@app.route("/medicos",methods=['GET'])
def funcionMedicos():
    """Obtener todos los médicos con especialidad"""
    query = """
    SELECT m.*, e.nombre as especialidad, d.nombre as departamento
    FROM Medicos m
    LEFT JOIN Especialidades e ON m.id_especialidad = e.id_especialidad
    LEFT JOIN Departamentos d ON m.id_departamento = d.id_departamento
    """
    data = execute_custom_query(query)
    
    if data:
        print("Médicos obtenidos desde MySQL")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener médicos"})

@app.route("/citas",methods=['GET'])
def funcionCitas():
    """Obtener citas con información de paciente y médico"""
    query = """
    SELECT c.id_cita, c.fecha, c.hora, c.motivo, c.estado,
           CONCAT(p.nombre, ' ', p.apellido) as paciente,
           CONCAT(m.nombre, ' ', m.apellido) as medico,
           e.nombre as especialidad
    FROM Citas c
    JOIN Pacientes p ON c.id_paciente = p.id_paciente
    JOIN Medicos m ON c.id_medico = m.id_medico
    LEFT JOIN Especialidades e ON m.id_especialidad = e.id_especialidad
    ORDER BY c.fecha, c.hora
    """
    data = execute_custom_query(query)
    
    if data:
        print("Citas obtenidas desde MySQL")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener citas"})

@app.route("/citas_por_especialidad",methods=['GET'])
def funcionCitasEspecialidad():
    """Obtener distribución de citas por especialidad usando GROUP BY"""
    query = """
    SELECT 
        e.nombre as especialidad,
        COUNT(*) as total_citas,
        SUM(CASE WHEN c.estado = 'Completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN c.estado = 'Programada' THEN 1 ELSE 0 END) as programadas,
        SUM(CASE WHEN c.estado = 'Cancelada' THEN 1 ELSE 0 END) as canceladas
    FROM Citas c
    JOIN Medicos m ON c.id_medico = m.id_medico
    JOIN Especialidades e ON m.id_especialidad = e.id_especialidad
    GROUP BY e.id_especialidad, e.nombre
    ORDER BY total_citas DESC
    """
    data = execute_custom_query(query)
    
    if data:
        print("Distribución por especialidad obtenida con GROUP BY")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener distribuciones por especialidad"})

@app.route("/pacientes_por_sexo",methods=['GET'])
def funcionPacientesSexo():
    """Obtener distribución de pacientes por sexo usando GROUP BY (excluye sin fecha)"""
    query = """
    SELECT 
        sexo,
        COUNT(*) as total_pacientes,
        ROUND(AVG(YEAR(CURDATE()) - YEAR(fecha_nacimiento)), 1) as edad_promedio
    FROM Pacientes 
    WHERE sexo IN ('M','F') AND fecha_nacimiento IS NOT NULL
    GROUP BY sexo
    ORDER BY total_pacientes DESC
    """
    data = execute_custom_query(query)
    
    if data:
        print("Distribución por sexo obtenida con GROUP BY")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener distribuciones por sexo"})

@app.route("/medicamentos_stock",methods=['GET'])
def funcionMedicamentosStock():
    """Obtener medicamentos con stock bajo"""
    query = "SELECT * FROM Medicamentos WHERE stock < 150 ORDER BY stock ASC"
    data = execute_custom_query(query)
    
    if data:
        print("Medicamentos con stock bajo obtenidos")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener medicamentos"})

@app.route("/habitaciones_disponibles",methods=['GET'])
def funcionHabitacionesDisponibles():
    """Obtener habitaciones por tipo y estado usando GROUP BY"""
    query = """
    SELECT 
        tipo,
        COUNT(*) as total_habitaciones,
        SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estado = 'Ocupada' THEN 1 ELSE 0 END) as ocupadas
    FROM Habitaciones 
    GROUP BY tipo
    ORDER BY tipo
    """
    data = execute_custom_query(query)
    
    if data:
        print("Estado de habitaciones obtenido con GROUP BY")
        return jsonify(data)
    else:
        return jsonify({"error": "No se pudieron obtener habitaciones"})

@app.route("/estadisticas_generales",methods=['GET'])
def funcionEstadisticasGenerales():
    """Obtener estadísticas generales del hospital"""
    query = """
    SELECT 
        (SELECT COUNT(*) FROM Pacientes) as total_pacientes,
        (SELECT COUNT(*) FROM Medicos) as total_medicos,
        (SELECT COUNT(*) FROM Citas WHERE estado = 'Programada') as citas_programadas,
        (SELECT COUNT(*) FROM Habitaciones WHERE estado = 'Disponible') as habitaciones_disponibles,
        (SELECT COUNT(*) FROM Medicamentos WHERE stock < 150) as medicamentos_stock_bajo
    """
    data = execute_custom_query(query)
    
    if data:
        print("Estadísticas generales obtenidas")
        return jsonify(data[0] if data else {})
    else:
        return jsonify({"error": "No se pudieron obtener estadísticas generales"})

@app.route("/tablas",methods=['GET'])
def funcionTablas():
    """Mostrar tablas disponibles en la base de datos"""
    tables = get_tables_info()
    if tables:
        return jsonify({"tablas": [table[0] for table in tables]})
    else:
        return jsonify({"error": "No se pudieron obtener tablas"})

@app.route("/info",methods=['GET'])
def funcionInfo():
    """Información sobre el sistema"""
    try:
        connection = get_db_connection()
        if connection:
            cursor = connection.cursor()
            cursor.execute("SELECT COUNT(*) as total FROM Pacientes")
            count_pacientes = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) as total FROM Medicos")
            count_medicos = cursor.fetchone()[0]
            cursor.close()
            connection.close()

            return jsonify({
                "sistema": "MySQL HospitalDB",
                "estado": "Conectado",
                "pacientes": count_pacientes,
                "medicos": count_medicos
            })
        else:
            return jsonify({
                "sistema": "MySQL no disponible",
                "estado": "Desconectado"
            })
    except:
        return jsonify({"error": "No se pudo obtener información"})

if __name__ == '__main__':
    app.run(debug=True)