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

  const authSection = currentUser
    ? ""
    : `<div class="auth-gate-card">
         <div class="agc-badge">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
           <span>Account Required</span>
         </div>
         <h4>Sign in or Register to Checkout</h4>
         <p>You must sign in or create an account to place these orders. Your projects and tracking will be linked to your account.</p>
         <div class="agc-actions">
           <button class="btn btn-p btn-s" id="cartSignIn" type="button">Sign in</button>
           <button class="btn btn-g btn-s" id="cartRegister" type="button">Create Account</button>
         </div>
       </div>`;

  $("#dBody").innerHTML = cart.length ? `
    <div class="cartlist">
      ${cart.map((it,i) => `
        <div class="citem">
          ${it.style ? tileHTML(styleById(it.style)) : `<div class="tile bg-motion" style="width:44px;aspect-ratio:9/13;border-radius:8px"><div class="cap" style="font-size:7px">PACK</div></div>`}
          <div>
            <div class="cn">${it.name}</div>
            <div class="cm">${it.meta}</div>
          </div>
          <div class="cp">${money(it.price)}</div>
          <button class="rm" data-i="${i}" aria-label="Remove">&times;</button>
        </div>
      `).join("")}
    </div>
    <div class="line total"><span>Total</span><span>${money(total)}</span></div>
    ${authSection}
    <div class="note">Pay once for everything here. Each item becomes its own order with its own delivery date.</div>`
    : `<div class="empty">Nothing here yet. Pick a style to start.</div>`;

  const checkoutBtnText = currentUser ? `Place Orders · ${money(total)}` : `Sign in to Checkout · ${money(total)}`;
  $("#dFoot").innerHTML = cart.length
    ? `<div class="tot">${money(total)}<small>${cur}</small></div><button class="btn btn-p" id="payCart">${currentUser ? '' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> '}${checkoutBtnText}</button>`
    : `<button class="btn btn-g" id="browse">Browse styles</button>`;

  $$(".rm").forEach(b => b.addEventListener("click", () => {
    cart.splice(+b.dataset.i, 1);
    saveUserCart();
    updateCart();
    openCart();
  }));

  $("#cartSignIn")?.addEventListener("click", () => {
    openAuthModal("login", () => openCart());
  });

  $("#cartRegister")?.addEventListener("click", () => {
    openAuthModal("register", () => openCart());
  });

  $("#cartSwitchUserBtn")?.addEventListener("click", () => {
    openAuthModal("login", () => openCart());
  });

  $("#browse")?.addEventListener("click", () => {
    closeDrawer();
    location.hash = "#edit";
  });

  $("#payCart")?.addEventListener("click", async () => {
    if (!currentUser) {
      toast("Please sign in or create an account to checkout");
      openAuthModal("login", () => {
        openCart();
      });
      return;
    }

    const email = currentUser.email;

    const btn = $("#payCart");
    btn.disabled = true;
    btn.textContent = "Placing orders on server...";

    const placedOrders = [];
    try {
      for (const item of cart) {
        if (item.type === "style" && (item.style || item.styleId)) {
          const s = styleById(item.styleId || item.style);
          if (s && (s.fam === "cut" || s.fam === "clip" || s.fam === "motion")) {
            if (!item.link || !item.link.trim() || !item.linkOk) {
              toast(`"${item.name}" requires a valid footage link before ordering`);
              btn.disabled = false;
              btn.textContent = `Place Orders · ${money(total)}`;
              return;
            }
          }
          const res = await HeyPitchAPI.createOrder({
            styleId: item.styleId || item.style,
            customerEmail: email,
            qty: item.qty || 1,
            len: item.len || "s60",
            purpose: item.purpose || "branding",
            revision: Boolean(item.revision),
            avatarMode: item.avatarMode,
            footageLink: item.link || "",
            footageDownloadOk: Boolean(item.linkOk),
            notes: item.notes || "",
            currency: cur || "USD"
          });
          placedOrders.push(res.data.order);
        } else {
          // Pack credit purchase order
          const res = await HeyPitchAPI.createOrder({
            styleId: "pulse", // baseline style for pack purchase
            customerEmail: email,
            qty: 1,
            mode: "pack",
            notes: `Credit pack order: ${item.name}`,
            currency: cur || "USD"
          });
          placedOrders.push(res.data.order);
        }
      }

      clearUserCart(currentUser);

      $("#dBody").innerHTML = `
        <div class="done">
          <div class="ring"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
          <h3>All Orders Placed on Server</h3>
          <p style="text-align:center">Successfully created ${placedOrders.length} order${placedOrders.length > 1 ? 's' : ''} in the HeyPitch queue for <b>${email}</b>.</p>
          <div style="display:grid;gap:8px;width:100%;margin-top:10px">
            ${placedOrders.map(o => `
              <div class="cart-placed-item">
                <div><b>${o.styleName || o.styleId}</b> <span class="chip-id">${o.orderId}</span></div>
                <button class="btn btn-g btn-s track-cart-item" data-id="${o.orderId}">Track</button>
              </div>
            `).join("")}
          </div>
        </div>
      `;

      $("#dFoot").innerHTML = `<button class="btn btn-p" id="closeDone">Done</button>`;
      $("#closeDone")?.addEventListener("click", closeDrawer);

      $$(".track-cart-item").forEach(b => {
        b.addEventListener("click", () => {
          closeDrawer();
          openOrderTracker(b.dataset.id);
        });
      });

      toast("All orders created successfully!");
    } catch (err) {
      toast(err.message || "Failed to create orders");
      btn.disabled = false;
      btn.textContent = `Place Orders · ${money(total)}`;
    }
  });

  openDrawer();
}

$("#openCart")?.addEventListener("click", openCart);

