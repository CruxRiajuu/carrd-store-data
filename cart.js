window.addEventListener('load', () => {
  const stripeKey = "pk_live_51OHfwcIaRpVk2G5N78UiDGdQLFzmUh1dv6bbA0D4N4I5bK2n7mPruCL8YpY10RuhIImCOJka8aikchX9RAi017k100KJUWJMK7";
  const productsUrl = "https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/digital_products.json";  // Fixed: No /refs/heads/
  let stripe, cart = [], products = [];
  const modal = document.getElementById("cart-modal");
  const itemsContainer = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-message");
  const content = document.getElementById("cart-content");
  const checkoutBtn = document.getElementById("checkout-trigger");
  const checkoutOptions = document.getElementById("checkout-options");
  const backBtn = document.getElementById("back-to-cart-btn");
  const toastContainer = document.getElementById("toast-container");

  window.openCartModal = () => { renderCart(); modal.classList.add("open"); document.body.style.overflow = "hidden"; };
  window.closeCartModal = () => {
    modal.classList.remove("open");
    content.removeAttribute("id");
    checkoutOptions.style.display = "none";
    // Fixed: No flash – only show checkout if cart has items AFTER render
    setTimeout(() => { 
      checkoutBtn.style.display = cart.length ? "block" : "none"; 
      document.body.style.overflow = ""; 
    }, 450);  // Sync with modal transition
  };
  window.showClearConfirm = () => { document.getElementById("clear-confirm-overlay").classList.add("show"); };
  window.confirmClearCart = () => {
    document.getElementById("clear-confirm-overlay").classList.remove("show");
    cart = [];
    saveCart();
    renderCart();
    showToast("Cart cleared!", "cleared");
  };

  window.enterCheckoutMode = () => { content.id = "checkout-mode"; checkoutBtn.style.display = "none"; renderPayPalButton(); };
  window.backToCart = () => { content.removeAttribute("id"); checkoutBtn.style.display = cart.length ? "block" : "none"; };

  window.addToCart = (id, qty = 1) => {
    if (!products.length) return alert("Loading...");
    const product = products.find(x => x.id === id);
    if (!product) return;
    const existing = cart.find(x => x.id === id);
    if (existing) existing.quantity += qty;
    else cart.push({ ...product, quantity: qty });
    saveCart();
    renderCart();
    showToast(`${product.name}<br>Added to cart`, "added");
  };

  function saveCart() { localStorage.setItem("carrd-cart-adv-nc", JSON.stringify(cart)); }
  function loadCart() { cart = JSON.parse(localStorage.getItem("carrd-cart-adv-nc") || "[]"); }
  function formatPrice(cents) { return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" }); }
  function updateTotal() { totalEl.textContent = formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0)); }

  function renderCart() {
    itemsContainer.innerHTML = "";
    updateTotal();
    if (cart.length === 0) {
      emptyMsg.classList.add("show");
      checkoutBtn.style.display = "none";
      return;
    }
    emptyMsg.classList.remove("show");
    checkoutBtn.style.display = "block";
    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";
      const img = item.image ? `<img src="${item.image}" alt="${item.name}">` : "";
      div.innerHTML = `
        <div class="cart-item-info">
          ${img}
          <div class="cart-item-details">
            <p title="${item.name}">${item.name}</p>
            <p>${formatPrice(item.price)} each</p>
          </div>
        </div>
        <div class="quantity-trash">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
            <div class="quantity-display">${item.quantity}</div>
            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
            <svg><use href="#trash-icon"></use></svg>
          </button>
        </div>
      `;
      itemsContainer.appendChild(div);
    });
  }

  window.updateQuantity = (id, newQty) => {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    if (newQty <= 0) { removeFromCart(id); return; }
    item.quantity = newQty;
    saveCart();
    renderCart();
  };
  window.removeFromCart = id => {
    cart = cart.filter(x => x.id !== id);
    saveCart();
    renderCart();
  };

  window.goToCheckout = async () => {
    if (!cart.length) return;
    const lineItems = cart.map(x => ({ price: x.stripe_price_id, quantity: x.quantity }));
    const { error } = await stripe.redirectToCheckout({
      lineItems,
      mode: "payment",
      successUrl: location.href.split('?')[0] + "?success=true",
      cancelUrl: location.href
    });
    if (error) alert("Stripe error: " + error.message);
  };

  function renderPayPalButton() {
    if (!window.paypal || document.getElementById("paypal-button-container").innerHTML) return;
    paypal.Buttons({
      style: { shape: "rect", color: "black", height: 56, label: "paypal" },  // Fixed: Ensures logo shows
      createOrder: (data, actions) => {
        const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const getDesc = (cat) => {
          switch (cat) {
            case "digital-art": return "Digital Art by CRUX RIAJUU";
            case "animation": return "Animation by CRUX RIAJUU";
            case "video-editing": return "Video Edit by CRUX RIAJUU";
            case "graphic-design": return "Design by CRUX RIAJUU";
            case "stream-assets": return "Stream Assets by CRUX RIAJUU";
            case "vtuber": return "V-Tuber Model by CRUX RIAJUU";
            case "web-design": return "Web Design by CRUX RIAJUU";
            default: return "Service by CRUX RIAJUU";
          }
        };
        return actions.order.create({
          purchase_units: [{
            amount: { value: (total / 100).toFixed(2) },
            items: cart.map(i => ({
              name: i.name.length > 120 ? i.name.slice(0, 117) + "..." : i.name,
              description: getDesc(i.category),
              unit_amount: { value: (i.price / 100).toFixed(2) },
              quantity: i.quantity
            }))
          }]
        });
      },
      onApprove: (data, actions) => actions.order.capture().then(() => {
        alert("Payment complete! Check your email.");
        cart = [];
        saveCart();
        renderCart();
        closeCartModal();
      })
    }).render("#paypal-button-container");
  }

  function showToast(message, type = "added") {
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => toast.remove(), 3200);
  }

  async function init() {
    stripe = Stripe(stripeKey);
    const response = await fetch(productsUrl + "?v=" + Date.now());
    products = await response.json();
    loadCart();
    renderCart();
  }
  init();

  modal.addEventListener("click", e => { if (e.target === modal) closeCartModal(); });
});
