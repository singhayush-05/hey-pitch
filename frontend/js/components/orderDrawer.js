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
    const authNotice = currentUser
      ? ""
      : `<div class="drawer-auth-notice"><span class="dan-dot"></span><span>Account required to order. You can sign in now or at step 3.</span><a href="#" id="step1SignIn">Sign in</a></div>`;

    body = prog + pick + authNotice + lenSel + `
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
      const trialBadge = st.trial ? `<div class="callnote" style="margin-bottom:8px"><span class="dot2"></span><span>Free trial. You get one ${HP_CONFIG.trial.seconds} second edit with a small HeyPitch watermark. Remove it any time for ${money(HP_CONFIG.trial.removeLogo)}.</span></div>` : "";
      body = prog + pick + trialBadge + `
        <div class="public-req-banner">
          <div class="prb-head">
            <span class="prb-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <span>Public Sharing Required</span>
          </div>
          <div class="prb-text">
            Your footage link <b>must be shared as public ("Anyone with the link can view & download")</b>. If your link is private, password-protected, or requires login, our editors cannot access your raw footage and <b>we cannot entertain your order</b>.
          </div>
          <div class="prb-steps">
            <div class="prb-step"><span class="prb-num">1</span><span>Click <b>Share</b> in Google Drive / Dropbox</span></div>
            <div class="prb-step"><span class="prb-num">2</span><span>Set General Access to <b>"Anyone with the link"</b></span></div>
            <div class="prb-step"><span class="prb-num">3</span><span>Verify role is <b>Viewer</b> (allows downloading)</span></div>
          </div>
        </div>
        <div class="field"><label for="oLink">Footage link (Must be Public) <span style="color:var(--bad)">*</span></label><input id="oLink" type="url" placeholder="Paste your public Drive or Dropbox link" value="${st.link}"></div>
        <div class="verify" id="oVerify"><span class="dot"></span><span>Paste your public link and we confirm download access</span></div>
        <div class="fileinfo" id="oInfo"></div>
        <div class="field"><label for="oBrand">Brand kit or guidelines (optional)</label><input id="oBrand" type="url" placeholder="Link to logo, fonts, colours" value="${st.brand||''}"></div>
        <div class="field"><label for="oHandles">Where it will post, and handles (optional)</label><input id="oHandles" placeholder="TikTok, Reels, YouTube Shorts, @yourhandle" value="${st.handles||''}"></div>
        <div class="field"><label for="oNotes">Anything we should know (optional)</label><textarea id="oNotes" rows="3" placeholder="Moments you want, words to avoid, references you like">${st.notes||''}</textarea></div>
        <div class="note">The order enters the production queue once public download access is confirmed. Private links cannot be entertained.</div>`;
    } else if(s.kind === "avatar"){
      body = prog + pick + `
        <label class="opt"><div>I consent to HeyPitch creating a digital likeness of me<small>You can withdraw at any time. We never use it outside your orders.</small></div><input type="checkbox" id="consent" ${st.consent?"checked":""}></label>
        ${st.avatarMode!=="have" ? `<label class="opt"><div>I can join a short recording and verification call<small>About five minutes on camera to spec, then a two minute call. Needed once, for the build.</small></div><input type="checkbox" id="cantime" ${st.consentTime?"checked":""}></label>` : ""}
        <div class="field"><label for="oScript">Script, or the topics you want covered</label><textarea id="oScript" rows="5" placeholder="Paste a script, or list topics and we write it">${st.script}</textarea></div>
        <div class="note">You pay first, then book the recording and verification slot on the next step.</div>`;
    } else {
      // explainer + gen ai: describe, then book a call. no payment.
      const isEx = s.kind === "explainer";
      const callAuthSection = currentUser
        ? `<div class="user-order-badge" style="margin-top:12px"><span class="uob-dot"></span><span>Call invite will be sent to <b>${currentUser.email}</b></span><button class="uob-switch" id="switchUserBtn" type="button">Switch</button></div>`
        : `<div class="auth-gate-card">
             <div class="agc-badge">
               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               <span>Account Required</span>
             </div>
             <h4>Sign in or Register to Book Call</h4>
             <p>Sign in or create an account to book your project scoping call. The invite and scoped brief will be saved to your dashboard.</p>
             <div class="agc-actions">
               <button class="btn btn-p btn-s" id="callSignIn" type="button">Sign in</button>
               <button class="btn btn-g btn-s" id="callRegister" type="button">Create Account</button>
             </div>
           </div>`;

      body = prog + pick + `
        <div class="callnote"><span class="dot2"></span><span>${isEx ? "Explainers are scoped on a short call, so we get the script and price right. No payment now." : "Generated films are priced per concept, so we scope them on a short call first. No payment now."}</span></div>
        <div class="field"><label for="oScript">${isEx ? "What does the product do, and who is it for" : "Concept or script"}</label><textarea id="oScript" rows="5" placeholder="${isEx ? "Plain words are best. Paste a deck link if you have one." : "What happens, in order. References welcome."}">${st.script}</textarea></div>
        ${isEx ? `<div class="field"><label for="oOne">The one thing the viewer must understand</label><input id="oOne" placeholder="One sentence" value="${st.oneThing||''}"></div>` : ""}
        ${callAuthSection}`;
    }
    if(f.intake === "footage" || s.kind === "avatar"){
      foot = `<button class="btn btn-g" id="back">Back</button><div style="display:flex;gap:10px;align-items:center"><div class="tot">${money(orderTotal())}</div><button class="btn btn-p" id="next">Continue</button></div>`;
    } else {
      const bookBtnText = currentUser ? "Book a call" : "Sign in to Book a call";
      foot = `<button class="btn btn-g" id="back">Back</button><button class="btn btn-p" id="book">${currentUser ? '' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> '}${bookBtnText}</button>`;
    }
  }
  if(st.step === 3){
    const lenLabel = s.shortform ? ", " + HP_CONFIG.durationTiers.find(t=>t.id===st.len).label.toLowerCase() : "";
    const noBuild = s.kind === "avatar" && st.avatarMode === "have";
    const authSection = currentUser
      ? `<div class="user-order-badge">
           <span class="uob-dot"></span>
           <span>Signed in as <b>${currentUser.name || currentUser.email}</b> (${currentUser.email})</span>
           <button class="uob-switch" id="switchUserBtn" type="button">Switch</button>
         </div>`
      : `<div class="auth-gate-card">
           <div class="agc-badge">
             <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             <span>Account Required</span>
           </div>
           <h4>Sign in or Register to Place Order</h4>
           <p>An account is required so we can save your brief, verify Drive files, and deliver your finished video drafts to your private dashboard.</p>
           <div class="agc-actions">
             <button class="btn btn-p btn-s" id="step3SignIn" type="button"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign in</button>
             <button class="btn btn-g btn-s" id="step3Register" type="button">Create Account</button>
           </div>
         </div>`;

    const footageReviewBadge = (f.intake === "footage" && st.link) ? `
      <div class="callnote" style="margin-top:10px">
        <span class="dot2" style="background:var(--ok);box-shadow:0 0 10px var(--ok)"></span>
        <div>
          <div><b>Verified Public Footage:</b> <span style="word-break:break-all">${st.link}</span></div>
          <div style="font-size:12px;color:var(--ok);margin-top:2px">✔ Confirmed Public Access ("Anyone with the link") · Ready for video queue</div>
        </div>
      </div>` : "";

    if(st.trial){
      body = prog + pick + `
        <div class="callnote"><span class="dot2"></span><span>Free trial edit. One ${HP_CONFIG.trial.seconds} second video with a HeyPitch watermark, yours to download.</span></div>
        ${authSection}
        ${footageReviewBadge}
        <div class="opt"><div>Remove the watermark<small>Get this one clean, no logo. One time.</small></div><div style="font-weight:600">${money(HP_CONFIG.trial.removeLogo)}</div></div>
        <div class="note">We create your trial order in our database, verify the brief, and prepare the render queue.</div>`;
      const trialBtnText = currentUser ? "Start free edit" : "Sign in to Start Free Edit";
      foot = `<button class="btn btn-g" id="back">Back</button><button class="btn btn-p" id="startTrial">${currentUser ? '' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> '}${trialBtnText}</button>`;
    } else {
      const lines = [[`${s.name}${lenLabel} x ${st.qty}`, money(unitPrice(s,st.qty,st.len)*st.qty)]];
      if(s.build && !noBuild) lines.push(["Avatar build, one time", money(s.build)]);
      if(st.revision) lines.push([`Second revision round x ${st.qty}`, money(Math.round((s.shortform?styleUnit(s,st.len):s.price)*HP_CONFIG.revisionAddon)*st.qty)]);
      body = prog + pick + `
        <div>${lines.map(l=>`<div class="line"><span>${l[0]}</span><span>${l[1]}</span></div>`).join("")}<div class="line total"><span>Total</span><span>${money(orderTotal())}</span></div></div>
        ${authSection}
        ${footageReviewBadge}
        <div class="note">Verified price calculated authoritatively by HeyPitch server. Delivery estimated at ${addDays(s.days)}.</div>
        <div class="note warn">Orders enter the queue immediately upon server confirmation.</div>`;
      const payBtnText = currentUser ? `Place Order · ${money(orderTotal())}` : `Sign in to Place Order · ${money(orderTotal())}`;
      foot = `<button class="btn btn-g" id="back">Back</button><div style="display:flex;gap:10px;align-items:center"><button class="btn btn-g" id="toCart">Add to cart</button><button class="btn btn-p" id="pay">${currentUser ? '' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> '}${payBtnText}</button></div>`;
    }
  }
  if(st.step === 4){
    if (!st.createdOrder || !st.createdOrder.orderId) {
      body = `<div class="done">
        <div class="ring" style="background:var(--bad);box-shadow:0 0 30px rgba(255,107,139,.4)">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h3>Order Placement Failed</h3>
        <p style="text-align:center">Unable to save order to the HeyPitch server. Please verify your connection and brief, then try again.</p>
        <button class="btn btn-p" id="retryOrder" style="margin-top:14px">Retry Order</button>
      </div>`;
      foot = `<button class="btn btn-g" id="closeDone">Close</button>`;
    } else {
      const booked = st.mode === "call";
      const avatarCall = s.kind === "avatar" && !booked;
      const realOrder = st.createdOrder;

      if(booked){
        body = `<div class="done"><div class="ring"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg></div>
          <h3>Discovery Call Booked</h3><p style="text-align:center">Your brief for ${s.name} is saved. Order ID: <b>${realOrder.orderId}</b>. Choose a slot and we will scope it together, no payment yet.</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:6px"><span class="chip-id">${realOrder.orderId}</span><span class="chip-status s-ok">Discovery Call Booked</span></div>
          <button class="btn btn-p" style="margin-top:10px" id="btnTrackThis">View in Order Tracker</button></div>`;
        foot = `<button class="btn btn-g" id="closeDone">Close</button>`;
      } else {
        const trialLine = st.trial
          ? `Your free ${HP_CONFIG.trial.seconds} second edit is saved on the server. Order <b>${realOrder.orderId}</b> is now queued.`
          : `${s.name} x ${st.qty}. Order <b>${realOrder.orderId}</b> created on server. First delivery estimate: ${addDays(s.days)}.`;

        body = `<div class="done"><div class="ring"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
          <h3>${st.trial ? "Free Trial Order Placed" : "Order Successfully Placed"}</h3>
          <p style="text-align:center">${trialLine}</p>
          ${avatarCall ? `<div class="callnote" style="margin-top:8px"><span class="dot2"></span><span>Next, book your recording and verification slot so we can build the avatar.</span></div>` : ""}
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px">
            <span class="chip-id">${realOrder.orderId}</span>
            <span class="chip-status s-ok">${st.trial ? "Free Trial" : (st.linkOk ? "Footage Verified" : "Order Queued")}</span>
          </div>
          <button class="btn btn-p btn-s" id="btnTrackThis" style="margin-top:14px">Track Order Live</button>
        </div>`;
        foot = `<button class="btn btn-g" id="closeDone">Close</button><button class="btn btn-p" id="againDone">${st.trial ? "Order the full version" : "Order another"}</button>`;
      }
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
  $("#retryOrder")?.addEventListener("click", () => { st.step = 3; renderDrawer(); });

  const oLink = $("#oLink");
  if(oLink){
    let t;
    const triggerVerify = () => {
      st.link = oLink.value.trim();
      clearTimeout(t);
      if (!st.link) {
        st.linkOk = false;
        const vEl = $("#oVerify");
        if (vEl) {
          vEl.className = "verify";
          vEl.innerHTML = `<span class="dot"></span><span>Paste your public link and we confirm download access</span>`;
        }
        $("#oInfo")?.classList.remove("on");
        return;
      }
      t = setTimeout(() => {
        verifyLink(st.link, $("#oVerify"), $("#oInfo"), (ok, mins) => {
          st.linkOk = ok;
          st.mins = mins || null;
        });
      }, 350);
    };

    oLink.addEventListener("input", triggerVerify);
    oLink.addEventListener("paste", () => setTimeout(triggerVerify, 60));
    if(st.link) {
      verifyLink(st.link, $("#oVerify"), $("#oInfo"), (ok, mins) => {
        st.linkOk = ok;
        st.mins = mins || null;
      });
    }
  }

  $("#next")?.addEventListener("click", () => {
    if(st.step === 2 && f.intake === "footage"){
      const currentLink = $("#oLink")?.value?.trim() || st.link?.trim() || "";
      st.link = currentLink;
      if (!currentLink) {
        toast("Public link required: Please paste your Google Drive or Dropbox footage link to proceed");
        const inp = $("#oLink");
        if (inp) {
          inp.focus();
          inp.style.borderColor = "var(--bad)";
          inp.style.boxShadow = "0 0 0 3px rgba(255,107,139,.3)";
          setTimeout(() => { inp.style.borderColor = ""; inp.style.boxShadow = ""; }, 2500);
        }
        return;
      }
      if (!st.linkOk) {
        toast("Public link required: Set access to 'Anyone with the link' so our team can download. Private links cannot be entertained.");
        const inp = $("#oLink");
        if (inp) {
          inp.focus();
          inp.style.borderColor = "var(--bad)";
          inp.style.boxShadow = "0 0 0 3px rgba(255,107,139,.3)";
          setTimeout(() => { inp.style.borderColor = ""; inp.style.boxShadow = ""; }, 2500);
        }
        return;
      }
    }
    if(st.step === 2 && s.kind === "avatar" && !st.consent){ toast("Tick the consent box to continue"); return; }
    if(st.step === 2 && s.kind === "avatar" && st.avatarMode!=="have" && !st.consentTime){ toast("Confirm you can join the recording call"); return; }
    st.step++; renderDrawer();
  });

  $("#step1SignIn")?.addEventListener("click", (e) => {
    e.preventDefault();
    openAuthModal("login", () => renderDrawer());
  });

  $("#step3SignIn")?.addEventListener("click", () => {
    openAuthModal("login", () => renderDrawer());
  });

  $("#step3Register")?.addEventListener("click", () => {
    openAuthModal("register", () => renderDrawer());
  });

  $("#callSignIn")?.addEventListener("click", () => {
    openAuthModal("login", () => renderDrawer());
  });

  $("#callRegister")?.addEventListener("click", () => {
    openAuthModal("register", () => renderDrawer());
  });

  $("#switchUserBtn")?.addEventListener("click", () => {
    openAuthModal("login", () => renderDrawer());
  });

  const submitRealOrder = async (isBooking = false) => {
    // ENFORCE SIGN-IN / ACCOUNT CREATION
    if (!currentUser) {
      toast("Please sign in or create an account to place this order");
      openAuthModal("login", () => {
        renderDrawer();
        submitRealOrder(isBooking);
      });
      return;
    }

    if (f.intake === "footage") {
      if (!st.link || !st.link.trim()) {
        toast("A public footage link is required before placing this order");
        st.step = 2;
        renderDrawer();
        return;
      }
      if (!st.linkOk) {
        toast("Public access required: Please share your link as 'Anyone with the link' before placing this order. Private links cannot be entertained.");
        st.step = 2;
        renderDrawer();
        return;
      }
    }

    const email = currentUser.email;
    const submitBtn = isBooking ? $("#book") : (st.trial ? $("#startTrial") : $("#pay"));
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Connecting to server...";
    }

    const payload = {
      styleId: s.id,
      customerEmail: email,
      customerCompany: currentUser?.company || $("#oCompany")?.value?.trim() || "",
      qty: st.qty,
      len: st.len,
      purpose: st.purpose,
      sameStyle: st.sameStyle,
      revision: st.revision,
      avatarMode: s.kind === "avatar" ? st.avatarMode : undefined,
      footageLink: st.link || "",
      footageDownloadOk: st.linkOk || false,
      brandKitLink: st.brand || "",
      handles: st.handles || "",
      notes: st.notes || "",
      script: st.script || "",
      oneThing: st.oneThing || "",
      isTrial: Boolean(st.trial),
      trialRemoveWatermark: false,
      mode: isBooking ? "call" : (st.trial ? "trial" : "order"),
      currency: cur || "USD"
    };

    try {
      const res = await HeyPitchAPI.createOrder(payload);
      st.createdOrder = res.data.order;
      if (isBooking) st.mode = "call";
      st.step = 4;
      renderDrawer();
      toast(`Order ${res.data.order.orderId} created on server!`);
    } catch (err) {
      toast(err.message || "Failed to place order on server");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isBooking ? "Book a call" : (st.trial ? "Start free edit" : `Pay ${money(orderTotal())}`);
      }
    }
  };

  $("#book")?.addEventListener("click", () => submitRealOrder(true));
  $("#startTrial")?.addEventListener("click", () => submitRealOrder(false));
  $("#pay")?.addEventListener("click", () => submitRealOrder(false));

  $("#btnTrackThis")?.addEventListener("click", () => {
    if (st.createdOrder?.orderId) {
      closeDrawer();
      openOrderTracker(st.createdOrder.orderId);
    }
  });

  $("#toCart")?.addEventListener("click", () => {
    if (f.intake === "footage") {
      if (!st.link || !st.link.trim()) {
        toast("Please paste your footage link before adding to cart");
        st.step = 2;
        renderDrawer();
        return;
      }
      if (!st.linkOk) {
        toast("Please provide a verified, downloadable footage link before adding to cart");
        st.step = 2;
        renderDrawer();
        return;
      }
    }

    cart.push({
      type: "style",
      name: `${s.name} x ${st.qty}`,
      meta: `${f.name}, ${st.revision ? "two" : "one"} revision round${st.revision ? "s" : ""}`,
      price: orderTotal(),
      style: s.id,
      styleId: s.id,
      qty: st.qty,
      len: st.len,
      purpose: st.purpose,
      revision: st.revision,
      avatarMode: st.avatarMode,
      link: st.link,
      linkOk: st.linkOk,
      brand: st.brand,
      handles: st.handles,
      notes: st.notes,
      script: st.script,
      oneThing: st.oneThing
    });
    updateCart();
    closeDrawer();
    toast("Added to cart");
  });

  $("#closeDone")?.addEventListener("click", closeDrawer);
  $("#againDone")?.addEventListener("click", () => { closeDrawer(); location.hash = "#edit"; });
}

