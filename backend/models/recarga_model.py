import sqlite3
from datetime import datetime
from backend.database import get_db

class RecargaModel:
    @classmethod
    def create(cls, user_id, email, credits, amount, comprobante, mensaje=None):
        """Crear una solicitud de recarga (estado: pending)"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO recargas (user_id, email, credits, amount, comprobante, mensaje, estado, creado_en)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        ''', (user_id, email, credits, amount, comprobante, mensaje, datetime.now().isoformat()))
        conn.commit()
        recarga_id = cursor.lastrowid
        conn.close()
        return cls.get_by_id(recarga_id)

    @classmethod
    def get_by_id(cls, recarga_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recargas WHERE id = ?", (recarga_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @classmethod
    def get_by_user(cls, user_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM recargas WHERE user_id = ? ORDER BY creado_en DESC", (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def get_all(cls, estado=None):
        conn = get_db()
        cursor = conn.cursor()
        if estado:
            cursor.execute("SELECT * FROM recargas WHERE estado = ? ORDER BY creado_en DESC", (estado,))
        else:
            cursor.execute("SELECT * FROM recargas ORDER BY creado_en DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @classmethod
    def update_status(cls, recarga_id, estado, motivo=None):
        """Actualizar estado y opcionalmente motivo. Si se aprueba, sumar créditos al usuario."""
        conn = get_db()
        cursor = conn.cursor()
        if motivo:
            cursor.execute('''
                UPDATE recargas SET estado = ?, motivo = ?, procesado_en = ?
                WHERE id = ?
            ''', (estado, motivo, datetime.now().isoformat(), recarga_id))
        else:
            cursor.execute('''
                UPDATE recargas SET estado = ?, procesado_en = ?
                WHERE id = ?
            ''', (estado, datetime.now().isoformat(), recarga_id))
        conn.commit()

        # Si se aprueba, sumar créditos
        if estado == 'approved':
            recarga = cls.get_by_id(recarga_id)
            if recarga:
                from backend.models.user_model import UserModel
                user = UserModel.find_by_id(recarga['user_id'])
                if user:
                    new_credits = user['credits'] + recarga['credits']
                    UserModel.update_credits(recarga['user_id'], new_credits)

        affected = cursor.rowcount
        conn.close()
        return affected > 0