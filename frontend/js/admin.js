// ================================================================
// ADMIN-RECARGAS · GESTIÓN DE RECARGAS
// ================================================================

(function () {
    let currentFilter = 'all';

    async function loadRecargasAdmin(filter = currentFilter) {
        currentFilter = filter;
        const container = document.getElementById('adminRecargasList');
        if (!container) return;

        container.innerHTML = '<div class="loading-message">Cargando recargas...</div>';

        try {
            const url = filter === 'all' ? '/admin/recargas' : `/admin/recargas?estado=${filter}`;
            const recargas = await window.apiGet(url);

            if (!recargas || recargas.length === 0) {
                container.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>No hay solicitudes de recarga</p>
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
                const comprobanteUrl = '/' + r.comprobante;

                return `
                    <div class="recarga-admin-item ${estadoClass}">
                        <div class="recarga-admin-info">
                            <div>
                                <strong>Usuario ID: ${r.user_id}</strong>
                                <span class="recarga-email">${r.email}</span>
                            </div>
                            <div class="recarga-meta">
                                <span class="recarga-credits">${r.credits} créditos</span>
                                <span class="recarga-amount">$${r.amount.toFixed(2)}</span>
                                <span class="recarga-fecha">${fecha}</span>
                            </div>
                            <div class="recarga-comprobante">
                                <a href="${comprobanteUrl}" target="_blank" class="btn-ver-comprobante">
                                    <i class="fas fa-eye"></i> Ver comprobante
                                </a>
                                ${r.mensaje ? `<span class="recarga-mensaje">💬 ${r.mensaje}</span>` : ''}
                                ${r.motivo ? `<span class="recarga-motivo-admin">Motivo: ${r.motivo}</span>` : ''}
                            </div>
                        </div>
                        <div class="recarga-admin-actions">
                            <span class="recarga-estado ${estadoClass}">${estadoLabel}</span>
                            ${r.estado === 'pending' ? `
                                <button class="btn-aprobar-recarga" onclick="window.aprobarRecarga(${r.id})">
                                    <i class="fas fa-check"></i> Aprobar
                                </button>
                                <button class="btn-rechazar-recarga" onclick="window.abrirModalRechazo(${r.id})">
                                    <i class="fas fa-times"></i> Rechazar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error al cargar recargas:', error);
            container.innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    }

    // ===== APROBAR RECARGA =====
    async function aprobarRecarga(id) {
        if (!confirm('¿Aprobar esta recarga?')) return;
        try {
            await window.apiPut(`/admin/recargas/${id}`, { estado: 'approved' });
            window.showSuccess('Recarga aprobada');
            loadRecargasAdmin(currentFilter);
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== ABRIR MODAL PARA RECHAZAR CON MOTIVO =====
    function abrirModalRechazo(id) {
        const motivo = prompt('Motivo del rechazo:');
        if (motivo === null) return;
        if (motivo.trim() === '') {
            window.showError('Debes ingresar un motivo');
            return;
        }
        rechazarRecarga(id, motivo.trim());
    }

    async function rechazarRecarga(id, motivo) {
        try {
            await window.apiPut(`/admin/recargas/${id}`, { estado: 'rejected', motivo });
            window.showSuccess('Recarga rechazada');
            loadRecargasAdmin(currentFilter);
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== FILTROS =====
    document.addEventListener('DOMContentLoaded', function() {
        const filterBtns = document.querySelectorAll('#section-recargas .filter-btn');
        if (filterBtns.length) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    const filter = this.dataset.filter;
                    loadRecargasAdmin(filter);
                });
            });
        }
        // Cargar al inicio si la sección está activa
        if (document.getElementById('section-recargas')?.classList.contains('active')) {
            loadRecargasAdmin('all');
        }
    });

    // ===== EXPONER FUNCIONES GLOBALES =====
    window.loadRecargasAdmin = loadRecargasAdmin;
    window.aprobarRecarga = aprobarRecarga;
    window.abrirModalRechazo = abrirModalRechazo;
})();