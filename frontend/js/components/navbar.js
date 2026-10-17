/* =========================================================
   HEYPITCH STORE — Navbar & Currency Selector
   ========================================================= */

function initNavbar(){
  // Smooth scroll to top on brand click (header and footer)
  $$(".brand").forEach(b => {
    b.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Local Currency Badge (Auto-detected by IP)
  const badge = $("#curBadge");
  if(badge){
    badge.style.cursor = "default";
    badge.title = "Local currency auto-detected from your IP";
  }

  // Smooth navigation for Edit styles and Made for you
  const editLink = document.querySelector('.navlinks a[href="#edit"]');
  if(editLink){
    editLink.addEventListener("click", (e) => {
      e.preventDefault();
      if(typeof setMode === "function") setMode("footage");
      if(typeof activeTab !== "undefined" && activeTab === "nofootage"){
        activeTab = "popular";
        if(typeof renderTabs === "function") renderTabs();
        if(typeof renderGallery === "function") renderGallery();
      }
      document.getElementById("edit")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const madeLink = document.querySelector('.navlinks a[href="#made"]');
  if(madeLink){
    madeLink.addEventListener("click", (e) => {
      e.preventDefault();
      if(typeof setMode === "function") setMode("made");
      document.getElementById("top2")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function openCurrencyModal(){
  const modal = $("#currencyModal");
  if(!modal) return;

  const currentCur = cur || 'USD';
  modal.innerHTML = `
    <div class="mscrim" id="curScrim"></div>
    <div class="mdialog curdialog">
      <div class="mhead">
        <div class="mt">Select Regional Currency</div>
        <button class="mclose" id="curClose">&times;</button>
      </div>
      <div class="mbody">
        <div class="cur-grid">
          ${Object.entries(HP_CONFIG.currencies).map(([code, def]) => `
            <button class="cur-card ${currentCur === code ? 'on' : ''}" data-code="${code}">
              <div style="font-weight:700;font-size:18px">${def.symbol} ${code}</div>
              <small style="color:var(--muted)">Rate: ${def.rate}x · Round: ${def.round}</small>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  $("#curScrim")?.addEventListener("click", () => modal.style.display = "none");
  $("#curClose")?.addEventListener("click", () => modal.style.display = "none");

  $$(".cur-card").forEach(b => {
    b.addEventListener("click", () => {
      const selected = b.dataset.code;
      if (!selected || !HP_CONFIG.currencies || !HP_CONFIG.currencies[selected]) return;
      cur = selected;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem('hp_currency', selected);
      }
      modal.style.display = "none";
      renderCurrency();
      if (typeof renderGallery === "function") renderGallery();
      if (typeof renderPacks === "function") renderPacks();
      if (heroMode === "footage" && typeof heroPick !== "undefined" && heroPick && typeof renderLenRow === "function") {
        renderLenRow();
      }
      if (heroMode === "made" && typeof renderMade === "function") {
        renderMade();
      }
      if (typeof updateHint === "function") updateHint();
      if (typeof drawerState !== "undefined" && drawerState && typeof renderDrawer === "function") {
        renderDrawer();
      }
      if (typeof updateCart === "function") updateCart();
      if (typeof toast === "function") toast(`Currency switched to ${selected}`);
    });
  });
}
