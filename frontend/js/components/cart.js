/* =========================================================
   HEYPITCH STORE - Cart Component
   ========================================================= */

function updateCart(){
  const c = $("#cartCount");
  if(c){
    c.textContent = cart.length;
    c.classList.toggle("on", cart.length > 0);
  }
}

function openCart(){
  drawerState = null;
  $("#dTitle").textContent = "Cart";
  const total = cart.reduce((a,b) => a + b.price, 0);
  $("#dBody").innerHTML = cart.length ? `<div class="cartlist">${cart.map((it,i) => `<div class="citem">${it.style ? tileHTML(styleById(it.style)) : `<div class="tile bg-motion" style="width:44px;aspect-ratio:9/13;border-radius:8px"><div class="cap" style="font-size:7px">PACK</div></div>`}<div><div class="cn">${it.name}</div><div class="cm">${it.meta}</div></div><div class="cp">${money(it.price)}</div><button class="rm" data-i="${i}" aria-label="Remove">&times;</button></div>`).join("")}</div>
    <div class="line total"><span>Total</span><span>${money(total)}</span></div>
    <div class="field"><label for="cEmail">Email for your dashboard link</label><input id="cEmail" type="email" placeholder="you@company.com"></div>
    <div class="note">Pay once for everything here. Each item becomes its own order with its own delivery date.</div>`
    : `<div class="empty">Nothing here yet. Pick a style to start.</div>`;
  $("#dFoot").innerHTML = cart.length ? `<div class="tot">${money(total)}<small>${cur}</small></div><button class="btn btn-p" id="payCart">Pay ${money(total)}</button>` : `<button class="btn btn-g" id="browse">Browse styles</button>`;
  $$(".rm").forEach(b => b.addEventListener("click", () => { cart.splice(+b.dataset.i, 1); updateCart(); openCart(); }));
  $("#browse")?.addEventListener("click", () => { closeDrawer(); location.hash = "#edit"; });
  $("#payCart")?.addEventListener("click", () => { cart = []; updateCart(); $("#dBody").innerHTML = `<div class="done"><div class="ring"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div><h3>All orders placed</h3><p style="text-align:center">Your sign in link is on its way. Each order shows in your dashboard with its own date.</p></div>`; $("#dFoot").innerHTML = `<button class="btn btn-p" id="closeDone">Done</button>`; $("#closeDone").addEventListener("click", closeDrawer); });
  openDrawer();
}

$("#openCart")?.addEventListener("click", openCart);

