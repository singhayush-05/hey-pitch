/* =========================================================
   HEYPITCH STORE - FAQ Component
   ========================================================= */

function renderFAQ(){
  const faqEl = $("#faq");
  if(!faqEl) return;
  faqEl.innerHTML = HP_CONFIG.faq.map(([q,a],i) => `<div class="q" id="q${i}"><button aria-expanded="false">${q}<i>+</i></button><div class="a">${a}</div></div>`).join("");
  $$(".q button").forEach(b => b.addEventListener("click", () => {
    const q = b.parentElement; const open = q.hasAttribute("open");
    $$(".q").forEach(x => x.removeAttribute("open"));
    if(!open) q.setAttribute("open",""); b.setAttribute("aria-expanded", String(!open));
  }));
}
