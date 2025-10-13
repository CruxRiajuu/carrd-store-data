// FINAL, CORRECTED cart_logic.js: Handles all cart actions and modular product lookup

window.addEventListener('load', function () {
    const STRIPE_PUBLISHABLE_KEY = 'pk_live_51OHfwcIaRpVk2G5N78UiDGdQLFzmUh1dv6bbA0D4N4I5bK2n7mPruCL8YpY10RuhIImCOJka8aikchX9RAi017k100KJUWJMK7';
    const DIGITAL_PRODUCTS_URL = `https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/digital_products_heirarchy.json`;
    const PHYSICAL_PRODUCTS_MASTER_URL = `https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/physical_products.json`;
    
    let stripe, cart = [], allBaseProducts = [];
    const cartModal = document.getElementById('cart-modal'), cartItemsContainer = document.getElementById('cart-items'), cartTotalEl = document.getElementById('cart-total'), emptyCartMessage = document.getElementById('empty-cart-message'), checkoutButton = document.getElementById('checkout-button'), notificationContainer = document.getElementById('notification-container');

    // --- UTILITY / CART MANAGEMENT ---
    function saveCart() { localStorage.setItem("carrd-cart-v4", JSON.stringify(cart)); }
    function loadCart() { const savedCart = localStorage.getItem("carrd-cart-v4"); cart = savedCart ? JSON.parse(savedCart) : []; }
    function formatPrice(priceInCents) { return (priceInCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }); }

    function showNotification(productName) {
        const toast = document.createElement("div");
        toast.className = "notification-toast";
        toast.innerHTML = `<div class="toast-product-name">${productName}</div><div class="toast-main-message">Added to Cart</div>`;
        notificationContainer.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", () => toast.remove());
        }, 3000);
    }

    function renderCart() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = "";
        if (cart.length === 0) {
            emptyCartMessage.style.display = "block"; checkoutButton.disabled = true;
        } else {
            emptyCartMessage.style.display = "none"; checkoutButton.disabled = false;
            cart.forEach(item => {
                const itemEl = document.createElement("div"); itemEl.className = "cart-item";
                const imageHtml = item.image ? `<img src="${item.image}" alt="${item.name}">` : '';
                itemEl.innerHTML = `
                    <div class="cart-item-info">${imageHtml}<div class="cart-item-details"><p>${item.name}</p><p>${formatPrice(item.price)}</p></div></div>
                    <div class="cart-item-quantity">
                        <input type="number" value="${item.quantity}" min="0" onchange="updateQuantity(${item.id}, parseInt(this.value))" autocomplete="off">
                        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>`;
                cartItemsContainer.appendChild(itemEl);
            });
        }
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cartTotalEl.textContent = formatPrice(subtotal);
        const cartBadge = document.getElementById('cart-item-count');
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalItems > 0) { cartBadge.textContent = totalItems; cartBadge.classList.add('visible'); }
            else { cartBadge.classList.remove('visible'); }
        }
    }

    // --- GLOBAL FUNCTIONS FOR EXTERNAL EMBEDS TO CALL ---

    // FIX: This now works correctly with the complex nested products
    window.addToCart = function(productId, quantity = 1) {
        if (allBaseProducts.length === 0) return alert("Error: Product catalog is still loading. Please wait a moment.");
        
        let product;
        // Search through all loaded base products to find the specific variant by its unique ID
        for (const baseProd of allBaseProducts) {
            if (baseProd.options_config) { // Complex product with nested options (e.g., commissions, shirts)
                for (const key1 in baseProd.options) {
                    const level1 = baseProd.options[key1];
                    const variantsContainer = level1.variants || level1;
                    for (const key2 in variantsContainer) {
                        const level2 = variantsContainer[key2];
                        if(level2 && typeof level2 === 'object' && level2.id === productId) { product = level2; break; }
                        if(level2 && level2.variants) { // Handle 3rd level nesting (e.g. Digital Art Commissions)
                            for(const key3 in level2.variants) {
                                const variant = level2.variants[key3];
                                if(variant && variant.id === productId) { product = variant; break; }
                            }
                        }
                        if(product) break;
                    }
                    if (product) break;
                }
            } else if (baseProd.variants) { // Simple product with one level of variants
                 const variant = baseProd.variants.find(v => v.id === productId);
                 if (variant) { product = variant; break; }
            } else if (baseProd.id === productId) { // Product with no variants
                 product = baseProd;
                 break;
            }
            if (product) break;
        }

        if (product) {
            if (!product.stripe_price_id || !product.stripe_price_id.startsWith('price_')) {
                return alert(`Error: The product "${product.name}" is not configured for checkout.`);
            }
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({ ...product, quantity });
            }
            saveCart();
            renderCart();
            showNotification(product.name);
        } else {
            alert(`Error: Could not find product with ID ${productId} to add to cart.`);
        }
    };
    
    // FIX: Rest of global functions rely on local closures (newQuantity, removeFromCart, openCartModal, closeCartModal)
    window.updateQuantity = function(productId, newQuantity) { /* ... (function is unchanged) ... */ };
    window.removeFromCart = function(productId) { /* ... (function is unchanged) ... */ };
    window.openCartModal = function() { renderCart(); cartModal.classList.remove('hidden'); };
    window.closeCartModal = function() { 
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            cartContainer.style.transform = "scale(0.95)";
            setTimeout(() => { cartModal.classList.add('hidden'); cartContainer.style.transform = ""; }, 300);
        }
    };

    window.goToCheckout = async function() {
        if (typeof firebase === 'undefined' || !firebase.auth().currentUser) {
            alert("Please sign in or create an account to proceed to checkout.");
            if (typeof openLoginModal === 'function') openLoginModal();
            return;
        }
        const user = firebase.auth().currentUser;
        if (!stripe || cart.length === 0) return;
        const lineItems = cart.map(item => ({ price: String(item.stripe_price_id), quantity: item.quantity }));
        const checkoutOptions = {
            lineItems: lineItems,
            mode: 'payment',
            successUrl: `${window.location.origin}${window.location.pathname}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: window.location.href,
            customerEmail: user.email,
            clientReferenceId: user.uid,
        };
        const totalShippingUnits = cart.filter(item => item.type === 'physical').reduce((sum, item) => sum + (item.shipping_units || 0) * item.quantity, 0);

        if (totalShippingUnits > 0) {
            checkoutOptions.shippingAddressCollection = { allowedCountries: ['US', 'CA'] };
            const shippingRates = {
                us: { light: 'shr_1SHg5LIaRpVk2G5NK0J6IZiL', medium: 'shr_1SHg80IaRpVk2G5N6cOWkq8u', heavy: 'shr_1SHgABIaRpVk2G5NRdOw6cws' },
                ca: { light: 'shr_1SHggPIaRpVk2G5NbAVunc74', medium: 'shr_1SHgkTIaRpVk2G5NIG9u1SeB', heavy: 'shr_1SHgm7IaRpVk2G5NawYaj2xe' }
            };

            checkoutOptions.shipping_options = [];
            for (const country in shippingRates) {
                let tier;
                if (totalShippingUnits <= 4) { tier = 'light'; }
                else if (totalShippingUnits <= 15) { tier = 'medium'; }
                else { tier = 'heavy'; }
                checkoutOptions.shipping_options.push({ shipping_rate: shippingRates[country][tier] });
            }
        }
        try {
            if (checkoutButton) { checkoutButton.disabled = true; checkoutButton.querySelector('.checkout-text').textContent = "Redirecting..."; }
            const { error } = await stripe.redirectToCheckout(checkoutOptions);
            if (error) throw new Error(error.message);
        } catch (err) {
            alert(`Checkout Error: ${err.message}`);
            if (checkoutButton) { checkoutButton.disabled = false; checkoutButton.querySelector('.checkout-text').textContent = "Checkout"; }
        }
    };

    // --- INITIALIZATION ---
    async function initializeStore() {
        try {
            stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
            const digitalResponse = await fetch(DIGITAL_PRODUCTS_URL + '?t=' + new Date().getTime());
            if (!digitalResponse.ok) throw new Error(`Digital Products fetch failed`);
            const digitalProducts = await digitalResponse.json();
            
            let physicalProducts = [];
            try {
                const masterResponse = await fetch(PHYSICAL_PRODUCTS_MASTER_URL + '?t=' + new Date().getTime());
                if (masterResponse.ok) {
                    const masterData = await masterResponse.json();
                    if (masterData.categories && Array.isArray(masterData.categories)) {
                        const categoryPromises = masterData.categories.map(category => fetch(category.url + '?t=' + new Date().getTime()).then(res => res.ok ? res.json() : []));
                        const categoryResults = await Promise.all(categoryPromises);
                        const productUrlArrays = categoryResults.map(cat => (cat.products || []).map(p => p.url));
                        const allProductUrls = productUrlArrays.flat();
                        const productPromises = allProductUrls.map(url => fetch(url + '?t=' + new Date().getTime()).then(res => res.ok ? res.json() : null));
                        physicalProducts = (await Promise.all(productPromises)).filter(p => p);
                    }
                }
            } catch (error) { console.warn(`Could not process physical products for cart:`, error); }

            allBaseProducts = [...digitalProducts, ...physicalProducts];
            
            loadCart();
            renderCart();
        } catch (t) {
            console.error("Could not initialize the store:", t);
            alert("Error: The shopping cart could not be initialized. Check the console (F12) for details.");
        }
    }

    if (cartModal) {
        cartModal.addEventListener('click', e => { if(e.target === cartModal) closeCartModal(); });
    }
    initializeStore();
});
