// ================================================================
// ADMIN-PRODUCTOS · Gestión de productos (con campos dinámicos)
// ================================================================

(function () {
    function getActiveCategory() {
        const activeSection = document.querySelector('.admin-section.active');
        if (!activeSection) return null;
        const category = activeSection.id.replace('section-', '');
        return ['giftcards', 'cuentas-hit', 'cursos'].includes(category) ? category : null;
    }

    // ===== CARGAR PRODUCTOS POR CATEGORÍA =====
    async function loadProductsByCategory(category) {
        const listContainer = document.getElementById(`list-${category}`);
        if (!listContainer) return;

        listContainer.innerHTML = '<p class="loading-message">Cargando productos...</p>';

        try {
            const products = await window.apiGet('/admin/products');
            const filtered = (products || []).filter((product) => product.category === category);
            
            if (!filtered.length) {
                listContainer.innerHTML = '<p class="empty-message">No hay productos en esta categoría.</p>';
                return;
            }

            listContainer.innerHTML = filtered.map((product) => {
                const codigosHtml = renderizarCodigos(product.codes);
                return `
                    <div class="product-admin-card" style="background:var(--bg-card); border-radius:var(--radius-sm); padding:16px 20px; border:1px solid var(--border-light); margin-bottom:12px; transition:border-color 0.2s, box-shadow 0.2s;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
                            <div style="flex:1; min-width:200px;">
                                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                    <h4 style="font-size:1.05rem; font-weight:700; margin:0;">${window.escapeHtml(product.name)}</h4>
                                    <span style="background:var(--accent-bg); color:var(--accent-primary); padding:2px 12px; border-radius:40px; font-size:0.65rem; font-weight:700; text-transform:uppercase;">${product.category}</span>
                                    ${product.stock > 0 
                                        ? `<span style="background:rgba(34,211,238,0.12); color:var(--success); padding:2px 10px; border-radius:40px; font-size:0.65rem; font-weight:700;">✅ ${product.stock} disponibles</span>`
                                        : `<span style="background:rgba(248,113,113,0.12); color:var(--danger); padding:2px 10px; border-radius:40px; font-size:0.65rem; font-weight:700;">❌ Agotado</span>`
                                    }
                                </div>
                                
                                ${product.description ? `<p style="font-size:0.85rem; color:var(--text-secondary); margin:6px 0 4px;">📝 ${window.escapeHtml(product.description)}</p>` : ''}
                                
                                <div style="display:flex; flex-wrap:wrap; gap:16px; margin-top:6px; font-size:0.85rem; color:var(--text-secondary);">
                                    <span style="color:var(--accent-primary); font-weight:700;"><i class="fas fa-coins"></i> ${product.price} créditos</span>
                                    <span><i class="fas fa-box"></i> Stock: <strong style="color:${product.stock > 0 ? 'var(--success)' : 'var(--danger)'};">${product.stock}</strong></span>
                                    ${codigosHtml ? `<span class="codes-preview" style="background:var(--bg-input); padding:2px 12px; border-radius:40px; font-size:0.75rem; color:var(--text-secondary); border:1px solid var(--border-light); display:inline-flex; align-items:center; gap:6px; flex-wrap:wrap;">🔑 ${codigosHtml}</span>` : ''}
                                </div>
                            </div>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button onclick="window.viewProduct(${product.id})" class="btn-icon" title="Ver detalles" style="background:transparent; border:none; color:var(--accent-primary); cursor:pointer; padding:6px 10px; border-radius:6px; transition:all 0.2s;">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="window.editProduct(${product.id})" class="btn-icon" title="Editar" style="background:transparent; border:none; color:var(--warning); cursor:pointer; padding:6px 10px; border-radius:6px; transition:all 0.2s;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="window.deleteProduct(${product.id})" class="btn-icon" title="Eliminar" style="background:transparent; border:none; color:var(--danger); cursor:pointer; padding:6px 10px; border-radius:6px; transition:all 0.2s;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            listContainer.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // ===== RENDERIZAR CÓDIGOS DE FORMA LEGIBLE =====
    function renderizarCodigos(codes) {
        if (!codes || codes.length === 0) return '';
        
        const total = codes.length;
        const mostrar = codes.slice(0, 2);
        const restantes = total - 2;
        
        let html = mostrar.map(c => {
            if (c && c.includes(':')) {
                const [email, pass] = c.split(':');
                return `<span class="code-preview" title="Correo: ${email}" style="font-family:monospace; background:var(--bg-secondary); padding:1px 8px; border-radius:4px; font-size:0.7rem; color:var(--text-primary);">${email}</span>`;
            }
            return `<span class="code-preview" style="font-family:monospace; background:var(--bg-secondary); padding:1px 8px; border-radius:4px; font-size:0.7rem; color:var(--text-primary);">${c}</span>`;
        }).join(' ');
        
        if (restantes > 0) {
            html += ` <span class="code-count" style="color:var(--accent-primary); font-weight:600; font-size:0.7rem;">+${restantes} más</span>`;
        }
        
        return html;
    }

    // ===== GENERAR CAMPOS DINÁMICOS PARA CÓDIGOS =====
    function generarCamposCodigos(container, category, stock, existingCodes = []) {
        if (!container) return;
        container.innerHTML = '';
        
        if (!stock || stock <= 0) {
            container.innerHTML = '<small style="color:var(--text-secondary);">💡 Ingresa un stock para crear los campos de cada cuenta.</small>';
            return;
        }

        // Para cuentas-hit, mostramos campos de correo y contraseña separados
        const isCuentaHit = category === 'cuentas-hit';
        const fieldLabel = isCuentaHit ? 'Cuenta #' : 'Código #';

        for (let i = 0; i < stock; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;';
            
            const label = document.createElement('span');
            label.style.cssText = 'font-size:0.8rem; color:var(--text-secondary); min-width:70px;';
            label.textContent = `${fieldLabel}${i+1}:`;
            rowDiv.appendChild(label);
            
            if (isCuentaHit) {
                // Campo Correo
                const emailInput = document.createElement('input');
                emailInput.type = 'email';
                emailInput.placeholder = 'correo@ejemplo.com';
                emailInput.style.cssText = 'flex:1; min-width:120px; padding:6px 10px; background:var(--bg-input); border:1px solid var(--border-light); border-radius:6px; color:var(--text-primary); font-size:0.85rem;';
                emailInput.className = 'dynamic-email';
                emailInput.dataset.index = i;
                if (existingCodes && existingCodes[i]) {
                    const [email, pass] = existingCodes[i].split(':');
                    emailInput.value = email || '';
                    // Guardamos la contraseña para el siguiente campo
                    rowDiv.dataset.pass = pass || '';
                }
                rowDiv.appendChild(emailInput);
                
                // Campo Contraseña
                const passInput = document.createElement('input');
                passInput.type = 'password';
                passInput.placeholder = 'contraseña';
                passInput.style.cssText = 'flex:1; min-width:100px; padding:6px 10px; background:var(--bg-input); border:1px solid var(--border-light); border-radius:6px; color:var(--text-primary); font-size:0.85rem;';
                passInput.className = 'dynamic-password';
                passInput.dataset.index = i;
                if (existingCodes && existingCodes[i]) {
                    const [email, pass] = existingCodes[i].split(':');
                    passInput.value = pass || '';
                }
                rowDiv.appendChild(passInput);
            } else {
                // Campo de código simple
                const codeInput = document.createElement('input');
                codeInput.type = 'text';
                codeInput.placeholder = `Código ${i+1}`;
                codeInput.style.cssText = 'flex:1; min-width:150px; padding:6px 10px; background:var(--bg-input); border:1px solid var(--border-light); border-radius:6px; color:var(--text-primary); font-size:0.85rem;';
                codeInput.className = 'dynamic-code';
                codeInput.dataset.index = i;
                if (existingCodes && existingCodes[i]) {
                    codeInput.value = existingCodes[i];
                }
                rowDiv.appendChild(codeInput);
            }
            
            container.appendChild(rowDiv);
        }
    }

    // ===== CONFIGURAR EVENTOS PARA CAMPOS DINÁMICOS =====
    function configurarCamposDinamicos(form) {
        const stockInput = form.querySelector('.product-stock-input');
        const category = form.dataset.category;
        const codesContainer = form.querySelector('.dynamic-codes-container');
        
        if (!stockInput || !codesContainer) return;
        
        // Cuando cambie el stock, regenerar campos
        stockInput.addEventListener('input', function() {
            const stock = parseInt(this.value) || 0;
            generarCamposCodigos(codesContainer, category, stock);
        });
        
        // También al perder foco, para asegurar
        stockInput.addEventListener('blur', function() {
            const stock = parseInt(this.value) || 0;
            generarCamposCodigos(codesContainer, category, stock);
        });
        
        // Inicializar campos al cargar
        const initialStock = parseInt(stockInput.value) || 0;
        generarCamposCodigos(codesContainer, category, initialStock);
    }

    // ===== RECOLECTAR CÓDIGOS DE LOS CAMPOS DINÁMICOS =====
    function recolectarCodigos(form) {
        const category = form.dataset.category;
        const isCuentaHit = category === 'cuentas-hit';
        const codes = [];
        
        if (isCuentaHit) {
            const emails = form.querySelectorAll('.dynamic-email');
            const passwords = form.querySelectorAll('.dynamic-password');
            for (let i = 0; i < emails.length; i++) {
                const email = emails[i].value.trim();
                const pass = passwords[i].value.trim();
                if (email && pass) {
                    codes.push(`${email}:${pass}`);
                } else if (email || pass) {
                    // Si solo uno está lleno, lo agregamos con el otro vacío
                    codes.push(`${email}:${pass}`);
                }
            }
        } else {
            const codeInputs = form.querySelectorAll('.dynamic-code');
            for (let input of codeInputs) {
                const code = input.value.trim();
                if (code) codes.push(code);
            }
        }
        
        return codes;
    }

    // ===== GUARDAR PRODUCTO =====
    async function saveProduct(data) {
        try {
            await window.apiPost('/admin/products', data);
            window.showSuccess('✅ Producto guardado correctamente');
            const category = data.category;
            if (category) loadProductsByCategory(category);
            const form = document.querySelector(`.product-form[data-category="${category}"]`);
            if (form) {
                form.querySelectorAll('input, textarea').forEach((element) => {
                    if (!element.classList.contains('dynamic-email') && !element.classList.contains('dynamic-password') && !element.classList.contains('dynamic-code')) {
                        element.value = '';
                    }
                });
                // Limpiar campos dinámicos
                const codesContainer = form.querySelector('.dynamic-codes-container');
                if (codesContainer) codesContainer.innerHTML = '';
                // Resetear stock para regenerar
                const stockInput = form.querySelector('.product-stock-input');
                if (stockInput) {
                    stockInput.value = 0;
                    generarCamposCodigos(codesContainer, category, 0);
                }
            }
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== VER PRODUCTO =====
    async function viewProduct(id) {
        window.location.href = `detalle-producto.html?id=${id}`;
    }

    // ===== EDITAR PRODUCTO (CON CAMPOS DINÁMICOS) =====
    async function editProduct(id) {
        try {
            const products = await window.apiGet('/admin/products');
            const product = (products || []).find((item) => item.id === id);
            if (!product) {
                window.showError('No se encontró el producto');
                return;
            }

            // Abrir un modal simplificado (usamos prompt pero con mejor formato)
            // Para una experiencia completa, recomendaría un modal HTML, pero por ahora usamos prompt.
            const name = prompt('📝 Nombre del producto:', product.name);
            if (name === null) return;
            
            const price = prompt('💰 Precio (créditos):', product.price);
            if (price === null) return;
            
            const stock = prompt('📦 Stock (cantidad disponible):', product.stock);
            if (stock === null) return;
            
            const description = prompt('📝 Descripción:', product.description || '');
            if (description === null) return;
            
            // Para editar códigos, mostramos los existentes en formato texto
            let codesPlaceholder = '';
            if (product.category === 'cuentas-hit') {
                codesPlaceholder = 'correo:contraseña (uno por línea)';
            } else {
                codesPlaceholder = 'códigos (uno por línea)';
            }
            const codesText = prompt(`🔑 ${codesPlaceholder}:`, (product.codes || []).join('\n'));
            if (codesText === null) return;

            await window.apiPut(`/admin/products/${id}`, {
                name: name.trim(),
                price: Number(price) || 0,
                stock: Number(stock) || 0,
                category: product.category,
                description: description.trim(),
                codes: codesText.split('\n').map((item) => item.trim()).filter(Boolean),
            });
            
            window.showSuccess('✅ Producto actualizado');
            loadProductsByCategory(product.category);
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== ELIMINAR PRODUCTO =====
    async function deleteProduct(id) {
        if (!confirm('⚠️ ¿Eliminar este producto permanentemente?')) return;
        try {
            await window.apiDelete(`/admin/products/${id}`);
            window.showSuccess('🗑️ Producto eliminado');
            const category = getActiveCategory();
            if (category) loadProductsByCategory(category);
        } catch (error) {
            window.showError(error.message);
        }
    }

    // ===== EVENTOS =====
    document.addEventListener('DOMContentLoaded', () => {
        // Configurar campos dinámicos en cada formulario
        document.querySelectorAll('.product-form').forEach((form) => {
            // Agregar contenedor para códigos dinámicos si no existe
            let codesContainer = form.querySelector('.dynamic-codes-container');
            if (!codesContainer) {
                codesContainer = document.createElement('div');
                codesContainer.className = 'dynamic-codes-container';
                codesContainer.style.cssText = 'grid-column: 1 / -1; margin-top:4px;';
                // Insertar después del textarea de códigos (o donde corresponda)
                const codesTextarea = form.querySelector('.product-codes-input');
                if (codesTextarea) {
                    // Ocultar el textarea original
                    codesTextarea.style.display = 'none';
                    // Insertar el contenedor después de él
                    codesTextarea.parentNode.insertBefore(codesContainer, codesTextarea.nextSibling);
                } else {
                    // Si no hay textarea, lo agregamos al final del formulario
                    form.appendChild(codesContainer);
                }
            }
            
            // Configurar eventos
            configurarCamposDinamicos(form);
        });

        // Botones guardar
        document.querySelectorAll('.btn-save-product').forEach((button) => {
            button.addEventListener('click', () => {
                const form = button.closest('.product-form');
                const category = form?.dataset.category;
                const name = form?.querySelector('.product-name-input').value.trim();
                const price = Number(form?.querySelector('.product-price-input').value || 0);
                const stock = Number(form?.querySelector('.product-stock-input').value || 0);
                const description = form?.querySelector('.product-desc-input').value.trim();
                const codes = recolectarCodigos(form);
                
                if (!name || !price || !stock) {
                    window.showError('❌ Nombre, precio y stock son obligatorios');
                    return;
                }
                if (codes.length !== stock) {
                    window.showError(`⚠️ Debes ingresar exactamente ${stock} códigos (${codes.length} actuales).`);
                    return;
                }
                
                saveProduct({ name, price, stock, category, description, codes });
            });
        });
    });

    // ===== EXPONER FUNCIONES =====
    window.loadProductsByCategory = loadProductsByCategory;
    window.saveProduct = saveProduct;
    window.viewProduct = viewProduct;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
})();