import mysql.connector
import os
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo correspondiente
environment = os.getenv('ENV', 'development')  # por defecto 'development'
env_file = f".env.{environment}"
load_dotenv(env_file)

try:
    # Conexión a la base de datos con las variables de entorno
    dataBase = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        passwd=os.getenv('DB_PASS')
    )

    # Verificar si la conexión fue exitosa
    if dataBase.is_connected():
        print(f"Conectado a MySQL ({environment} environment)")

        # Crear un cursor
        cursorObject = dataBase.cursor()

        # Crear la base de datos si no existe
        db_name = os.getenv('DB_NAME')
        cursorObject.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        print(f"Base de datos '{db_name}' creada o ya existe.")

except mysql.connector.Error as e:
    print(f"Error al conectar con MySQL: {e}")
finally:
    # Cerrar la conexión si está abierta
    if 'dataBase' in locals() and dataBase.is_connected():
        cursorObject.close()
        dataBase.close()
        print("Conexión a MySQL cerrada.")




""" import mysql.connector

dataBase = mysql.connector.connect(
    host = 'localhost',
    user = 'root',
    passwd = '1234'
)

# prepare a cursor object

cursorObject = dataBase.cursor()

cursorObject.execute("CREATE DATABASE lendhero")

print("ALL DONE!") """
