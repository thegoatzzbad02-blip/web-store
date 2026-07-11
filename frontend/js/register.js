// ================================================================
// REGISTER · Lógica de registro
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const messageBox = document.getElementById('registerMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirmPassword = document.getElementById('regConfirmPassword').value.trim();

        // Validaciones
        if (!username || !email || !password || !confirmPassword) {
            messageBox.textContent = '❌ Todos los campos son obligatorios.';
            messageBox.className = 'auth-message error';
            return;
        }

        if (password !== confirmPassword) {
            messageBox.textContent = '❌ Las contraseñas no coinciden.';
            messageBox.className = 'auth-message error';
            return;
        }

        if (password.length < 6) {
            messageBox.textContent = '❌ La contraseña debe tener al menos 6 caracteres.';
            messageBox.className = 'auth-message error';
            return;
        }

        // Deshabilitar botón mientras se procesa
        const btn = form.querySelector('.auth-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, confirm_password: confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
                messageBox.textContent = '✅ ' + data.message;
                messageBox.className = 'auth-message success';
                form.reset();
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                messageBox.textContent = '❌ ' + (data.message || 'Error al registrar usuario');
                messageBox.className = 'auth-message error';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Crear cuenta';
            }
        } catch (error) {
            console.error('Error:', error);
            messageBox.textContent = '❌ Error de conexión. Intenta de nuevo.';
            messageBox.className = 'auth-message error';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Crear cuenta';
        }
    });
});