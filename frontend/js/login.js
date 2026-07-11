// ================================================================
// LOGIN · Lógica de inicio de sesión
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const messageBox = document.getElementById('loginMessage');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            messageBox.textContent = '❌ Todos los campos son obligatorios.';
            messageBox.className = 'auth-message error';
            return;
        }

        // Deshabilitar botón mientras se procesa
        const btn = form.querySelector('.auth-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }) // username puede ser usuario o email
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar token y datos del usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    credits: data.credits
                }));

                // Redirigir según el rol
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            } else {
                messageBox.textContent = '❌ ' + (data.message || 'Error al iniciar sesión');
                messageBox.className = 'auth-message error';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar sesión';
            }
        } catch (error) {
            console.error('Error:', error);
            messageBox.textContent = '❌ Error de conexión. Intenta de nuevo.';
            messageBox.className = 'auth-message error';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar sesión';
        }
    });
});