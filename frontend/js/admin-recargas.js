// ================================================================
// ADMIN.JS · Panel de administración (navegación y carga)
// ================================================================

(function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const hamburgerToggle = document.getElementById('hamburgerToggle');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('pageTitle');
    const adminUsername = document.getElementById('adminUsername');
    const logoutAdminBtn = document.getElementById('logoutAdminBtn');

    function toggleSidebar() {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('open');
    }

    function closeSidebar() {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('open');
    }

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
            recargas: 'Recargas', // 👈 Añadido
        };
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'Dashboard';
        }

        // Cargar datos según la sección
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
                if (typeof window.loadUsers === 'function') {
                    window.loadUsers();
                } else {
                    console.warn('⚠️ window.loadUsers no está definida');
                }
            }
            if (section === 'recargas') {
                if (typeof window.loadRecargasAdmin === 'function') {
                    window.loadRecargasAdmin('all'); // 👈 PASAR 'all' EXPLÍCITAMENTE
                } else {
                    console.warn('⚠️ window.loadRecargasAdmin no está definida');
                }
            }
        }, 50);

        closeSidebar();
    }

    function bindEvents() {
        hamburgerToggle?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', closeSidebar);

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                navigateToSection(item.dataset.section);
            });
        });

        if (logoutAdminBtn) {
            logoutAdminBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }

        if (adminUsername) {
            adminUsername.textContent = user.username || 'Admin';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Admin.js inicializado');
        bindEvents();
        setTimeout(() => {
            navigateToSection('dashboard');
        }, 100);
    });

    window.navigateToAdminSection = navigateToSection;
    window.toggleSidebar = toggleSidebar;
    window.closeSidebar = closeSidebar;

    console.log('✅ admin.js listo');
})();