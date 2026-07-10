// ================================================================
// ADMIN-USUARIOS · Gestión de usuarios (con modal de edición)
// ================================================================

(function () {
    console.log('✅ admin-usuarios.js cargado');

    // ===== CARGAR USUARIOS (con espera hasta que el elemento exista) =====
    async function loadUsers() {
        console.log('🔄 loadUsers ejecutada');

        let list = document.getElementById('userList');
        let intentos = 0;
        const maxIntentos = 30;

        while (!list && intentos < maxIntentos) {
            console.log(`⏳ Intentando encontrar userList (${intentos + 1}/${maxIntentos})...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            list = document.getElementById('userList');
            intentos++;
        }

        if (!list) {
            console.error('❌ userList no encontrado después de varios intentos');
            console.warn('💡 Verifica que tu admin.html tenga <div id="userList"></div>');
            return;
        }

        console.log('✅ userList encontrado');
        list.innerHTML = '<p class="loading-message">Cargando usuarios...</p>';

        try {
            const users = await window.apiGet('/admin/users');
            if (!users || !users.length) {
                list.innerHTML = '<p class="empty-message">No hay usuarios registrados.</p>';
                return;
            }

            list.innerHTML = users.map((user) => `
                <div class="admin-list-item">
                    <div>
                        <strong>${window.escapeHtml(user.username)}</strong>
                        <div class="muted">Rol: ${window.escapeHtml(user.role || 'user')} · Créditos: ${window.formatCredits(user.credits || 0)}</div>
                    </div>
                    <div class="admin-actions">
                        <button onclick="window.editUser(${user.id})">Editar</button>
                        <button class="danger" onclick="window.deleteUser(${user.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');

            console.log('✅ Usuarios cargados correctamente');
        } catch (error) {
            console.error('❌ Error en loadUsers:', error);
            list.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // ===== CREAR USUARIO =====
    async function createUser() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();
        const credits = Number(document.getElementById('newCredits').value || 0);
        if (!username || !password) {
            window.showError('Usuario y contraseña son obligatorios');
            return;
        }

        try {
            await window.apiPost('/admin/users', { username, password, credits });
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newCredits').value = '0';
            window.showSuccess('Usuario creado correctamente');
            loadUsers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== EDITAR USUARIO (ABRIR MODAL) =====
    async function editUser(id) {
        console.log('🔄 editUser ejecutada con id:', id);
        try {
            const users = await window.apiGet('/admin/users');
            const user = users.find(u => u.id === id);
            if (!user) {
                window.showError('Usuario no encontrado');
                return;
            }

            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUsername').value = user.username || '';
            document.getElementById('editCredits').value = user.credits || 0;
            document.getElementById('editPassword').value = '';
            document.getElementById('editRole').value = user.role || 'user';

            const modal = document.getElementById('editUserModal');
            if (modal) modal.style.display = 'flex';
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== CERRAR MODAL =====
    function closeEditUserModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) modal.style.display = 'none';
    }

    // ===== GUARDAR CAMBIOS DESDE EL MODAL =====
    async function saveEditUser() {
        console.log('🔄 saveEditUser ejecutada');
        const id = parseInt(document.getElementById('editUserId').value);
        const username = document.getElementById('editUsername').value.trim();
        const credits = parseInt(document.getElementById('editCredits').value) || 0;
        const password = document.getElementById('editPassword').value.trim();
        const role = document.getElementById('editRole').value;

        const data = {};
        if (username) data.username = username;
        data.credits = credits;
        if (password) {
            if (password.length < 6) {
                window.showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            data.password = password;
        }
        data.role = role;

        try {
            await window.apiPut(`/admin/users/${id}`, data);
            window.showSuccess('Usuario actualizado correctamente');
            closeEditUserModal();
            loadUsers();
        } catch (error) {
            console.error('Error en saveEditUser:', error);
            window.showError(error.message || 'Error al actualizar usuario');
        }
    }

    // ===== ELIMINAR USUARIO =====
    async function deleteUser(id) {
        if (!confirm('¿Eliminar este usuario?')) return;
        try {
            await window.apiDelete(`/admin/users/${id}`);
            window.showSuccess('Usuario eliminado');
            loadUsers();
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== EVENTOS =====
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 admin-usuarios.js inicializado');

        const createBtn = document.getElementById('createUserBtn');
        if (createBtn) {
            createBtn.addEventListener('click', createUser);
            console.log('✅ Botón crear usuario configurado');
        } else {
            console.warn('⚠️ Botón createUserBtn no encontrado');
        }

        const saveBtn = document.getElementById('saveEditUserBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveEditUser);
            console.log('✅ Botón guardar edición configurado');
        } else {
            console.warn('⚠️ Botón saveEditUserBtn no encontrado');
        }

        // Verificar si la sección de usuarios está activa al cargar
        const isUsuariosActive = document.getElementById('section-usuarios')?.classList.contains('active');
        if (isUsuariosActive) {
            console.log('🔄 Sección usuarios activa al cargar, cargando usuarios...');
            setTimeout(() => loadUsers(), 300);
        }
    });

    // ===== EXPONER FUNCIONES GLOBALES =====
    window.loadUsers = loadUsers;
    window.createUser = createUser;
    window.editUser = editUser;
    window.closeEditUserModal = closeEditUserModal;
    window.saveEditUser = saveEditUser;
    window.deleteUser = deleteUser;

    console.log('✅ admin-usuarios.js listo');
})();