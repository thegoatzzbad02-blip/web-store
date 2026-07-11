(function () {
    const token = localStorage.getItem('token');
    let user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user || user.role !== 'user') {
        window.location.href = 'login.html';
    }

    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const profileToggle = document.getElementById('profileToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    const mainContent = document.getElementById('mainContent');
    const logoutMenuBtn = document.getElementById('logoutMenuBtn');
    const logoutDropdownBtn = document.getElementById('logoutDropdownBtn');

    function updateUserHeader() {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const dropdownUsername = document.getElementById('dropdownUsername');
        const dropdownCredits = document.getElementById('dropdownCredits');
        if (usernameDisplay) usernameDisplay.textContent = user?.username || 'Usuario';
        if (dropdownUsername) dropdownUsername.textContent = user?.username || 'Usuario';
        if (dropdownCredits) dropdownCredits.textContent = user?.credits || 0;
    }

    function openMenu(e) {
        e?.preventDefault();
        sideMenu?.classList.add('open');
        menuOverlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu(e) {
        e?.preventDefault();
        sideMenu?.classList.remove('open');
        menuOverlay?.classList.remove('open');
        document.body.style.overflow = '';
    }

    function toggleDropdown(e) {
        e?.stopPropagation();
        profileDropdown?.classList.toggle('open');
        profileToggle?.classList.toggle('active');
        if (profileDropdown?.classList.contains('open')) closeMenu();
    }

    function closeDropdown() {
        profileDropdown?.classList.remove('open');
        profileToggle?.classList.remove('active');
    }

    const sectionMap = {
        dashboard: 'dashboard.html',
        'cuentas-dominio': 'cuentas-dominio.html',
        giftcards: 'giftcards.html',
        'cuentas-hit': 'cuentas-hit.html',
        cursos: 'cursos.html',
        canjear: 'canjear.html',
        generador: 'generador.html',
        soporte: 'soporte.html',
        terminos: 'terminos.html',
        config: 'config.html',
        perfil: 'perfil.html',
        historial: 'historial.html',
        recargas: 'recargas.html', // 👈 NUEVA SECCIÓN
    };

    function navigateTo(section) {
        console.log('➡️ navigateTo ejecutado:', section);
        document.querySelectorAll('.menu-item[data-section]').forEach((item) => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        const url = sectionMap[section];
        if (!url) return;
        if (mainContent) {
            mainContent.innerHTML = '<div class="loading-message">Cargando sección...</div>';
        }

        fetch(url + '?t=' + Date.now())
            .then((response) => {
                if (!response.ok) throw new Error('No se pudo cargar la sección');
                return response.text();
            })
            .then((html) => {
                if (mainContent) {
                    mainContent.innerHTML = html;
                    executeSectionScripts(section);
                }
            })
            .catch((error) => {
                if (mainContent) {
                    mainContent.innerHTML = `<div class="error-message">${error.message}</div>`;
                }
            });
    }

    // ===== EJECUTAR SCRIPTS DE SECCIONES =====
    function executeSectionScripts(section) {
        // ✅ Eliminamos la llamada a initCarousel para que no se ejecute
        // Solo se cargará el HTML del dashboard sin el script del carrusel.
        if (section === 'dashboard') {
            // Si quieres cargar datos del dashboard, puedes hacerlo aquí
            if (typeof window.loadDashboard === 'function') {
                window.loadDashboard();
            }
        }
        if (section === 'giftcards' && typeof window.loadGiftCards === 'function') {
            window.loadGiftCards();
        }
        if (section === 'cuentas-hit' && typeof window.loadCuentasHit === 'function') {
            window.loadCuentasHit();
        }
        if (section === 'cursos' && typeof window.loadCursos === 'function') {
            window.loadCursos();
        }
        if (section === 'cuentas-dominio' && typeof window.loadPlataformasSelector === 'function') {
            window.loadPlataformasSelector();
        }
        if (section === 'canjear' && typeof window.loadCanjear === 'function') {
            window.loadCanjear();
        }
        if (section === 'perfil' && typeof window.loadProfile === 'function') {
            window.loadProfile();
        }
        if (section === 'historial' && typeof window.loadHistory === 'function') {
            window.loadHistory();
        }
        if (section === 'recargas' && typeof window.loadRecargas === 'function') {
            window.loadRecargas();
        }
    }

    async function loadUserProfile() {
        try {
            user = await window.apiGet('/user/profile');
            localStorage.setItem('user', JSON.stringify(user));
            updateUserHeader();
        } catch (error) {
            console.error('No se pudo cargar el perfil:', error);
        }
    }

    function logout() {
        localStorage.clear();
        window.location.href = 'login.html';
    }

    function closeModal() {
        const modal = document.getElementById('codeModal');
        if (modal) modal.style.display = 'none';
    }

    function cerrarRedeemModal() {
        const modal = document.getElementById('redeemModal');
        if (modal) modal.style.display = 'none';
    }

    async function copyCode() {
        const codeElement = document.getElementById('purchasedCode');
        const codeText = codeElement?.textContent?.trim() || '';
        if (!codeText) return;
        try {
            await navigator.clipboard.writeText(codeText);
            window.showSuccess?.('Código copiado');
        } catch (error) {
            window.showError?.('No se pudo copiar el código');
        }
    }

    function showPromoModal() {
        const modal = document.getElementById('promoModal');
        const closeBtn = document.getElementById('promoCloseBtn');
        const timerElement = document.getElementById('promoTimer');
        if (!modal) return;

        let timeLeft = 12;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const timerInterval = setInterval(() => {
            timeLeft -= 1;
            if (timerElement) timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                closePromoModal();
            }
        }, 1000);

        closeBtn?.addEventListener('click', () => {
            clearInterval(timerInterval);
            closePromoModal();
        }, { once: true });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                clearInterval(timerInterval);
                closePromoModal();
            }
        });

        function closePromoModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function bindEvents() {
        menuToggle?.addEventListener('click', openMenu);
        menuToggle?.addEventListener('touchstart', openMenu, { passive: false });
        closeMenuBtn?.addEventListener('click', closeMenu);
        closeMenuBtn?.addEventListener('touchstart', closeMenu, { passive: false });
        menuOverlay?.addEventListener('click', closeMenu);
        menuOverlay?.addEventListener('touchstart', closeMenu, { passive: false });
        profileToggle?.addEventListener('click', toggleDropdown);
        logoutMenuBtn?.addEventListener('click', logout);
        logoutDropdownBtn?.addEventListener('click', logout);

        document.addEventListener('click', (event) => {
            if (!profileDropdown?.contains(event.target) && !profileToggle?.contains(event.target)) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDropdown();
                closeMenu();
            }
        });

        document.querySelectorAll('.menu-item[data-section]').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                navigateTo(item.dataset.section);
                closeMenu();
            });
        });

        document.querySelectorAll('.dropdown-item[data-section]').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                navigateTo(item.dataset.section);
                closeDropdown();
            });
        });

        const closeModalBtn = document.getElementById('closeModal');
        const codeModal = document.getElementById('codeModal');
        const redeemModal = document.getElementById('redeemModal');

        closeModalBtn?.addEventListener('click', closeModal);
        codeModal?.addEventListener('click', (event) => {
            if (event.target === codeModal) closeModal();
        });
        redeemModal?.addEventListener('click', (event) => {
            if (event.target === redeemModal) cerrarRedeemModal();
        });
        document.getElementById('copyCodeBtn')?.addEventListener('click', copyCode);
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateUserHeader();
        loadUserProfile();
        bindEvents();
        navigateTo('dashboard');
        setTimeout(() => showPromoModal(), 500);
    });

    // ===== EXPONER FUNCIONES GLOBALES =====
    window.navigateTo = navigateTo;
    window.comprarProducto = async function (productId, price) {
        console.log('✅ comprarProducto ejecutada:', productId, price);
        if (!confirm(`¿Confirmas la compra por ${price} créditos?`)) return;
        try {
            const data = await window.apiPost(`/user/buy/${productId}`);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            currentUser.credits = data.credits_remaining;
            localStorage.setItem('user', JSON.stringify(currentUser));
            user = currentUser;
            updateUserHeader();
            sessionStorage.setItem('productoComprado', JSON.stringify({ nombre: data.product_name || 'Producto', contenido: data.code }));
            window.location.href = 'confirmacion.html';
        } catch (error) {
            window.showError?.(error.message || 'No se pudo completar la compra');
        }
    };
    window.verDetalles = function (id) {
        window.location.href = `detalle-producto.html?id=${id}`;
    };
    window.closeModal = closeModal;
    window.cerrarRedeemModal = cerrarRedeemModal;
    window.copyCode = copyCode;
    window.cerrarSesion = logout;
    window.logout = logout;
    window.showPromoModal = showPromoModal;

    // ================================================================
    //  CARRUSEL · LÓGICA COMPLETA (pero no se ejecuta automáticamente)
    //  La función permanece disponible por si decides usarla.
    // ================================================================

    function initCarousel() {
        const track = document.getElementById('carouselTrack');
        if (!track) {
            console.warn('⚠️ Carrusel no encontrado');
            return;
        }

        const slides = track.querySelectorAll('.carousel-slide');
        if (!slides.length) {
            console.warn('⚠️ No hay slides en el carrusel');
            return;
        }

        track.style.display = 'flex';
        track.style.transition = 'transform 0.6s ease-in-out';
        track.style.width = '100%';
        track.style.height = '100%';

        slides.forEach(slide => {
            slide.style.flex = '0 0 100%';
            slide.style.width = '100%';
            slide.style.height = '100%';
            slide.style.minHeight = '300px';
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center';
            slide.style.backgroundRepeat = 'no-repeat';
        });

        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');
        const indicators = document.getElementById('carouselIndicators');
        let currentIndex = 0;
        const totalSlides = slides.length;

        if (indicators) indicators.innerHTML = '';

        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.dataset.index = i;
            dot.addEventListener('click', () => goTo(i));
            if (indicators) indicators.appendChild(dot);
        }

        function goTo(index) {
            if (index < 0) index = totalSlides - 1;
            if (index >= totalSlides) index = 0;
            currentIndex = index;
            const offset = -currentIndex * 100;
            track.style.transform = `translateX(${offset}%)`;
            console.log(`🔄 Carrusel: slide ${currentIndex + 1} de ${totalSlides} (transform: ${offset}%)`);

            if (indicators) {
                indicators.querySelectorAll('.dot').forEach((d, i) => {
                    d.classList.toggle('active', i === currentIndex);
                });
            }
        }

        if (prevBtn) {
            const newPrev = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrev, prevBtn);
            newPrev.addEventListener('click', (e) => {
                e.preventDefault();
                goTo(currentIndex - 1);
            });
        }
        if (nextBtn) {
            const newNext = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNext, nextBtn);
            newNext.addEventListener('click', (e) => {
                e.preventDefault();
                goTo(currentIndex + 1);
            });
        }

        if (window.carouselInterval) clearInterval(window.carouselInterval);
        window.carouselInterval = setInterval(() => goTo(currentIndex + 1), 5000);

        goTo(0);
        console.log('✅ Carrusel inicializado correctamente');
    }

    window.initCarousel = initCarousel;
})();