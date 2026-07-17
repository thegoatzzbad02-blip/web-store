from flask import Blueprint, request, jsonify, current_app
from backend.database import get_db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import re
import traceback

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        identifier = data.get('username', '').strip()  # puede ser email o username
        password = data.get('password', '')

        if not identifier or not password:
            return jsonify({'message': 'Faltan credenciales'}), 400

        db = get_db()
        cursor = db.cursor()

        # Buscar por username o email
        cursor.execute(
            "SELECT id, username, email, password, role, credits FROM users WHERE username = ? OR email = ?",
            (identifier, identifier)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Usuario no encontrado'}), 401

        # Verificar contraseña con werkzeug (soporta scrypt y bcrypt)
        if not check_password_hash(user['password'], password):
            return jsonify({'message': 'Contraseña incorrecta'}), 401

        # Generar token JWT
        secret = current_app.config.get('SECRET_KEY', 'clave_secreta_por_defecto')
        payload = {
            'user_id': user['id'],
            'username': user['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }
        token = jwt.encode(payload, secret, algorithm='HS256')

        return jsonify({
            'message': 'Inicio de sesión exitoso',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'credits': user['credits']
            }
        }), 200

    except Exception as e:
        print("Error en login:", traceback.format_exc())
        return jsonify({'message': 'Error interno', 'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')

        if not username or not email or not password or not confirm_password:
            return jsonify({'message': 'Todos los campos son obligatorios'}), 400

        if not validate_email(email):
            return jsonify({'message': 'Correo electrónico inválido'}), 400

        if password != confirm_password:
            return jsonify({'message': 'Las contraseñas no coinciden'}), 400

        if len(password) < 6:
            return jsonify({'message': 'La contraseña debe tener al menos 6 caracteres'}), 400

        db = get_db()
        cursor = db.cursor()

        # Verificar username único
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return jsonify({'message': 'El nombre de usuario ya está en uso'}), 400

        # Verificar email único
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            return jsonify({'message': 'El correo electrónico ya está registrado'}), 400

        # Hash de contraseña con werkzeug (método scrypt, compatible con los existentes)
        hashed = generate_password_hash(password, method='scrypt')

        # Insertar usuario
        cursor.execute(
            "INSERT INTO users (username, email, password, role, credits, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (username, email, hashed, 'user', 0, datetime.datetime.utcnow())
        )
        db.commit()

        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'username': username,
            'email': email
        }), 201

    except Exception as e:
        print("Error en register:", traceback.format_exc())
        return jsonify({'message': 'Error interno del servidor'}), 500