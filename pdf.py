import os
import pywintypes
import win32file
import win32con
import datetime

# Ruta del archivo PDF
archivo = r"C:\Users\Jota\Downloads\clase 24.pdf"

# Fecha que quieres poner (por ejemplo, 2024-10-15 10:30:00)
nueva_fecha = datetime.datetime(2024, 10,24, 18, 30, 0)

# Abrir archivo
handle = win32file.CreateFile(
    archivo,
    win32con.GENERIC_WRITE,
    0,
    None,
    win32con.OPEN_EXISTING,
    0,
    None
)

# Convertir a formato de Windows
ft = pywintypes.Time(nueva_fecha)

# Cambiar creación, acceso y modificación
win32file.SetFileTime(handle, ft, ft, ft)
handle.close()

print("✅ Fecha de creación cambiada correctamente.")
