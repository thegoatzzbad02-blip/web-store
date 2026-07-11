import sys
import os
import socket
from flask import Flask, send_from_directory, jsonify, abort
from flask_cors import CORS
from dotenv import load_dotenv
from backend.database import init_db

# Cargar variables de entorno
load_dotenv()

# ===== CONFIGURACIÓN DE RUTAS =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

print(f"[INFO] Directorio base: {BASE_DIR}")
print(f"[INFO] Sirviendo frontend desde: {FRONTEND_DIR}")

# ===== INICIALIZAR FLASK =====
app = Flask(__name__, 
            static_folder=FRONTEND_DIR,
            static_url_path='')

# Configurar CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Clave secreta
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'clave_secreta_por_defecto')

# Configuración de subida de archivos
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'comprobantes')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

# Inicializar la base de datos
init_db()

# ===== MANEJADORES DE ERRORES =====
@app.errorhandler(404)
def not_found(e):
    return jsonify({'message': 'Recurso no encontrado'}), 404

@app.errorhandler(Exception)
def handle_error(e):
    import traceback
    print("Error interno:", traceback.format_exc())
    return jsonify({'message': 'Error interno del servidor'}), 500

# ===== RUTA DE DIAGNÓSTICO =====
@app.route('/debug/env')
def debug_env():
    return jsonify({
        'FRONTEND_DIR': FRONTEND_DIR,
        'BASE_DIR': BASE_DIR
    })

# ===== BLUEPRINTS (Módulos de la API) =====
from backend.routes.auth_routes import auth_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.user_routes import user_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/user')

# ===== SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND =====
@app.route('/')
def serve_index():
    """Sirve el archivo index.html"""
    return send_from_directory(FRONTEND_DIR, 'index.html')

# ===== SERVIR ARCHIVOS DE UPLOADS (comprobantes) =====
# 🔥 IMPORTANTE: Esta ruta DEBE ir ANTES de la ruta genérica /<path:path>
@app.route('/uploads/<path:filename>')
def uploads(filename):
    """Sirve los comprobantes subidos por los usuarios"""
    print(f"📂 Sirviendo uploads: {filename}")  # Log para depurar
    return send_from_directory(os.path.join(BASE_DIR, 'uploads'), filename)

# ===== RUTA GENÉRICA (para archivos del frontend) =====
@app.route('/<path:path>')
def serve_static(path):
    """Sirve cualquier archivo estático (CSS, JS, imágenes, etc.)"""
    # Si es una ruta de API, no la manejamos aquí
    if path.startswith('api/'):
        abort(404)
    
    # Intentar servir el archivo desde frontend/
    try:
        return send_from_directory(FRONTEND_DIR, path)
    except Exception:
        # Si no existe, devolver 404
        abort(404)

@app.route('/favicon.ico')
def favicon():
    """Sirve el favicon si existe"""
    try:
        return send_from_directory(FRONTEND_DIR, 'favicon.ico')
    except Exception:
        return '', 204

def find_available_port(default_port: int) -> int:
    """Devuelve un puerto disponible, usando el valor por defecto si está libre."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind(('0.0.0.0', default_port))
            return default_port
        except OSError:
            pass

    for port in range(default_port + 1, default_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(('0.0.0.0', port))
                return port
            except OSError:
                continue

    raise RuntimeError(f'No se encontró un puerto disponible cercano a {default_port}')

# ===== INICIAR EL SERVIDOR =====
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    port = find_available_port(port)
    debug_mode = os.getenv('FLASK_DEBUG', '1').lower() in ('1', 'true', 'yes', 'on')
    print(f"[INFO] Iniciando servidor en http://0.0.0.0:{port}")
    app.run(debug=debug_mode, host='0.0.0.0', port=port, use_reloader=False)