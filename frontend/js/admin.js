// ================================================================
// ADMIN.JS · Panel de administración (navegación y carga)
// ================================================================

(function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Verificar autenticación y rol de admin
    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // ===== ELEMENTOS DEL DOM =====
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburgerToggle = document.getElementById('hamburgerToggle');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('pageTitle');
    const adminUsername = document.getElementById('adminUsername');
    const logoutAdminBtn = document.getElementById('logoutAdminBtn');

    // ===== FUNCIONES DE MENÚ =====
    function toggleSidebar() {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('open');
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
    }

    // ===== NAVEGACIÓN ENTRE SECCIONES =====
    function navigateToSection(section) {
        console.log('➡️ navigateToSection ejecutado:', section);

        // Actualizar menú activo
        navItems.forEach((item) => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Mostrar/Ocultar secciones
        sections.forEach((sectionElement) => {
            sectionElement.classList.remove('active');
        });
        const target = document.getElementById(`section-${section}`);
        if (target) {
            target.classList.add('active');
            console.log(`✅ Sección ${section} activada`);
        } else {
            console.warn(`⚠️ Sección ${section} no encontrada`);
        }

        // Actualizar título
        const titles = {
            dashboard: 'Dashboard',
            giftcards: 'Gift Cards',
            'cuentas-hit': 'Cuentas Hit',
            cursos: 'Cursos',
            'cuentas-dominio': 'Cuentas a dominio',
            vouchers: 'Códigos',
            usuarios: 'Usuarios',
        };
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'Dashboard';
        }

        // Cargar datos según la sección (con retraso para asegurar DOM)
        setTimeout(() => {
            if (section === 'dashboard') {
                window.loadDashboard?.();
            }
            if (section === 'giftcards' || section === 'cuentas-hit' || section === 'cursos') {
                window.loadProductsByCategory?.(section);
            }
            if (section === 'cuentas-dominio') {
                window.loadSolicitudes?.('all');
                window.loadPlatformsConfig?.();
            }
            if (section === 'vouchers') {
                window.loadVouchers?.();
            }
            if (section === 'usuarios') {
                console.log('📡 Llamando a window.loadUsers()');
                if (typeof window.loadUsers === 'function') {
                    window.loadUsers();
                } else {
                    console.warn('⚠️ window.loadUsers no está definida');
                }
            }
        }, 50); // Pequeño retraso para que el DOM se actualice

        closeSidebar();
    }

    // ===== EVENTOS =====
    function bindEvents() {
        // Hamburguesa
        hamburgerToggle?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', closeSidebar);

        // Navegación
        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                navigateToSection(item.dataset.section);
            });
        });

        // Cerrar sesión
        if (logoutAdminBtn) {
            logoutAdminBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }

        // Mostrar nombre del admin
        if (adminUsername) {
            adminUsername.textContent = user.username || 'Admin';
        }
    }

    // ===== INICIALIZAR =====
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Admin.js inicializado');
        bindEvents();
        // Cargar dashboard por defecto
        setTimeout(() => {
            navigateToSection('dashboard');
        }, 100);
    });

    // ===== EXPONER FUNCIONES GLOBALES =====
    window.navigateToAdminSection = navigateToSection;
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;

    console.log('✅ admin.js listo');
})();