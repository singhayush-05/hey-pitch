/* =========================================================
   HEYPITCH STORE - Order Drawer Component
   ========================================================= */

function openDrawer(){
  $("#drawer").classList.add("on");
  $("#scrim").classList.add("on");
  $("#drawer").setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

function closeDrawer(){
  $("#drawer").classList.remove("on");
  $("#scrim").classList.remove("on");
  $("#drawer").setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

$("#dClose")?.addEventListener("click", closeDrawer);
$("#scrim")?.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if(e.key === "Escape") closeDrawer(); });

function openOrder(styleId){
  const s = styleById(styleId);
  drawerState = { styleId, qty: s.kind==="explainer" ? 1 : 1, step:1, revision:false, linkOk:false, mins:null, consent:false, consentTime:false, link:"", script:"", oneThing:"", len:"s60", avatarMode:"talking", purpose:"branding", sameStyle:true, brand:"", handles:"", notes:"", trial:false, mode:"order" };
  renderDrawer();
  openDrawer();
}

function orderTotal(){
  const st = drawerState, s = styleById(st.styleId);
  let t = unitPrice(s, st.qty, st.len) * st.qty;
  if(st.revision) t += Math.round((s.shortform ? styleUnit(s, st.len) : s.price) * HP_CONFIG.revisionAddon) * st.qty;
  const noBuild = s.kind === "avatar" && st.avatarMode === "have";
  if(s.build && !noBuild) t += s.build;
  return t;
}

