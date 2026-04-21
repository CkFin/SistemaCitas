-- Corregir la base de datos TiendaRopaDB

USE TiendaRopaDB;

-- Crear tabla Clientes (corregida)
CREATE TABLE IF NOT EXISTS Clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    fecha_registro DATE DEFAULT (CURRENT_DATE)
);

-- Crear tabla Ventas (corregida)
CREATE TABLE IF NOT EXISTS Ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    fecha_venta DATE DEFAULT (CURRENT_DATE),
    total DECIMAL(10,2),
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- Crear tabla DetalleVenta
CREATE TABLE IF NOT EXISTS DetalleVenta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT,
    id_producto INT,
    cantidad INT CHECK (cantidad > 0),
    subtotal DECIMAL(10,2),
    FOREIGN KEY (id_venta) REFERENCES Ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- Crear tabla VentasAsignadas
CREATE TABLE IF NOT EXISTS VentasAsignadas (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado INT,
    id_venta INT,
    FOREIGN KEY (id_empleado) REFERENCES Empleados(id_empleado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (id_venta) REFERENCES Ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- Insertar datos de clientes
INSERT INTO Clientes (nombre, correo, telefono, ciudad, fecha_registro) VALUES
('Laura Sánchez', 'laura.sanchez@gmail.com', '3104567890', 'Bogotá', '2023-01-15'),
('Carlos Pérez', 'carlos.perez@hotmail.com', '3156789012', 'Medellín', '2023-03-10'),
('Valentina Rojas', 'valen.rojas@yahoo.com', '3112233445', 'Cali', '2023-05-22'),
('Andrés Torres', 'andres.torres@gmail.com', '3209988776', 'Barranquilla', '2023-02-18');

-- Insertar datos de ventas
INSERT INTO Ventas (id_cliente, fecha_venta, total) VALUES
(1, '2023-06-05', 165000),
(2, '2023-06-10', 450000),
(3, '2023-07-12', 330000),
(4, '2023-07-20', 250000);

-- Crear más vistas útiles
CREATE OR REPLACE VIEW Vista_ProductosCompletos AS
SELECT 
    id_producto,
    nombre,
    categoria,
    talla,
    color,
    precio,
    stock,
    CASE 
        WHEN stock < 20 THEN 'Crítico'
        WHEN stock < 50 THEN 'Bajo'
        ELSE 'Normal'
    END as estado_stock
FROM Productos;

-- Vista para análisis de precios por categoría
CREATE OR REPLACE VIEW Vista_PreciosCategoria AS
SELECT 
    categoria,
    COUNT(*) as productos,
    MIN(precio) as precio_min,
    MAX(precio) as precio_max,
    AVG(precio) as precio_promedio,
    SUM(stock) as stock_total
FROM Productos
GROUP BY categoria;
