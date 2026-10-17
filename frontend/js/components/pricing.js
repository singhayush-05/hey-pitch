/* =========================================================
   HEYPITCH STORE - Pricing & Packs
   ========================================================= */

function renderPacks(){
  const packsEl = $("#packsGrid") || $(".packs");
  if(!packsEl) return;
  packsEl.innerHTML = HP_CONFIG.packs.map(p => `
    <div class="pack ${p.best?'best':''}">
      ${p.best ? `<span class="ribbon">Most chosen</span>`:""}
      <h3>${p.name}</h3><div class="for">${p.for}</div>
      <div class="amt">${p.price ? money(p.price) : "From " + money(129)}<small>${p.price ? "per month" : ""}</small></div>
      <div class="per">${p.per}</div>
      <ul>${p.items.map(i=>`<li>${i}</li>`).join("")}</ul>
      <button class="btn ${p.best?'btn-p':'btn-g'}" data-pack="${p.name}">${p.price ? "Start " + p.name : "Browse styles"}</button>
      ${p.slots ? `<div class="slots">${p.slots}</div>`:""}
    </div>`).join("");
  $$("[data-pack]").forEach(b => b.addEventListener("click", e => {
    const p = HP_CONFIG.packs.find(x => x.name === e.currentTarget.dataset.pack);
    if(!p.price){ location.hash = "#edit"; return; }
    cart.push({ type:"pack", name:p.name + " pack", meta:p.credits + " credits, monthly", price:p.price, style:null });
    updateCart(); toast(p.name + " pack added to cart");
  }));
}
