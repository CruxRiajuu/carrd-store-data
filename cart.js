window.addEventListener('load',()=>{const e="pk_live_51OHfwcIaRpVk2G5N78UiDGdQLFzmUh1dv6bbA0D4N4I5bK2n7mPruCL8YpY10RuhIImCOJka8aikchX9RAi017k100KJUWJMK7",t="https://raw.githubusercontent.com/CruxRiajuu/carrd-store-data/refs/heads/main/digital_products.json";let l,cart=[],products=[];const a=document.getElementById("cart-modal"),i=document.getElementById("cart-items"),r=document.getElementById("cart-total"),d=document.getElementById("empty-cart-message"),c=document.getElementById("cart-content"),checkoutTrigger=document.getElementById("checkout-trigger"),checkoutOptions=document.getElementById("checkout-options"),backBtn=document.getElementById("back-to-cart-btn"),toastContainer=document.getElementById("toast-container");

window.openCartModal=()=>{renderCart();a.classList.add("open");document.body.style.overflow="hidden"}
window.closeCartModal=()=>{a.classList.remove("open");c.removeAttribute("id");checkoutOptions.style.display="none";checkoutTrigger.style.display=cart.length?"block":"none";setTimeout(()=>{document.body.style.overflow=""},500)}
window.showClearConfirm=()=>{document.getElementById("clear-confirm-overlay").classList.add("show")}
window.confirmClearCart=()=>{document.getElementById("clear-confirm-overlay").classList.remove("show");cart=[];saveCart();renderCart();showToast("Cart cleared!","cleared")}

window.enterCheckoutMode=()=>{c.id="checkout-mode";checkoutTrigger.style.display="none";renderPayPalButton()}
window.backToCart=()=>{c.removeAttribute("id");checkoutTrigger.style.display=cart.length?"block":"none"}

window.addToCart=(id,qty=1)=>{if(!products.length)return alert("Loading...");const p=products.find(x=>x.id===id);if(!p)return;const ex=cart.find(x=>x.id===id);ex?ex.quantity+=qty:cart.push({...p,quantity:qty});saveCart();renderCart();showToast(`${p.name}<br>Added to cart`,"added")}

function saveCart(){localStorage.setItem("carrd-cart-adv-nc",JSON.stringify(cart))}
function loadCart(){cart=JSON.parse(localStorage.getItem("carrd-cart-adv-nc")||"[]")}
function formatPrice(c){return(c/100).toLocaleString("en-US",{style:"currency",currency:"USD"})}
function updateTotal(){r.textContent=formatPrice(cart.reduce((s,i)=>s+i.price*i.quantity,0))}

function renderCart(){
  i.innerHTML="";updateTotal();
  if(cart.length===0){d.classList.add("show");checkoutTrigger.style.display="none";return}
  d.classList.remove("show");checkoutTrigger.style.display="block";
  cart.forEach(item=>{const div=document.createElement("div");div.className="cart-item";
    const img=item.image?`<img src="${item.image}" alt="${item.name}">`:"";
    div.innerHTML=`<div class="cart-item-info">${img}<div class="cart-item-details"><p title="${item.name}">${item.name}</p><p>${formatPrice(item.price)} each</p></div></div>
      <div class="quantity-trash">
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${item.id},${item.quantity-1})">-</button>
          <div class="quantity-display">${item.quantity}</div>
          <button class="quantity-btn" onclick="updateQuantity(${item.id},${item.quantity+1})">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><svg><use href="#trash-icon"/></svg></button>
      </div>`;
    i.appendChild(div)})
}

window.updateQuantity=(id,q)=>{const item=cart.find(x=>x.id===id);if(!item)return;if(q<=0){removeFromCart(id);return}item.quantity=q;saveCart();renderCart()}
window.removeFromCart=id=>{cart=cart.filter(x=>x.id!==id);saveCart();renderCart()}

window.goToCheckout=async()=>{if(!cart.length)return;const items=cart.map(x=>({price:x.stripe_price_id,quantity:x.quantity}));const {error}=await l.redirectToCheckout({lineItems:items,mode:"payment",successUrl:location.href.split('?')[0]+"?success=true",cancelUrl:location.href});if(error)alert("Stripe error: "+error.message)}

function renderPayPalButton(){
  if(!window.paypal || document.getElementById("paypal-button-container").innerHTML) return;
  paypal.Buttons({style:{shape:"rect",color:"black",height:56,label:"paypal"},
    createOrder:(d,a)=>{const total=cart.reduce((s,i)=>s+i.price*i.quantity,0);
      const desc=c=>{switch(c){case"digital-art":return"Digital Art by CRUX RIAJUU";case"animation":return"Animation by CRUX RIAJUU";case"video-editing":return"Video Edit by CRUX RIAJUU";case"graphic-design":return"Design by CRUX RIAJUU";case"stream-assets":return"Stream Assets by CRUX RIAJUU";case"vtuber":return"V-Tuber Model by CRUX RIAJUU";case"web-design":return"Web Design by CRUX RIAJUU";default:return"Service by CRUX RIAJUU"}}
      return a.order.create({purchase_units:[{amount:{value:(total/100).toFixed(2)},items:cart.map(i=>({name:i.name.length>120?i.name.slice(0,117)+"...":i.name,description:desc(i.category),unit_amount:{value:(i.price/100).toFixed(2)},quantity:i.quantity}))}]})
    },
    onApprove:(d,a)=>a.order.capture().then(()=>{alert("Payment complete! Check your email.");cart=[];saveCart();renderCart();closeCartModal()})
  }).render("#paypal-button-container")
}

function showToast(m,t="added"){const o=document.createElement("div");o.className=`toast-notification toast-${t}`;o.innerHTML=m;toastContainer.appendChild(o);setTimeout(()=>o.classList.add("show"),10);setTimeout(()=>o.remove(),3200)}

async function init(){l=Stripe(e);const res=await fetch(t+"?v="+Date.now());products=await res.json();loadCart();renderCart()}
init();

a.addEventListener("click",e=>{if(e.target===a)closeCartModal()});
});
