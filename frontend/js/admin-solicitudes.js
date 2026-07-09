// ================================================================
// ADMIN-SOLICITUDES · GESTIÓN CON DISEÑO MODERNO
// ================================================================

(function () {
    let solicitudes = [];
    let currentFilter = 'all';

    // ===== CARGAR SOLICITUDES CON AGRUPACIÓN =====
    async function loadSolicitudes(filter = currentFilter) {
        currentFilter = filter;
        const list = document.getElementById('solicitudesList');
        if (!list) return;

        list.innerHTML = '<p class="loading-message">Cargando solicitudes...</p>';
        try {
            const data = await window.apiGet('/admin/solicitudes');
            solicitudes = data || [];
            const filtered = filter === 'all' ? solicitudes : solicitudes.filter((item) => item.estado === filter);

            if (!filtered.length) {
                list.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>No hay solicitudes en esta categoría</p>
                    </div>
                `;
                updateStats();
                return;
            }

            // Agrupar por estado
            const grupos = {
                pending: { label: '⏳ Pendientes', icon: 'fa-clock', items: [] },
                completed: { label: '✅ Completadas', icon: 'fa-check-circle', items: [] },
                cancelled: { label: '❌ Canceladas', icon: 'fa-times-circle', items: [] }
            };

            filtered.forEach(s => {
                if (grupos[s.estado]) grupos[s.estado].items.push(s);
            });

            let html = '<div class="solicitudes-container">';

            Object.keys(grupos).forEach(key => {
                const grupo = grupos[key];
                if (grupo.items.length === 0) return;

                html += `
                    <div class="solicitud-grupo">
                        <div class="grupo-header">
                            <h4><i class="fas ${grupo.icon}"></i> ${grupo.label}</h4>
                            <span class="grupo-count">${grupo.items.length}</span>
                        </div>
                        <div class="grupo-body">
                            ${grupo.items.map(s => renderSolicitudCard(s)).join('')}
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            list.innerHTML = html;
            updateStats();

        } catch (error) {
            list.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // ===== RENDERIZAR TARJETA MODERNA =====
    function renderSolicitudCard(solicitud) {
        const estadoClass = solicitud.estado || 'pending';
        const estadoLabels = {
            pending: 'Pendiente',
            completed: 'Completada',
            cancelled: 'Cancelada'
        };
        const initial = (solicitud.username || 'U').charAt(0).toUpperCase();

        // Acciones según estado
        let acciones = '';
        if (solicitud.estado === 'pending') {
            acciones = `
                <button class="btn-detalle" onclick="window.viewSolicitud(${solicitud.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn-aprobar" onclick="window.changeSolicitudStatus(${solicitud.id}, 'completed')">
                    <i class="fas fa-check"></i> Aprobar
                </button>
                <button class="btn-rechazar" onclick="window.changeSolicitudStatus(${solicitud.id}, 'cancelled')">
                    <i class="fas fa-times"></i> Rechazar
                </button>
            `;
        } else {
            acciones = `
                <button class="btn-detalle" onclick="window.viewSolicitud(${solicitud.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn-eliminar" onclick="window.changeSolicitudStatus(${solicitud.id}, 'delete')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            `;
        }

        return `
            <div class="solicitud-card ${estadoClass}">
                <div class="solicitud-info">
                    <!-- Usuario + Plataforma -->
                    <div class="user-line">
                        <span class="user-icon">${initial}</span>
                        <span class="username">${window.escapeHtml(solicitud.username || 'Usuario')}</span>
                        <span class="platform-tag">${window.escapeHtml(solicitud.plataforma || 'Sin plataforma')}</span>
                    </div>

                    <!-- Detalles: email, contraseña, fecha -->
                    <div class="details-line">
                        <span class="detail-item">
                            <i class="fas fa-envelope"></i>
                            <span class="email">${window.escapeHtml(solicitud.email || 'Sin email')}</span>
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-lock"></i>
                            <span class="password">${window.escapeHtml(solicitud.password || 'Sin contraseña')}</span>
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span class="date">${window.escapeHtml(window.formatDate ? window.formatDate(solicitud.creado_en) : (solicitud.creado_en || ''))}</span>
                        </span>
                    </div>

                    <!-- Mensaje (si existe) -->
                    ${solicitud.mensaje ? `
                        <div class="solicitud-mensaje">
                            <i class="fas fa-comment"></i> ${window.escapeHtml(solicitud.mensaje)}
                        </div>
                    ` : ''}
                </div>

                <!-- Estado -->
                <div class="solicitud-status">
                    <span class="status-badge ${estadoClass}">
                        ${estadoLabels[estadoClass] || estadoClass}
                    </span>
                </div>

                <!-- Acciones -->
                <div class="solicitud-actions">
                    ${acciones}
                </div>
            </div>
        `;
    }

    // ===== ACTUALIZAR ESTADÍSTICAS =====
    function updateStats() {
        const total = document.getElementById('totalSolicitudes');
        const pending = document.getElementById('pendingSolicitudes');
        const completed = document.getElementById('completedSolicitudes');
        const stats = {
            total: solicitudes.length,
            pending: solicitudes.filter((item) => item.estado === 'pending').length,
            completed: solicitudes.filter((item) => item.estado === 'completed').length,
            cancelled: solicitudes.filter((item) => item.estado === 'cancelled').length,
        };
        if (total) total.textContent = stats.total;
        if (pending) pending.textContent = stats.pending;
        if (completed) completed.textContent = stats.completed;
    }

    // ===== CAMBIAR ESTADO =====
    async function changeSolicitudStatus(id, estado) {
        if (estado === 'delete') {
            if (!confirm('⚠️ ¿Eliminar esta solicitud permanentemente?')) return;
            try {
                await window.apiDelete(`/admin/solicitudes/${id}`);
                window.showSuccess('Solicitud eliminada');
                loadSolicitudes(currentFilter);
            } catch (error) {
                window.showError(error.message);
            }
            return;
        }

        if (!confirm(`¿${estado === 'completed' ? 'Aprobar' : 'Rechazar'} esta solicitud?`)) return;
        try {
            await window.apiPut(`/admin/solicitudes/${id}`, { estado });
            window.showSuccess('Solicitud actualizada');
            loadSolicitudes(currentFilter);
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== VER DETALLE EN MODAL =====
    function viewSolicitud(id) {
        const solicitud = solicitudes.find((item) => item.id === id);
        const modal = document.getElementById('solicitudModal');
        const modalBody = document.getElementById('solicitudModalBody');
        if (!solicitud || !modal || !modalBody) return;

        modalBody.innerHTML = `
            <div class="solicitud-detalle">
                <div class="detalle-row"><span>Usuario</span><strong>${window.escapeHtml(solicitud.username || '')}</strong></div>
                <div class="detalle-row"><span>Plataforma</span><strong>${window.escapeHtml(solicitud.plataforma)}</strong></div>
                <div class="detalle-row"><span>Correo</span><strong>${window.escapeHtml(solicitud.email)}</strong></div>
                <div class="detalle-row"><span>Contraseña</span><strong>${window.escapeHtml(solicitud.password || 'Sin contraseña')}</strong></div>
                <div class="detalle-row"><span>Mensaje</span><strong>${window.escapeHtml(solicitud.mensaje || 'Sin mensaje')}</strong></div>
                <div class="detalle-row"><span>Estado</span><strong style="color:${solicitud.estado === 'pending' ? 'var(--warning)' : solicitud.estado === 'completed' ? 'var(--success)' : 'var(--danger)'};">${window.escapeHtml(solicitud.estado || 'pending')}</strong></div>
                <div class="detalle-row"><span>Fecha</span><strong>${window.escapeHtml(window.formatDate ? window.formatDate(solicitud.creado_en) : (solicitud.creado_en || ''))}</strong></div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function closeSolicitudModal() {
        const modal = document.getElementById('solicitudModal');
        if (modal) modal.style.display = 'none';
    }

    // ===== FILTROS =====
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.filter-btn').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                loadSolicitudes(button.dataset.filter || 'all');
            });
        });
        loadSolicitudes('all');
    });

    // ===== EXPONER FUNCIONES GLOBALES =====
    window.loadSolicitudes = loadSolicitudes;
    window.changeSolicitudStatus = changeSolicitudStatus;
    window.viewSolicitud = viewSolicitud;
    window.closeSolicitudModal = closeSolicitudModal;

})();