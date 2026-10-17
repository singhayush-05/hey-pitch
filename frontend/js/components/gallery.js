/* =========================================================
   HEYPITCH STORE - Tabbed Gallery Component
   ========================================================= */

function stylesForTab(id){
  if(id === "foryou") return HP_CONFIG.foryou.map(styleById);
  if(id === "popular") return HP_CONFIG.styles.filter(s => (s.cat||[]).includes("popular"));
  return HP_CONFIG.styles.filter(s => (s.cat||[]).includes(id));
}

function gcardHTML(s){
  const priceLabel = s.kind==="genai" ? "per shot" : "per video";
  const priceStr = s.shortform ? "from " + money(s.price) : (s.call ? "from " + money(s.price) : money(s.price));
  const ribbon = s.badge==="new" ? `<div class="ribbon-c new">NEW</div>` : s.badge==="trend" ? `<div class="ribbon-c trend">TRENDING</div>` : "";
  const crown = s.pro ? `<div class="crown" title="Premium"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l4 4 5-7 5 7 4-4v11H3z"/></svg></div>` : "";
  const isPicked = typeof heroPick !== "undefined" && heroPick === s.id;
  return `<button class="gcard ${isPicked ? 'picked' : ''}" data-style="${s.id}" aria-label="Choose ${s.name}">
    <div style="position:relative">${ribbon}${crown}${tileHTML(s)}<div class="sel"></div></div>
    <div class="gm"><div><div class="gn">${s.name}</div><div class="gmood">${s.mood}</div></div><div class="gp">${priceStr}<small> ${s.shortform?"":priceLabel}</small></div></div>
  </button>`;
}

function renderTabs(){
  $("#tabs").innerHTML = HP_CONFIG.categories.map(c =>
    `<button class="tab ${c.id===activeTab?'on':''}" data-tab="${c.id}">${c.name}${c.ai?'<span class="ai">AI</span>':''}</button>`).join("");
  $$(".tab").forEach(t => t.addEventListener("click", () => { activeTab = t.dataset.tab; renderTabs(); renderGallery(); }));
}

function renderGallery(){
  const cat = HP_CONFIG.categories.find(c => c.id === activeTab);
  $("#gtitle").innerHTML = `<h3>${cat.name}</h3><p>${cat.desc}</p>`;
  const all = stylesForTab(activeTab);
  const shown = all.slice(0, galleryLimit);
  $("#gallery").innerHTML = shown.map(gcardHTML).join("");
  $("#showMore").style.display = all.length > galleryLimit ? "block" : "none";
  $$(".gcard").forEach(c => c.addEventListener("click", () => {
    const styleId = c.dataset.style;
    if (typeof selectStyle === "function") selectStyle(styleId, false);
    if (typeof openOrder === "function") openOrder(styleId);
  }));
  if (typeof initVideoAutoplay === "function") initVideoAutoplay();
}

$("#showMore")?.addEventListener("click", () => { galleryLimit += 8; renderGallery(); });

