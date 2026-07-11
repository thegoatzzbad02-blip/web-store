import sqlite3
from backend.database import get_db
from werkzeug.security import generate_password_hash, check_password_hash

class UserModel:
    @classmethod
    def find_by_username(cls, username):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def find_by_email(cls, email):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def find_by_username_or_email(cls, identifier):
        """Busca por username o email (distingue por '@')"""
        if '@' in identifier:
            return cls.find_by_email(identifier)
        else:
            return cls.find_by_username(identifier)

    @classmethod
    def find_by_id(cls, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def check_password(cls, identifier, password):
        """Verifica credenciales usando username o email"""
        user = cls.find_by_username_or_email(identifier)
        if user and check_password_hash(user['password'], password):
            return user
        return None

    @classmethod
    def create_user(cls, username, email, password, role='user', credits=0):
        conn = get_db()
        cursor = conn.cursor()
        hashed = generate_password_hash(password)
        try:
            cursor.execute(
                "INSERT INTO users (username, email, password, role, credits) VALUES (?, ?, ?, ?, ?)",
                (username, email, hashed, role, credits)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return {
                'id': user_id,
                'username': username,
                'email': email,
                'role': role,
                'credits': credits
            }
        except sqlite3.IntegrityError:
            conn.close()
            return None  # Usuario duplicado (username o email)

    @classmethod
    def update_user(cls, user_id, **kwargs):
        conn = get_db()
        cursor = conn.cursor()
        update_fields = []
        values = []

        if 'username' in kwargs and kwargs['username'] is not None:
            update_fields.append("username = ?")
            values.append(kwargs['username'])

        if 'email' in kwargs and kwargs['email'] is not None:
            update_fields.append("email = ?")
            values.append(kwargs['email'])

        if 'credits' in kwargs and kwargs['credits'] is not None:
            update_fields.append("credits = ?")
            values.append(kwargs['credits'])

        if 'password' in kwargs and kwargs['password'] is not None:
            hashed = generate_password_hash(kwargs['password'])
            update_fields.append("password = ?")
            values.append(hashed)

        if 'role' in kwargs and kwargs['role'] is not None:
            if kwargs['role'] not in ['admin', 'user']:
                conn.close()
                return False
            update_fields.append("role = ?")
            values.append(kwargs['role'])

        if not update_fields:
            conn.close()
            return False

        values.append(user_id)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def update_credits(cls, user_id, new_credits):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET credits = ? WHERE id = ?", (new_credits, user_id))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def delete_user(cls, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    @classmethod
    def get_all_users(cls):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, role, credits FROM users")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]