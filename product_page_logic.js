// FINAL, COMPLETE, ROBUST product_page_logic.js - CORRECTED INITIALIZATION & DIAGNOSTICS

(function() {
    // This immediately-invoked function ensures the script runs as soon as it's loaded.

    const DIGITAL_PRODUCTS_URL = `https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/digital_products_heirarchy.json`;
    const PHYSICAL_PRODUCTS_MASTER_URL = `https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/physical_products.json`;
    const container = document.getElementById('single-product-container');
    const wrapper = document.getElementById('single-product-wrapper');
    let allBaseProducts = [];

    const pageMapping = { 'digitalart': 'artcommission', 'animation': 'animationcommission', 'vtubermodeling': 'vtubercommission', 'videoediting': 'videoediting', 'streamkit': 'streamkit', 'logodesign': 'logodesign', 'webdesign': 'webdesign', 'physicalworks': 'cruxbrandshirt', 'cruxbrandshirt': 'cruxbrandshirt' };

    const formatPrice = (price) => (price / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
    const renderDiagnostic = (message) => {
        if(container) {
            container.innerHTML = `<div class="diagnostic-output" style="opacity: 1; transform: none;">--- DIAGNOSTIC ---<br><br>${message}</div>`;
            window.dispatchEvent(new Event('fixed_elements_update'));
        }
    };

    window.addSelectedVariantToCart_universal = () => {
        if (typeof window.addToCart !== 'function') return alert("Error: Main cart system not found.");
        const productContainer = document.querySelector('.product-page-container'); if (!productContainer) return;
        const baseId = productContainer.dataset.baseId; const productData = allBaseProducts.find(p => p.base_id === baseId); if (!productData) return;
        let finalVariant;
        if (productData.options_config) {
            const selections = productData.options_config.map(opt => document.querySelector(`input[name="${opt.name.toLowerCase()}"]:checked`)?.value);
            if (selections.some(s => !s)) return alert("Please select all options.");
            let currentLevel = productData.options;
            for (const selection of selections) { currentLevel = currentLevel?.[selection]?.variants || currentLevel?.[selection]; }
            finalVariant = currentLevel;
        } else {
            const selectedRadio = document.querySelector(`input[name="variant_${baseId}"]:checked`);
            if (selectedRadio) finalVariant = productData.variants.find(v => v.id === parseInt(selectedRadio.value));
        }
        if (finalVariant && finalVariant.id) { window.addToCart(finalVariant.id, 1); } else { alert("Please make a valid selection."); }
    };
    
    window.updateProductPage_universal = (baseId) => {
        const productData = allBaseProducts.find(p => p.base_id === baseId); if (!productData) return;
        const priceDisplay = document.querySelector(`[data-base-id="${baseId}"] .price-display`);
        const titleEl = document.querySelector(`[data-base-id="${baseId}"] h1`);
        const imageEl = document.getElementById('product-image-container')?.querySelector('img');
        if (productData.options_config) {
            const config = productData.options_config;
            const selections = config.map(opt => document.querySelector(`input[name="${opt.name.toLowerCase()}"]:checked`)?.value);
            const selectedColor = selections[0];
            if (imageEl && selectedColor && productData.options[selectedColor]?.image) { if (imageEl.src !== productData.options[selectedColor].image) { imageEl.style.opacity = 0; setTimeout(() => { imageEl.src = productData.options[selectedColor].image; imageEl.style.opacity = 1; }, 300); } } else if (imageEl && imageEl.src !== productData.base_image) { if (imageEl.src) { imageEl.style.opacity = 0; setTimeout(() => { imageEl.src = productData.base_image; imageEl.style.opacity = 1; }, 300); } else { imageEl.src = productData.base_image; } }
            for (let i = 1; i < config.length; i++) {
                const prevSelection = selections[i - 1];
                const currentGroup = document.getElementById(`${config[i].name.toLowerCase()}-group`); if (!currentGroup) continue;
                currentGroup.innerHTML = `<legend>${config[i].label}</legend>`;
                if (!prevSelection) { currentGroup.classList.add('hidden-options'); }
                else {
                    let path = productData.options[prevSelection]?.variants;
                    if (path && Object.keys(path).length > 0) {
                        const nextOptions = Object.keys(path).sort(); let html = `<legend>${config[i].label}</legend>`;
                        html += nextOptions.map(opt => `<input type="radio" id="${config[i].name.toLowerCase()}_${opt.replace(/\s+/g, '-')}" name="${config[i].name.toLowerCase()}" value="${opt}" onclick="updateProductPage_universal('${baseId}')"><label class="option-label" for="${config[i].name.toLowerCase()}_${opt.replace(/\s+/g, '-')}">${opt}</label>`).join('');
                        currentGroup.innerHTML = html; currentGroup.classList.remove('hidden-options');
                    } else { currentGroup.classList.add('hidden-options'); }
                }
            }
            let finalVariant, currentPath = productData.options, titleParts = [];
            for (const [index, selection] of selections.entries()) { if (selection) { titleParts.push(selection); currentPath = (index < selections.length - 1) ? currentPath?.[selection]?.variants : currentPath?.[selection]; } }
            finalVariant = currentPath?.id ? currentPath : null;
            if (titleEl) titleEl.textContent = titleParts.length > 0 ? `${productData.base_name} (${titleParts.join(' / ')})` : productData.base_name;
            if (priceDisplay) priceDisplay.textContent = finalVariant ? formatPrice(finalVariant.price) : '---';
        } else {
            const selectedRadio = document.querySelector(`input[name="variant_${baseId}"]:checked`); if (!selectedRadio) return;
            const variant = productData.variants.find(v => v.id === parseInt(selectedRadio.value));
            if (variant) { if (priceDisplay) priceDisplay.textContent = formatPrice(variant.price); if (titleEl) titleEl.textContent = variant.name; if (imageEl && variant.image && imageEl.src !== variant.image) { imageEl.style.opacity = 0; setTimeout(() => { imageEl.src = variant.image; imageEl.style.opacity = 1; }, 300); } }
        }
    };

    const renderProduct = (product) => {
        let optionsHTML = '';
        if (product.options_config) {
            product.options_config.forEach((opt, i) => { optionsHTML += `<fieldset class="option-group ${i > 0 ? 'hidden-options' : ''}" id="${opt.name.toLowerCase()}-group"><legend>${opt.label}</legend>`; if (i === 0) { optionsHTML += Object.keys(product.options).sort().map(o => `<input type="radio" id="${opt.name.toLowerCase()}_${o.replace(/\s+/g, '-')}" name="${opt.name.toLowerCase()}" value="${o}" onclick="updateProductPage_universal('${product.base_id}')"><label class="option-label" for="${opt.name.toLowerCase()}_${o.replace(/\s+/g, '-')}">${o}</label>`).join(''); } optionsHTML += `</fieldset>`; });
        } else if (product.variants) {
            optionsHTML = `<fieldset class="option-group"><legend>${product.option_name || 'Option'}:</legend>${product.variants.map((v, index) => `<input type="radio" id="var_${v.id}" name="variant_${product.base_id}" value="${v.id}" onchange="updateProductPage_universal('${product.base_id}')" ${index === 0 ? 'checked' : ''}><label class="option-label" for="var_${v.id}">${v.option_label || v.name}</label>`).join('')}</fieldset>`;
        }
        container.innerHTML = `<div class="product-page-container" data-base-id="${product.base_id}"><div id="product-image-container"><img src="${product.base_image}" alt="${product.base_name}"></div><div class="product-details"><h1>${product.base_name}</h1><div class="price-display">---</div><p class="description">${product.description}</p><div class="options-container">${optionsHTML}</div><div class="button-wrapper"><div class="buynow-container"><a href="javascript:void(0);" onclick="addSelectedVariantToCart_universal()" class="buynow-button"><span class="buynow-text">Add to Cart</span></a></div><div class="buynow-container"><a href="javascript:void(0);" onclick="typeof openCartModal === 'function' ? openCartModal() : alert('Cart not loaded.')" class="buynow-button"><span class="buynow-text">View Cart</span></a></div></div></div></div>`;
        updateProductPage_universal(product.base_id);
    };

    async function initializePage() {
        if (!container) return; 
        container.innerHTML = `<p style="color:#ccc;font-family:monospace;text-align:center;padding:3rem 0;">1/5: Initializing...</p>`;
        try {
            container.innerHTML = `<p style="color:#ccc;font-family:monospace;text-align:center;padding:3rem 0;">2/5: Fetching digital products...</p>`;
            const digitalResponse = await fetch(`${DIGITAL_PRODUCTS_URL}?t=${new Date().getTime()}`); if (!digitalResponse.ok) throw new Error(`Digital Products fetch failed (Status: ${digitalResponse.status})`); const digitalProducts = await digitalResponse.json();
            container.innerHTML = `<p style="color:#ccc;font-family:monospace;text-align:center;padding:3rem 0;">3/5: Fetching physical products...</p>`;
            let physicalProducts = [];
            try {
                const masterResponse = await fetch(`${PHYSICAL_PRODUCTS_MASTER_URL}?t=${new Date().getTime()}`);
                if (masterResponse.ok) {
                    const masterData = await masterResponse.json();
                    if (masterData && masterData.categories && Array.isArray(masterData.categories)) {
                        const categoryPromises = masterData.categories.map(category => fetch(`${category.url}?t=${new Date().getTime()}`).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch category file: ${category.name}`))));
                        const categoryResults = await Promise.all(categoryPromises);
                        const productUrlArrays = categoryResults.map(cat => (cat.products || []).map(p => p.url));
                        const allProductUrls = productUrlArrays.flat();
                        const productPromises = allProductUrls.map(url => fetch(`${url}?t=${new Date().getTime()}`).then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch product file: ${url}`))));
                        physicalProducts = await Promise.all(productPromises);
                    }
                }
            } catch (error) { console.warn(`Could not process physical products:`, error); }
            allBaseProducts = [...digitalProducts, ...physicalProducts];
            container.innerHTML = `<p style="color:#ccc;font-family:monospace;text-align:center;padding:3rem 0;">4/5: Finding product in catalog...</p>`;
            const pageHash = window.location.hash.substring(1).toLowerCase().replace(/-/g, ''); if (!pageHash) return renderDiagnostic("PAGE LINK NOT SET.<br>Set this section's 'On-page link' in Carrd (e.g., '#digitalart').");
            const productIdToLoad = pageMapping[pageHash] || pageHash; const productToDisplay = allBaseProducts.find(p => p && p.base_id && p.base_id.toLowerCase() === productIdToLoad);
            container.innerHTML = `<p style="color:#ccc;font-family:monospace;text-align:center;padding:3rem 0;">5/5: Building page...</p>`;
            if (productToDisplay) { renderProduct(productToDisplay); } else { renderDiagnostic(`PRODUCT NOT FOUND.<br>Could not find product with base_id: "${productIdToLoad}" (mapped from '#${pageHash}').`); }
        } catch (error) {
            renderDiagnostic(`CRITICAL ERROR: ${error.message}<br>Check your JSON file URLs and ensure your GitHub repo is public.`);
        } finally {
            window.dispatchEvent(new Event('fixed_elements_update'));
        }
    }

    if (typeof window.hasInitializedProductPage === 'undefined') {
        window.hasInitializedProductPage = true;
        window.addEventListener('hashchange', () => setTimeout(initializePage, 50));
        initializePage();
    }
})(); // THE FIX: The script is now wrapped in (function(){ ... })(); to run immediately.
