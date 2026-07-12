# migrate.py
import sqlite3
import os

DB_PATH = 'instance/shadow.db'

def run_migrations():
    """Ejecuta todas las migraciones pendientes de forma segura."""
    if not os.path.exists(DB_PATH):
        print("⚠️ La base de datos no existe, saltando migraciones.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Obtener columnas actuales de la tabla users
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    # Migración 1: columna email
    if 'email' not in columns:
        print("🔧 Agregando columna 'email'...")
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
        conn.commit()
        # Asignar email temporal a usuarios existentes
        cursor.execute("UPDATE users SET email = username || '@temp.com' WHERE email IS NULL")
        conn.commit()
        print("✅ Columna 'email' agregada y emails temporales asignados.")

    # Migración 2: columna created_at
    if 'created_at' not in columns:
        print("🔧 Agregando columna 'created_at'...")
        cursor.execute("ALTER TABLE users ADD COLUMN created_at TIMESTAMP")
        conn.commit()
        cursor.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
        conn.commit()
        print("✅ Columna 'created_at' agregada y fechas asignadas.")

    # Migración 3: índice único en email
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_email ON users(email)")
    conn.commit()

    conn.close()
    print("✅ Migraciones completadas.")

if __name__ == '__main__':
    run_migrations()