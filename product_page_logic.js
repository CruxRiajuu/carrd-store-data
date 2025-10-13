// FINAL, COMPLETE, ROBUST product_page_logic.js - USES JSONP WORKAROUND

(function() {
    // --- 1. CONFIGURATION (URLs and Mapping) ---
    // NOTE: URLs MUST point to .js files for the JSONP workaround.
    const DIGITAL_PRODUCTS_URL = `https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/digital_products_heirarchy.js`;
    const PHYSICAL_PRODUCTS_MASTER_URL = `https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/physical_products.js`; // Assuming your master file is renamed

    const pageMapping = { 
        'digitalart': 'artcommission', 'animation': 'animationcommission', 'vtubermodeling': 'vtubecommission', 
        'videoediting': 'videoedit', 'streamkitemotes': 'streamkitemotes', 'streamkitoverlays': 'streamkitoverlays', 
        'logodesign': 'logodesign', 'webdesigncarrd': 'webdesigncarrd', 'webdesigncustom': 'webdesigncustom', 
        'webdesignecommerce': 'webdesignecommerce', 'physicalworks': 'cruxbrandshirt', 'cruxbrandshirt': 'cruxbrandshirt' 
    };

    // --- 2. DOM ELEMENTS AND STATE ---
    const container = document.getElementById('single-product-container');
    const wrapper = document.getElementById('single-product-wrapper');
    let allBaseProducts = [];
    let digitalProducts = [];
    let physicalProducts = [];
    let initializationPromiseResolver;

    // --- 3. UTILITY AND LAYOUT FUNCTIONS ---
    const formatPrice = (price) => (price / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
    const renderError = (message) => { 
        if(container) { 
            container.innerHTML = `<div class="diagnostic-output">--- CRITICAL ERROR ---<br>${message}</div>`; 
            window.dispatchEvent(new Event('fixed_elements_update'));
        } 
    };
    const positionWrapper = () => { 
        if (!wrapper) return; 
        let topOffset = 0; 
        document.querySelectorAll('[data-fixed-element]').forEach(el => { 
            if (!el.classList.contains('hidden')) { 
                topOffset += el.offsetHeight; 
            } 
        }); 
        wrapper.style.marginTop = `${topOffset}px`; 
        window.dispatchEvent(new Event('fixed_elements_update'));
    };
    
    // GLOBAL CALLBACK: This function is called by the external product JS files (JSONP)
    window.products_data = function(data) {
        digitalProducts = data;
        if (initializationPromiseResolver) {
            initializationPromiseResolver(true);
        }
    };
    
    // --- 4. CORE LOGIC (Cart/Product Interaction) ---

    window.addSelectedVariantToCart_universal = () => {
        if (typeof window.addToCart !== 'function') return alert("Error: Main cart system not found.");
        const productContainer = document.querySelector('.product-page-container');
        const baseId = productContainer.dataset.baseId;
        const productData = allBaseProducts.find(p => p.base_id === baseId);
        let finalVariant;
        
        if (productData.options_config) { 
            const selections = productData.options_config.map(opt => document.querySelector(`input[name="${opt.name.toLowerCase()}"]:checked`)?.value);
            if (selections.some(s => !s)) return alert("Please make a selection for all options.");
            let currentLevel = productData.options;
            // Traverse the nested JSON structure to find the final product variant
            for (const selection of selections) { 
                 currentLevel = currentLevel && currentLevel[selection] ? (currentLevel[selection].variants || currentLevel[selection]) : null;
            }
            finalVariant = currentLevel;
        } else { 
            const selectedRadio = document.querySelector(`input[name="variant_${baseId}"]:checked`);
            if (selectedRadio) { finalVariant = productData.variants.find(v => v.id === parseInt(selectedRadio.value)); }
        }

        if (finalVariant && finalVariant.id) { 
            window.addToCart(finalVariant.id, 1); 
        } else { 
            alert("Please make a valid selection."); 
        }
    };

    window.updateProductPage_universal = (baseId) => {
        const productData = allBaseProducts.find(p => p.base_id === baseId);
        if (!productData) return;

        const priceDisplay = document.querySelector(`[data-base-id="${baseId}"] .price-display`);
        const titleEl = document.querySelector(`[data-base-id="${baseId}"] h1`);
        const imageEl = document.getElementById('product-image-container')?.querySelector('img');

        if (productData.options_config) { 
            const config = productData.options_config;
            const selections = config.map(opt => document.querySelector(`input[name="${opt.name.toLowerCase()}"]:checked`)?.value);
            
            // Cascade Logic
            for (let i = 1; i < config.length; i++) {
                const prevSelection = selections[i - 1];
                const currentGroup = document.getElementById(`${config[i].name.toLowerCase()}-group`);
                if (!currentGroup) continue;
                currentGroup.innerHTML = `<legend>${config[i].label}</legend>`; 
                if (!prevSelection) {
                    currentGroup.classList.add('hidden-options');
                } else {
                    let path = productData.options[selections[0]] ? (productData.options[selections[0]].variants || productData.options[selections[0]]) : null;
                    if (i === 2) { // Special check for the third tier (Finish)
                        path = path && path[prevSelection] ? (path[prevSelection].variants || path[prevSelection]) : null;
                    }
                    
                    if (path && Object.keys(path).length > 0) {
                        const nextOptions = Object.keys(path).sort();
                        let html = `<legend>${config[i].label}</legend>`;
                        html += nextOptions.map(opt => `<input type="radio" id="${config[i].name.toLowerCase()}_${opt.replace(/\s+/g, '-')}" name="${config[i].name.toLowerCase()}" value="${opt}" onclick="updateProductPage_universal('${baseId}')"><label class="option-label" for="${config[i].name.toLowerCase()}_${opt.replace(/\s+/g, '-')}">${opt}</label>`).join('');
                        currentGroup.innerHTML = html;
                        currentGroup.classList.remove('hidden-options');
                    } else { currentGroup.classList.add('hidden-options'); }
                }
            }

            // Price/Title Logic
            let finalVariant, currentPath = productData.options, titleParts = [];
            for (const [index, selection] of selections.entries()) { 
                if (selection) { titleParts.push(selection); currentPath = currentPath && currentPath[selection] ? (currentPath[selection].variants || currentPath[selection]) : null; } 
            }
            finalVariant = currentPath && currentPath.id ? currentPath : null;

            if (titleEl) titleEl.textContent = productData.base_name + (titleParts.length > 0 ? ` (${titleParts.join(' / ')})` : '');
            if (priceDisplay) priceDisplay.textContent = finalVariant ? formatPrice(finalVariant.price) : '---';
            
        } else { 
            const selectedRadio = document.querySelector(`input[name="variant_${baseId}"]:checked`);
            if (!selectedRadio) return;
            const variant = productData.variants.find(v => v.id === parseInt(selectedRadio.value));
            if (variant) { if (priceDisplay) priceDisplay.textContent = formatPrice(variant.price); if (titleEl) titleEl.textContent = variant.name; }
        }
    };
    
    const renderProduct = (product) => {
        let optionsHTML = '';
        if (product.options_config) { 
            product.options_config.forEach((opt, i) => { 
                optionsHTML += `<fieldset class="option-group ${i > 0 ? 'hidden-options' : ''}" id="${opt.name.toLowerCase()}-group"><legend>${opt.label}</legend>`; 
                if (i === 0) { 
                    optionsHTML += Object.keys(product.options).sort().map(o => `<input type="radio" id="${opt.name.toLowerCase()}_${o.replace(/\s+/g, '-')}" name="${opt.name.toLowerCase()}" value="${o}" onclick="updateProductPage_universal('${baseId}')"><label class="option-label" for="${opt.name.toLowerCase()}_${o.replace(/\s+/g, '-')}">${o}</label>`).join(''); 
                } 
                optionsHTML += `</fieldset>`; 
            }); 
        } else if (product.variants) { 
            optionsHTML = `<fieldset class="option-group"><legend>${product.option_name || 'Option'}:</legend>${product.variants.map((v, index) => `<input type="radio" id="var_${v.id}" name="variant_${product.base_id}" value="${v.id}" onchange="updateProductPage_universal('${baseId}')" ${index === 0 ? 'checked' : ''}><label class="option-label" for="var_${v.id}">${v.option_label || v.name}</label>`).join('')}</fieldset>`; 
        }
        const initialPrice = product.variants ? formatPrice(product.variants[0].price) : '---';
        const initialTitle = product.base_name;
        container.innerHTML = `<div class="product-page-container" data-base-id="${product.base_id}"><div id="product-image-container"><img src="${product.base_image}" alt="${product.base_name}"></div><div class="product-details"><h1>${initialTitle}</h1><div class="price-display">${initialPrice}</div><p class="description">${product.description}</p><div class="options-container">${optionsHTML}</div><div class="button-wrapper"><div class="buynow-container"><a href="javascript:void(0);" onclick="addSelectedVariantToCart_universal()" class="buynow-button"><span class="buynow-text">Add to Cart</span></a></div><div class="buynow-container"><a href="javascript:void(0);" onclick="typeof openCartModal === 'function' ? openCartModal() : alert('Cart not available.')" class="buynow-button"><span class="buynow-text">View Cart</span></a></div></div></div></div>`;
        updateProductPage_universal(product.base_id);
    };


    // --- 5. INITIALIZATION FUNCTION (JSONP LOADER) ---

    async function initializePage() {
        if (!container) return;
        container.innerHTML = `<p style="color:#ccc;font-family:monospace;text-align:center;padding:3rem 0;">1/3: Loading Digital Data...</p>`;
        positionWrapper(); 

        try {
            // 1. Load Digital Products (using JSONP method for GitHub access)
            const loadDigitalPromise = new Promise(resolve => {
                initializationPromiseResolver = resolve;
                const script = document.createElement('script');
                script.src = DIGITAL_PRODUCTS_URL + '?t=' + new Date().getTime();
                script.onerror = () => {
                     renderError(`Digital Products failed to load. Check the URL: ${DIGITAL_PRODUCTS_URL}`);
                     resolve(false);
                };
                document.body.appendChild(script);
            });
            
            await loadDigitalPromise;

            if (digitalProducts.length === 0) {
                return renderError(`Digital Products data is empty or failed to load. Check ${DIGITAL_PRODUCTS_URL}`);
            }

            // 2. Combine Data and Find Product to Display
            allBaseProducts = [...digitalProducts, ...physicalProducts];

            const pageHash = window.location.hash.substring(1).toLowerCase().replace(/-/g, '');
            if (!pageHash) return renderError("PAGE LINK NOT SET. Set this section's on-page link in Carrd (e.g., '#digitalart').");

            const productIdToLoad = pageMapping[pageHash] || pageHash;
            const productToDisplay = allBaseProducts.find(p => p && p.base_id && p.base_id.toLowerCase() === productIdToLoad);

            if (productToDisplay) {
                renderProduct(productToDisplay);
            } else {
                return renderError(`PRODUCT NOT FOUND.<br>Could not find product with base_id: "${productIdToLoad}" (mapped from '#${pageHash}').`);
            }

        } catch (error) {
            return renderError(`CRITICAL ERROR: Initialization failed.<br>Details: ${error.message}`);
        }
        
        window.dispatchEvent(new Event('fixed_elements_update'));
    }

    // --- 6. EVENT LISTENERS AND INITIAL CALL ---
    
    window.addEventListener('hashchange', () => setTimeout(initializePage, 50));
    window.addEventListener('load', initializePage);
    if (document.readyState !== 'loading') {
        initializePage();
    }
})();
