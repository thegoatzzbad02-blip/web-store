// ================================================================
// RECARGAS · LÓGICA DE USUARIO (VERSIÓN SIMPLIFICADA)
// ================================================================

(function () {
    console.log('📦 recargas.js cargado');

    async function loadRecargas() {
        console.log('🔄 loadRecargas ejecutada');
        await cargarPerfil();
        await cargarHistorial();
        configurarFormulario();
    }

    async function cargarPerfil() {
        try {
            const user = await window.apiGet('/user/profile');
            const emailInput = document.getElementById('recargaEmail');
            if (emailInput) {
                emailInput.value = user.email || user.username + '@email.com';
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }
    }

    async function cargarHistorial() {
        const container = document.getElementById('recargasList');
        if (!container) return;

        container.innerHTML = '<div class="loading-message">Cargando historial...</div>';

        try {
            const recargas = await window.apiGet('/user/recargas');
            if (!recargas || recargas.length === 0) {
                container.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>No tienes solicitudes de recarga</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = recargas.map(r => {
                const estadoClass = r.estado === 'approved' ? 'aprobado' :
                                    r.estado === 'rejected' ? 'rechazado' : 'pendiente';
                const estadoLabel = r.estado === 'approved' ? '✅ Aprobado' :
                                    r.estado === 'rejected' ? '❌ Rechazado' : '⏳ Pendiente';
                const fecha = new Date(r.creado_en).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
                return `
                    <div class="recarga-item ${estadoClass}">
                        <div class="recarga-info">
                            <span class="recarga-credits">${r.credits} créditos</span>
                            <span class="recarga-amount">$${r.amount.toFixed(2)}</span>
                        </div>
                        <div class="recarga-estado ${estadoClass}">${estadoLabel}</div>
                        <div class="recarga-fecha">${fecha}</div>
                        ${r.motivo ? `<div class="recarga-motivo">Motivo: ${r.motivo}</div>` : ''}
                    </div>
                `;
            }).join('');

        } catch (error) {
            container.innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    }

    function configurarFormulario() {
        // Actualizar monto automáticamente
        const creditsInput = document.getElementById('recargaCredits');
        const montoSpan = document.getElementById('recargaMonto');
        if (creditsInput && montoSpan) {
            creditsInput.addEventListener('input', function() {
                const credits = parseInt(this.value) || 0;
                montoSpan.textContent = credits;
            });
        }

        // Enviar formulario
        const form = document.getElementById('recargaForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                await enviarRecarga();
            });
        }
    }

    async function enviarRecarga() {
        console.log('📤 enviarRecarga ejecutada');
        const email = document.getElementById('recargaEmail').value.trim();
        const credits = parseInt(document.getElementById('recargaCredits').value);
        const mensaje = document.getElementById('recargaMensaje').value.trim();
        const comprobante = document.getElementById('recargaComprobante').files[0];
        const messageBox = document.getElementById('recargaMessage');

        if (!email) {
            messageBox.textContent = '❌ El correo es obligatorio.';
            messageBox.className = 'recarga-message error';
            return;
        }

        if (!credits || credits < 5) {
            messageBox.textContent = '❌ El mínimo de recarga es 5 créditos.';
            messageBox.className = 'recarga-message error';
            return;
        }

        if (!comprobante) {
            messageBox.textContent = '❌ Debes subir un comprobante.';
            messageBox.className = 'recarga-message error';
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('credits', credits);
        formData.append('mensaje', mensaje);
        formData.append('comprobante', comprobante);

        const submitBtn = document.querySelector('.btn-enviar-recarga');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const response = await fetch('/api/user/recargar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                messageBox.textContent = '✅ ' + data.message;
                messageBox.className = 'recarga-message success';
                document.getElementById('recargaCredits').value = 5;
                document.getElementById('recargaMensaje').value = '';
                document.getElementById('recargaComprobante').value = '';
                cargarHistorial();
            } else {
                messageBox.textContent = '❌ ' + data.message;
                messageBox.className = 'recarga-message error';
            }
        } catch (error) {
            console.error('Error al enviar recarga:', error);
            messageBox.textContent = '❌ Error de conexión. Intenta de nuevo.';
            messageBox.className = 'recarga-message error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar solicitud';
        }
    }

    window.loadRecargas = loadRecargas;
})();