function renderDrawer(){
  const st = drawerState, s = styleById(st.styleId), f = famById(s.fam);
  $("#dTitle").textContent = st.step === 4 ? "Order placed" : `Order ${s.name}`;
  const prog = `<div class="progress">${[1,2,3].map(i => `<i class="${st.step>=i?'on':''}"></i>`).join("")}</div>`;
  const pick = `<div class="pick">${tileHTML(s)}<div><div class="n">${s.name}</div><div class="m">${s.mood}<br>${f.cap}</div></div></div>`;
  let body = "", foot = "";

  if(st.step === 1){
    const qtys = s.kind === "explainer" ? [1,2] : HP_CONFIG.quantities;
    const noBuild = s.kind === "avatar" && st.avatarMode === "have";
    const lenSel = s.shortform ? `
      <div class="field"><label>Length</label>
        <div class="qty">${HP_CONFIG.durationTiers.map(t=>`<button class="${st.len===t.id?'on':''}" data-len="${t.id}" style="grid-column:span 2"><b>${t.label}</b><small>${money(styleUnit(s,t.id))} each</small></button>`).join("")}</div>
      </div>` : "";
    const purposeSel = `
      <div class="field"><label>What is this video for?</label>
        <div class="chips">${HP_CONFIG.purposes.map(p=>`<button class="chipbtn ${st.purpose===p.id?'on':''}" data-purpose="${p.id}">${p.label}</button>`).join("")}</div>
      </div>`;
    const multi = st.qty >= 2 && f.intake === "footage" ? `
      <div class="field"><label>Same style for all ${st.qty}?</label>
        <div class="qty">
          <button class="${st.sameStyle?'on':''}" data-same="1" style="grid-column:span 2"><b>Same style</b><small>${s.name} for all</small></button>
          <button class="${!st.sameStyle?'on':''}" data-same="0" style="grid-column:span 2"><b>Mix styles</b><small>Priced per style you pick</small></button>
        </div>
      </div>` : "";
    const over = st.qty > HP_CONFIG.delivery.callThreshold;
    const delTier = HP_CONFIG.delivery.tiers.find(t => st.qty <= t.max) || HP_CONFIG.delivery.tiers[HP_CONFIG.delivery.tiers.length-1];
    const delNote = over
      ? `<div class="callnote"><span class="dot2"></span><span>For ${st.qty} videos the team books a quick call to lock exact dates. ${HP_CONFIG.delivery.callPromise}</span></div>`
      : `<div class="note">Delivery ${delTier.text} for this order. Small orders ship in ${HP_CONFIG.delivery.base}, larger ones take a little longer.</div>`;
    body = prog + pick + lenSel + `
      <div class="field"><label>How many</label>
        <div class="qty">${qtys.map(q => `<button class="${st.qty===q?'on':''}" data-q="${q}"><b>${q}</b><small>${money(unitPrice(s,q,st.len))} each</small></button>`).join("")}</div>
      </div>
      ${multi}${purposeSel}
      ${(s.build && !noBuild) ? `<div class="opt"><div>One time avatar build<small>Consent, a short recording to spec, and a two minute verification call. Paid once, not per video.</small></div><div style="font-weight:600">${money(s.build)}</div></div>` : ""}
      <label class="opt"><div>Add a second revision round<small>One round is already included. This adds a second, per video.</small></div><input type="checkbox" id="rev" ${st.revision?"checked":""}></label>
      ${delNote}`;
    foot = `<div class="tot">${money(orderTotal())}<small>${cur}, taxes shown at payment</small></div><button class="btn btn-p" id="next">Continue</button>`;
  }
  if(st.step === 2){
    if(f.intake === "footage"){
      const trialBadge = st.trial ? `<div class="callnote" style="margin-bottom:4px"><span class="dot2"></span><span>Free trial. You get one ${HP_CONFIG.trial.seconds} second edit with a small HeyPitch watermark. Remove it any time for ${money(HP_CONFIG.trial.removeLogo)}.</span></div>` : "";
      body = prog + pick + trialBadge + `
        <div class="field"><label for="oLink">Footage link</label><input id="oLink" type="url" placeholder="Paste your Drive or Dropbox link" value="${st.link}"></div>
        <div class="verify" id="oVerify"><span class="dot"></span><span>Paste a link and we confirm the team can download it</span></div>
        <div class="fileinfo" id="oInfo"></div>
        <div class="field"><label for="oBrand">Brand kit or guidelines (optional)</label><input id="oBrand" type="url" placeholder="Link to logo, fonts, colours" value="${st.brand||''}"></div>
        <div class="field"><label for="oHandles">Where it will post, and handles (optional)</label><input id="oHandles" placeholder="TikTok, Reels, YouTube Shorts, @yourhandle" value="${st.handles||''}"></div>
        <div class="field"><label for="oNotes">Anything we should know (optional)</label><textarea id="oNotes" rows="3" placeholder="Moments you want, words to avoid, references you like">${st.notes||''}</textarea></div>
        <div class="note">The order enters the queue once the team can download the file.</div>`;
    } else if(s.kind === "avatar"){
      body = prog + pick + `
        <label class="opt"><div>I consent to HeyPitch creating a digital likeness of me<small>You can withdraw at any time. We never use it outside your orders.</small></div><input type="checkbox" id="consent" ${st.consent?"checked":""}></label>
        ${st.avatarMode!=="have" ? `<label class="opt"><div>I can join a short recording and verification call<small>About five minutes on camera to spec, then a two minute call. Needed once, for the build.</small></div><input type="checkbox" id="cantime" ${st.consentTime?"checked":""}></label>` : ""}
        <div class="field"><label for="oScript">Script, or the topics you want covered</label><textarea id="oScript" rows="5" placeholder="Paste a script, or list topics and we write it">${st.script}</textarea></div>
        <div class="note">You pay first, then book the recording and verification slot on the next step.</div>`;
    } else {
      // explainer + gen ai: describe, then book a call. no payment.
      const isEx = s.kind === "explainer";
      body = prog + pick + `
        <div class="callnote"><span class="dot2"></span><span>${isEx ? "Explainers are scoped on a short call, so we get the script and price right. No payment now." : "Generated films are priced per concept, so we scope them on a short call first. No payment now."}</span></div>
        <div class="field"><label for="oScript">${isEx ? "What does the product do, and who is it for" : "Concept or script"}</label><textarea id="oScript" rows="5" placeholder="${isEx ? "Plain words are best. Paste a deck link if you have one." : "What happens, in order. References welcome."}">${st.script}</textarea></div>
        ${isEx ? `<div class="field"><label for="oOne">The one thing the viewer must understand</label><input id="oOne" placeholder="One sentence" value="${st.oneThing||''}"></div>` : ""}
        <div class="field"><label for="oEmail2">Email for the call invite</label><input id="oEmail2" type="email" placeholder="you@company.com"></div>`;
    }
    if(f.intake === "footage" || s.kind === "avatar"){
      foot = `<button class="btn btn-g" id="back">Back</button><div style="display:flex;gap:10px;align-items:center"><div class="tot">${money(orderTotal())}</div><button class="btn btn-p" id="next">Continue</button></div>`;
    } else {
      foot = `<button class="btn btn-g" id="back">Back</button><button class="btn btn-p" id="book">Book a call</button>`;
    }
  }
  if(st.step === 3){
    const lenLabel = s.shortform ? ", " + HP_CONFIG.durationTiers.find(t=>t.id===st.len).label.toLowerCase() : "";
    const noBuild = s.kind === "avatar" && st.avatarMode === "have";
    if(st.trial){
      body = prog + pick + `
        <div class="callnote"><span class="dot2"></span><span>Free trial edit. One ${HP_CONFIG.trial.seconds} second video with a HeyPitch watermark, yours to download.</span></div>
        <div class="field"><label for="oEmail">Sign in to start your free edit</label><input id="oEmail" type="email" placeholder="you@company.com"></div>
        <button class="btn btn-g" id="gsi" style="width:100%;justify-content:center">Continue with Google</button>
        <div class="opt"><div>Remove the watermark<small>Get this one clean, no logo. One time.</small></div><div style="font-weight:600">${money(HP_CONFIG.trial.removeLogo)}</div></div>
        <div class="note">We create your trial, email a link, and keep your brief so a full order later is one click.</div>`;
      foot = `<button class="btn btn-g" id="back">Back</button><button class="btn btn-p" id="startTrial">Start free edit</button>`;
    } else {
      const lines = [[`${s.name}${lenLabel} x ${st.qty}`, money(unitPrice(s,st.qty,st.len)*st.qty)]];
      if(s.build && !noBuild) lines.push(["Avatar build, one time", money(s.build)]);
      if(st.revision) lines.push([`Second revision round x ${st.qty}`, money(Math.round((s.shortform?styleUnit(s,st.len):s.price)*HP_CONFIG.revisionAddon)*st.qty)]);
      body = prog + pick + `
        <div>${lines.map(l=>`<div class="line"><span>${l[0]}</span><span>${l[1]}</span></div>`).join("")}<div class="line total"><span>Total</span><span>${money(orderTotal())}</span></div></div>
        <div class="field"><label for="oEmail">Email for your dashboard link</label><input id="oEmail" type="email" placeholder="you@company.com"></div>
        <div class="field"><label for="oCompany">Company (optional)</label><input id="oCompany" placeholder="For the invoice"></div>
        <div class="note">No password. We email a sign in link after payment.${s.kind==="avatar" ? " Then you book the recording and verification slot." : ""}</div>
        <div class="note warn">Nothing reaches our team until payment clears through Stripe. You are billed exactly the amount above.</div>`;
      foot = `<button class="btn btn-g" id="back">Back</button><div style="display:flex;gap:10px;align-items:center"><button class="btn btn-g" id="toCart">Add to cart</button><button class="btn btn-p" id="pay">Pay ${money(orderTotal())}</button></div>`;
    }
  }
  if(st.step === 4){
    const booked = st.mode === "call";
    const avatarCall = s.kind === "avatar" && !booked;
    if(booked){
      body = `<div class="done"><div class="ring"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg></div>
        <h3>Let us pick a time</h3><p style="text-align:center">Your brief for ${s.name} is saved. Choose a slot and we will scope it together, no payment yet.</p>
        <button class="btn btn-p" style="margin-top:6px">Open the calendar</button></div>`;
      foot = `<button class="btn btn-g" id="closeDone">Close</button>`;
    } else {
      const trialLine = st.trial ? `Your free ${HP_CONFIG.trial.seconds} second edit is being made. We will email the link with a HeyPitch watermark.` : `${s.name} x ${st.qty}. First delivery ${addDays(s.days)}. Your sign in link is on its way.`;
      body = `<div class="done"><div class="ring"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
        <h3>${st.trial ? "Your free edit is on the way" : "You are in the queue"}</h3><p style="text-align:center">${trialLine}</p>
        ${avatarCall ? `<div class="callnote" style="margin-top:8px"><span class="dot2"></span><span>Next, book your recording and verification slot so we can build the avatar.</span></div><button class="btn btn-p" style="margin-top:4px">Book the slot</button>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px"><span class="chip">Order HP-${Math.floor(1000+Math.random()*9000)}</span><span class="chip">${st.trial ? "Free trial" : (f.intake==="footage" ? (st.linkOk ? "Footage received" : "Waiting for footage") : "Brief received")}</span></div></div>`;
      foot = `<button class="btn btn-g" id="closeDone">Close</button><button class="btn btn-p" id="againDone">${st.trial ? "Order the full version" : "Order another"}</button>`;
    }
  }
  $("#dBody").innerHTML = body;
  $("#dFoot").innerHTML = foot;

  $$("[data-q]").forEach(b => b.addEventListener("click", () => { st.qty = +b.dataset.q; renderDrawer(); }));
  $$("[data-len]").forEach(b => b.addEventListener("click", () => { st.len = b.dataset.len; renderDrawer(); }));
  $$("[data-purpose]").forEach(b => b.addEventListener("click", () => { st.purpose = b.dataset.purpose; renderDrawer(); }));
  $$("[data-same]").forEach(b => b.addEventListener("click", () => { st.sameStyle = b.dataset.same === "1"; renderDrawer(); }));
  $("#oBrand")?.addEventListener("input", e => { st.brand = e.target.value; });
  $("#oHandles")?.addEventListener("input", e => { st.handles = e.target.value; });
  $("#oNotes")?.addEventListener("input", e => { st.notes = e.target.value; });
  $("#oOne")?.addEventListener("input", e => { st.oneThing = e.target.value; });
  $("#rev")?.addEventListener("change", e => { st.revision = e.target.checked; renderDrawer(); });
  $("#consent")?.addEventListener("change", e => { st.consent = e.target.checked; });
  $("#cantime")?.addEventListener("change", e => { st.consentTime = e.target.checked; });
  $("#oScript")?.addEventListener("input", e => { st.script = e.target.value; });
  $("#back")?.addEventListener("click", () => { st.step--; renderDrawer(); });
  $("#next")?.addEventListener("click", () => {
    if(st.step === 2 && s.kind === "avatar" && !st.consent){ toast("Tick the consent box to continue"); return; }
    if(st.step === 2 && s.kind === "avatar" && st.avatarMode!=="have" && !st.consentTime){ toast("Confirm you can join the recording call"); return; }
    st.step++; renderDrawer();
  });
  $("#book")?.addEventListener("click", () => { st.mode = "call"; st.step = 4; renderDrawer(); });
  $("#startTrial")?.addEventListener("click", () => { st.step = 4; renderDrawer(); });
  $("#gsi")?.addEventListener("click", () => toast("Google sign in connects here"));
  const oLink = $("#oLink");
  if(oLink){
    let t;
    oLink.addEventListener("input", () => {
      st.link = oLink.value.trim();
      clearTimeout(t);
      t = setTimeout(() => verifyLink(st.link, $("#oVerify"), $("#oInfo"), (ok,mins)=>{ st.linkOk = ok; st.mins = mins||null; }), 350);
    });
    if(st.link) verifyLink(st.link, $("#oVerify"), $("#oInfo"), (ok,mins)=>{ st.linkOk=ok; st.mins=mins||null; });
  }
  $("#toCart")?.addEventListener("click", () => {
    cart.push({ type:"style", name:`${s.name} x ${st.qty}`, meta:`${f.name}, ${st.revision?"two":"one"} revision round${st.revision?"s":""}`, price:orderTotal(), style:s.id });
    updateCart();
    closeDrawer();
    toast("Added to cart");
  });
  $("#pay")?.addEventListener("click", () => { st.step = 4; renderDrawer(); });
  $("#closeDone")?.addEventListener("click", closeDrawer);
  $("#againDone")?.addEventListener("click", () => { closeDrawer(); location.hash = "#edit"; });
}

