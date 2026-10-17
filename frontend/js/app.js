/* =========================================================
   HEYPITCH STORE — Application Bootstrap & Orchestration
   Hero Studio, Link Verification, Social Proof & Init
   ========================================================= */

function setMode(m){
  heroMode = m;
  $$(".modes button").forEach(b => b.classList.toggle("on", b.dataset.mode === m));
  $("#dropFootage").style.display = m === "footage" ? "" : "none";
  $("#dropMade").style.display = m === "made" ? "" : "none";
  if(m === "made"){ renderMade(); }
  updateHint();
}

/* footage flow: style first, then link + length */
function selectStyle(id, fromGallery){
  const s = styleById(id);
  if(s.fam === "built"){ // a made style picked from gallery
    madeStyle = id; setMode("made"); renderMade();
    if(fromGallery){ document.getElementById("top2").scrollIntoView({behavior:"smooth"}); toast(s.name + " selected below"); }
    return;
  }
  heroPick = id; setMode("footage");
  $("#footNoStyle").style.display = "none";
  $("#footHasStyle").style.display = "";
  renderChosen(); renderLenRow(); renderGallery(); updateHint();
  if(fromGallery){
    document.getElementById("top2").scrollIntoView({behavior:"smooth"});
    const mk = $(".maker"); mk.animate([{boxShadow:"0 0 0 2px var(--violet)"},{boxShadow:"0 40px 90px -50px var(--glow)"}],{duration:900});
    toast(s.name + " selected. Add your link and length.");
  }
}

function renderChosen(){
  const s = styleById(heroPick);
  $("#footChosen").innerHTML = `${tileHTML(s)}<div><div class="cn">${s.name}</div><div class="cm">${s.mood}</div></div><button class="chg" id="footChg">change</button>`;
  $("#footChg").addEventListener("click", () => { $("#edit").scrollIntoView({behavior:"smooth"}); });
}

function renderLenRow(){
  const s = styleById(heroPick);
  $("#lenRow").innerHTML = HP_CONFIG.durationTiers.map(t =>
    `<button class="lentab ${t.id===heroLen?'on':''}" data-len="${t.id}"><b>${t.label}</b><small>${t.note}</small><span class="lp">${money(styleUnit(s,t.id))} each</span></button>`).join("");
  $$(".lentab").forEach(b => b.addEventListener("click", () => { heroLen = b.dataset.len; renderLenRow(); updateHint(); }));
}

/* made flow: three types with sample backgrounds + per-type params */
function renderMade(){
  $("#madeGrid").innerHTML = MADE_TYPES.map(t => {
    const s = styleById(t.style);
    return `<button class="madecard ${madeStyle===t.style?'on':''}" data-made="${t.style}">
      <div class="bgfx">${tileHTML(s,"")}</div>
      <span class="sampletag">${t.sample}</span>
      <div class="mt">${t.title}</div><div class="md">${t.desc}</div>
      <div class="mp">${s.call ? "from " + money(s.price) : money(s.price) + (s.kind==="genai"?" per shot":"")}</div>
    </button>`;
  }).join("");
  $$("#madeGrid .bgfx .tile").forEach(el => { el.style.width="100%"; el.style.aspectRatio="auto"; el.style.height="100%"; });
  $$(".madecard").forEach(c => c.addEventListener("click", () => { madeStyle = c.dataset.made; renderMade(); updateHint(); }));
  renderMadeParams();
}

function renderMadeParams(){
  const s = styleById(madeStyle); let html = "";
  if(s.kind === "avatar"){
    html = `<div><div class="plabel">What kind of avatar?</div>
      <div class="avmodes">${HP_CONFIG.avatarModes.map(a=>`<button class="${a.id===avatarMode?'on':''}" data-av="${a.id}"><b>${a.label}</b><small>${a.note}</small></button>`).join("")}</div></div>
      <div class="callnote"><span class="dot2"></span><span>${avatarMode==="have" ? "You already have an avatar, so no build fee. We just edit it to your script." : "First order includes a one time build: consent, a short recording to spec, and a two minute verification call. After that every video is just a script."}</span></div>`;
  } else if(s.kind === "explainer"){
    html = `<div class="callnote"><span class="dot2"></span><span>Explainers start from an idea or a framework. Share it and book a short call so we can scope the script and lock the price, then we produce.</span></div>`;
  } else if(s.kind === "genai"){
    html = `<div class="callnote"><span class="dot2"></span><span>Generated films are priced per shot and depend on the concept. Tell us the idea and book a call, or start with a small shot count now.</span></div>`;
  }
  $("#madeParams").innerHTML = html;
  $$("#madeParams [data-av]").forEach(b => b.addEventListener("click", () => { avatarMode = b.dataset.av; renderMadeParams(); }));
}

