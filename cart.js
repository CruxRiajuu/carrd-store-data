const STRIPE_KEY="pk_live_51OHfwcIaRpVk2G5N78UiDGdQLFzmUh1dv6bbA0D4N4I5bK2n7mPruCL8YpY10RuhIImCOJka8aikchX9RAi017k100KJUWJMK7";
const PRODUCTS_URL="https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/main/digital_products.json";
let stripeInst, cart=[], products=[];

// Element selectors
const modal=document.getElementById("cart-modal");
const itemsContainer=document.getElementById("cart-items");
const totalEl=document.getElementById("cart-total");
const emptyMsg=document.getElementById("empty-cart-message");
const contentDiv=document.getElementById("cart-content");
const checkoutBtn=document.getElementById("checkout-trigger");
const checkoutOpts=document.getElementById("checkout-options");
const toastBox=document.getElementById("toast-container");

window.openCartModal=()=>{renderCart();modal.classList.add("open");document.body.style.overflow="hidden"}
window.closeCartModal=()=>{modal.classList.remove("open");contentDiv.removeAttribute("id");checkoutOpts.style.display="none";checkoutBtn.style.display=cart.length?"block":"none";setTimeout(()=>{document.body.style.overflow=""},500)}
window.showClearConfirm=()=>{document.getElementById("clear-confirm-overlay").classList.add("show")}
window.confirmClearCart=()=>{document.getElementById("clear-confirm-overlay").classList.remove("show");cart=[];saveCart();renderCart();showToast("Cart cleared!","cleared")}

window.enterCheckoutMode=()=>{contentDiv.id="checkout-mode";checkoutBtn.style.display="none";renderPayPalButton()}
window.backToCart=()=>{contentDiv.removeAttribute("id");checkoutBtn.style.display=cart.length?"block":"none"}

window.addToCart=(id,qty=1)=>{
  if(!products.length) return alert("Loading...");
  const p=products.find(x=>x.id===id);
  if(!p) return;
  const ex=cart.find(x=>x.id===id);
  ex?ex.quantity+=qty:cart.push({...p,quantity:qty});
  saveCart(); renderCart(); showToast(`${p.name}<br>Added to cart`,"added")
}

function saveCart(){localStorage.setItem("carrd-cart-adv-nc",JSON.stringify(cart))}
function loadCart(){cart=JSON.parse(localStorage.getItem("carrd-cart-adv-nc")||"[]")}
function formatPrice(c){return(c/100).toLocaleString("en-US",{style:"currency",currency:"USD"})}
function updateTotal(){totalEl.textContent=formatPrice(cart.reduce((s,i)=>s+i.price*i.quantity,0))}

function renderCart(){
  itemsContainer.innerHTML=""; updateTotal();
  if(cart.length===0){emptyMsg.classList.add("show");checkoutBtn.style.display="none";return; }
  emptyMsg.classList.remove("show");checkoutBtn.style.display="block";
  cart.forEach(item=>{
    const div=document.createElement("div");div.className="cart-item";
    const img=item.image?`<img src="${item.image}" alt="${item.name}">`:"";
    div.innerHTML=`
      <div class="cart-item-info">${img}<div class="cart-item-details"><p title="${item.name}">${item.name}</p><p>${formatPrice(item.price)} each</p></div></div>
      <div class="quantity-trash">
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${item.id},${item.quantity-1})">-</button>
          <div class="quantity-display">${item.quantity}</div>
          <button class="quantity-btn" onclick="updateQuantity(${item.id},${item.quantity+1})">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><svg><use href="#trash-icon"/></svg></button>
      </div>`;
    itemsContainer.appendChild(div)})
}

window.updateQuantity=(id,q)=>{const item=cart.find(x=>x.id===id);if(!item)return;if(q<=0){removeFromCart(id);return}item.quantity=q;saveCart();renderCart()}
window.removeFromCart=id=>{cart=cart.filter(x=>x.id!==id);saveCart();renderCart()}

window.goToCheckout=async()=>{
  if(!cart.length)return;
  const items=cart.map(x=>({price:x.stripe_price_id,quantity:x.quantity}));
  const {error}=await stripeInst.redirectToCheckout({lineItems:items,mode:"payment",successUrl:location.href.split('?')[0]+"?success=true",cancelUrl:location.href});
  if(error)alert("Stripe error: "+error.message)
}

function renderPayPalButton(){
  const container = document.getElementById("paypal-button-container");
  if(!window.paypal || container.innerHTML.trim() !== "") return;
  
  try {
    paypal.Buttons({
      // 1. Force Only PayPal (No Cards)
      fundingSource: paypal.FUNDING.PAYPAL,
      
      // 2. Black/Monochrome Style
      style:{layout:"vertical", color:"black", shape:"rect", label:"pay", height:40},
      
      createOrder:(data,actions)=>{
        const totalCents = cart.reduce((s,i)=>s+i.price*i.quantity,0);
        const totalStr = (totalCents/100).toFixed(2);
        
        // 3. Dynamic Item Mapping from JSON
        const paypalItems = cart.map(item => {
            // Format Category: "digital-art" -> "DIGITAL ART"
            let catLabel = item.category ? item.category.replace(/-/g, ' ').toUpperCase() : "DIGITAL ITEM";
            
            return {
                // --- FIX: Merge Category into Name for Guest Checkout Visibility ---
                name: `${item.name} - [${catLabel}]`,
                
                unit_amount: {
                    currency_code: "USD",
                    value: (item.price / 100).toFixed(2) // Convert cents to dollars
                },
                quantity: String(item.quantity),
                category: "DIGITAL_GOODS"
            };
        });

        return actions.order.create({
            purchase_units:[{
                amount: {
                    currency_code: "USD",
                    value: totalStr,
                    breakdown: {
                        item_total: { currency_code: "USD", value: totalStr }
                    }
                },
                items: paypalItems 
            }]
        })
      },
      onApprove:(data,actions)=>actions.order.capture().then(()=>{alert("Payment complete!");cart=[];saveCart();renderCart();closeCartModal()}),
      onError: (err) => { console.error("PayPal Error:", err); alert("PayPal error. See console."); }
    }).render("#paypal-button-container")
  } catch(e) { console.log("PayPal render failed", e); }
}

function showToast(m,t="added"){
  const o=document.createElement("div");o.className=`toast-notification toast-${t}`;o.innerHTML=m;
  toastBox.appendChild(o);
  setTimeout(()=>o.classList.add("show"),10);
  setTimeout(()=>o.remove(),3200)
}

async function init(){
  stripeInst=Stripe(STRIPE_KEY);
  const res=await fetch(PRODUCTS_URL+"?v="+Date.now());
  products=await res.json();
  loadCart();renderCart()
}

modal.addEventListener("click",e=>{if(e.target===modal)closeCartModal()});
init();
