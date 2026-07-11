import sqlite3
import os

DB_PATH = 'instance/shadow.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"❌ La base de datos no existe en {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'email' not in columns:
        print("🔧 Agregando columna 'email'...")
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT UNIQUE")
        conn.commit()

        cursor.execute("SELECT id, username FROM users")
        users = cursor.fetchall()
        for user_id, username in users:
            cursor.execute("UPDATE users SET email = ? WHERE id = ?", (f"{username}@temp.com", user_id))
        conn.commit()
        print(f"✅ Emails temporales asignados a {len(users)} usuarios.")
    else:
        print("✅ La columna 'email' ya existe.")

    conn.close()

if __name__ == '__main__':
    migrate()