function updateHint(){
  const h = $("#hintLine"), btn = $("#createBtn"), bar = $("#makerBar");
  if(heroMode === "footage"){
    if(!heroPick){ bar.style.display = "none"; return; }   // free/browse cards carry the action
    bar.style.display = "";
    const s = styleById(heroPick);
    h.textContent = heroLink && heroLinkOk ? "Link checked. Ready to continue." : `${s.name}, ${HP_CONFIG.durationTiers.find(t=>t.id===heroLen).label.toLowerCase()}. Add your footage link.`;
    h.classList.toggle("ready", !!(heroLink && heroLinkOk));
    btn.textContent = "Continue";
  } else {
    bar.style.display = "";
    const s = styleById(madeStyle);
    h.textContent = s.call ? `${s.name} starts with a short call, no payment yet.` : `${s.name} selected.`;
    h.classList.remove("ready");
    btn.textContent = s.call ? "Book a call" : "Continue";
  }
}

// cycling headline
(() => {
  const el = $("#cycle"), words = HP_CONFIG.cycleWords; let i = 0;
  el.style.transition = "opacity .22s";
  setInterval(() => { i = (i+1) % words.length; el.style.opacity = 0; setTimeout(() => { el.textContent = words[i]; el.style.opacity = 1; }, 220); }, 2400);
})();

$$(".modes button").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
$("#footPick")?.addEventListener("click", () => $("#edit").scrollIntoView({behavior:"smooth"}));
$("#freeCard")?.addEventListener("click", () => {
  const id = (heroMode === "footage" && heroPick) ? heroPick : "pulse";
  openOrder(id);
  drawerState.trial = true;
  if(heroMode === "footage" && heroLink){ drawerState.link = heroLink; drawerState.linkOk = heroLinkOk; drawerState.mins = heroMins; }
  renderDrawer();
});

// hero link verify
(() => {
  const v = () => $("#heroVerify"), info = () => $("#heroInfo"); let t;
  document.addEventListener("input", e => {
    if(e.target.id !== "heroLink") return;
    heroLink = e.target.value.trim(); clearTimeout(t);
    if(!heroLink){ v().className="verify"; v().style.justifyContent="center"; v().innerHTML=`<span class="dot"></span><span>We check the link the moment you paste it</span>`; info().classList.remove("on"); heroLinkOk=false; updateHint(); return; }
    t = setTimeout(() => verifyLink(heroLink, v(), info(), (ok,mins)=>{
      heroLinkOk=ok; heroMins=mins||null; updateHint();
      if(ok && mins && mins > HP_CONFIG.sourceCapMins){
        v().className="verify wait"; v().innerHTML=`<span class="dot"></span><span>That is ${mins} min of source. This order covers up to ${HP_CONFIG.sourceCapMins} min, we will use the best section. For more, add another order.</span>`;
      }
    }), 350);
  });
})();

// create / continue
$("#createBtn")?.addEventListener("click", () => {
  if(heroMode === "footage"){
    if(!heroPick){ toast("Choose a style first"); $("#edit").scrollIntoView({behavior:"smooth"}); return; }
    openOrder(heroPick);
    drawerState.len = heroLen;
    if(heroLink){ drawerState.link = heroLink; drawerState.linkOk = heroLinkOk; drawerState.mins = heroMins; }
    renderDrawer();
  } else {
    openOrder(madeStyle);
    if(styleById(madeStyle).kind === "avatar") drawerState.avatarMode = avatarMode;
    renderDrawer();
  }
});

/* ---------- social proof popups ---------- */
(() => {
  const pop = $("#proof"); if(!pop) return;
  let i = 0, dismissed = false, tHide;
  const times = ["just now","2 min ago","5 min ago","8 min ago","12 min ago"];
  function show(){
    if(dismissed) return;
    const p = HP_CONFIG.proof[i % HP_CONFIG.proof.length]; i++;
    $("#proofA").textContent = p.who[0];
    $("#proofT").innerHTML = `<b>${p.who}</b> from <b>${p.co}</b> ordered ${p.what}`;
    $("#proofM").textContent = `${p.where} · ${times[Math.floor(Math.random()*times.length)]}`;
    pop.classList.add("on");
    clearTimeout(tHide); tHide = setTimeout(() => pop.classList.remove("on"), 5000);
  }
  $("#proofX")?.addEventListener("click", () => { dismissed = true; pop.classList.remove("on"); });
  setTimeout(show, 4000);
  setInterval(show, 14000);
})();

/* ---------- init ---------- */
renderCurrency();
renderTabs();
renderGallery();
renderPacks();
renderFAQ();
updateHint();

