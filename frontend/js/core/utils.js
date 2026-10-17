/* =========================================================
   HEYPITCH STORE - Utilities & Helpers
   Pricing, formatting, link verification, currency rendering.
   ========================================================= */

const styleById = id => HP_CONFIG.styles.find(s => s.id === id);
const famById = id => HP_CONFIG.families.find(f => f.id === id);

function money(usd){
  const c = HP_CONFIG.currencies[cur];
  let v = usd * c.rate;
  v = Math.round(v / c.round) * c.round;
  return c.symbol + v.toLocaleString("en-US");
}

// price of a style at a given length tier
function styleUnit(s, lenId){
  if(!s.shortform) return s.price;
  const t = HP_CONFIG.durationTiers.find(t => t.id === lenId) || HP_CONFIG.durationTiers[0];
  return Math.round(s.price * t.mult);
}

function unitPrice(style, qty, lenId){
  const d = HP_CONFIG.quantityDiscount[qty] || 0;
  const base = style.shortform && lenId ? styleUnit(style, lenId) : style.price;
  return Math.round(base * (1 - d));
}

function addDays(n){
  const d = new Date(); let added = 0;
  while(added < n){ d.setDate(d.getDate()+1); if(d.getDay() !== 0 && d.getDay() !== 6) added++; }
  return d.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });
}

/* ---------- tiles ---------- */
function tileHTML(s, extraClass=""){
  // if this style has a real preview (Cloudflare Stream / Mux / mp4 url), play it.
  // poster shows a still while it loads; falls back to the CSS mockup if no preview.
  if(s.preview){
    const poster = s.poster ? ` poster="${s.poster}"` : "";
    return `<div class="tile ${s.bg} ${extraClass} hasvid"><video src="${s.preview}#t=0.001"${poster} muted loop playsinline preload="metadata"></video><div class="cap ${s.cap} onvid">${s.text}</div></div>`;
  }
  const extra = s.extra === "shape" ? `<i class="shape" style="width:38%;height:18%;left:12%;top:18%;transform:rotate(-8deg)"></i><i class="shape" style="width:20%;height:20%;right:14%;bottom:34%;background:var(--violet3);border-radius:50%"></i>`
    : s.extra === "bars" ? `<div class="bars"><i></i><i></i><i></i><i></i></div>`
    : s.extra === "orbit" ? `<div class="orbit"></div>`
    : s.extra === "scan" ? `<div class="scan"></div>` : "";
  const person = (s.fam === "cut" || s.fam === "clip" || s.kind === "avatar") ? `<div class="subject"></div><div class="head"></div>` : "";
  return `<div class="tile ${s.bg} ${extraClass}">${person}${extra}<div class="cap ${s.cap}">${s.text}</div></div>`;
}

// Global short-form video hover-only playback controller
let activeHoveredVideo = null;

document.addEventListener("mouseover", (e) => {
  const card = e.target.closest(".gcard, .madecard, .card, .dc-thumb, .tp-tile, .chosen");
  if (!card) return;
  const video = card.querySelector(".tile.hasvid video");
  if (!video) return;

  if (activeHoveredVideo && activeHoveredVideo !== video) {
    activeHoveredVideo.pause();
    activeHoveredVideo = null;
  }

  activeHoveredVideo = video;
  video.play().catch(() => {});
});

document.addEventListener("mouseout", (e) => {
  const card = e.target.closest(".gcard, .madecard, .card, .dc-thumb, .tp-tile, .chosen");
  if (!card) return;
  if (e.relatedTarget && card.contains(e.relatedTarget)) {
    return;
  }

  const video = card.querySelector(".tile.hasvid video");
  if (video) {
    video.pause();
    if (activeHoveredVideo === video) {
      activeHoveredVideo = null;
    }
  }
});

function initVideoAutoplay() {
  // Ensure all videos start in a static, paused state
  document.querySelectorAll(".tile.hasvid video").forEach(v => {
    v.pause();
  });
}

/* ---------- currency: automatic by IP and region ---------- */
function timezoneToCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Calcutta") || tz.includes("Kolkata") || tz.startsWith("Asia/Kolkata")) return "IN";
    if (tz.startsWith("Europe/London")) return "GB";
    if (tz.startsWith("Asia/Dubai")) return "AE";
    if (tz.startsWith("Europe/Berlin") || tz.startsWith("Europe/Paris") || tz.startsWith("Europe/Madrid") || tz.startsWith("Europe/Rome") || tz.startsWith("Europe/Amsterdam") || tz.startsWith("Europe/Dublin")) return "EU";
    if (tz.startsWith("America/")) return "US";
    if (tz.startsWith("Australia/")) return "AU";
  } catch(e) {}
  return null;
}

function detectRegion(){
  if(window.__DETECTED_COUNTRY) return window.__DETECTED_COUNTRY;
  if(window.__REGION) return window.__REGION;
  const fromTz = timezoneToCountry();
  if(fromTz) return fromTz;
  try{
    const loc = (Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || "en-US");
    const parts = loc.split("-"); const cc = (parts[1] || "").toUpperCase();
    if(cc && cc.length === 2) return cc;
  }catch(e){}
  return "US";
}

function currencyToRegion(c){
  const map = { USD:"US", GBP:"GB", EUR:"EU", AED:"AE", INR:"IN" };
  return map[c] || "US";
}

function applyCurrency(newCur, countryCode){
  if(!newCur || !HP_CONFIG.currencies || !HP_CONFIG.currencies[newCur]) return;
  cur = newCur;
  if(countryCode) window.__DETECTED_COUNTRY = countryCode;
  window.__DETECTED_CURRENCY = newCur;

  if(typeof localStorage !== "undefined"){
    localStorage.setItem('hp_currency', newCur);
    if(countryCode) localStorage.setItem('hp_ip_country', countryCode);
  }

  renderCurrency();
  if(typeof renderGallery === "function") renderGallery();
  if(typeof renderPacks === "function") renderPacks();
  if(typeof heroMode !== "undefined" && heroMode === "footage" && typeof heroPick !== "undefined" && heroPick && typeof renderLenRow === "function"){
    renderLenRow();
  }
  if(typeof heroMode !== "undefined" && heroMode === "made" && typeof renderMade === "function"){
    renderMade();
  }
  if(typeof updateHint === "function") updateHint();
  if(typeof drawerState !== "undefined" && drawerState && typeof renderDrawer === "function"){
    renderDrawer();
  }
  if(typeof updateCart === "function") updateCart();
}

function renderCurrency(){
  const badge = $("#curBadge");
  if(badge){
    const reg = window.__DETECTED_COUNTRY || (typeof localStorage !== "undefined" && localStorage.getItem('hp_ip_country')) || currencyToRegion(cur);
    badge.textContent = `${reg} · ${cur}`;
    badge.title = `Prices shown in ${cur} (auto-detected from your IP: ${reg})`;
    badge.style.cursor = "default";
  }
}

async function initIpCurrency(){
  let detectedCountry = null;
  let detectedCurrency = null;

  // 1. Query Backend Geo IP lookup endpoint
  try {
    if(typeof HeyPitchAPI !== 'undefined' && typeof HeyPitchAPI.getGeoLookup === 'function'){
      const res = await HeyPitchAPI.getGeoLookup();
      if(res && res.success && res.data && res.data.currency){
        detectedCountry = res.data.country;
        detectedCurrency = res.data.currency;
      }
    }
  } catch(err) {
    // Backend endpoint offline or reloading; fallback gracefully
  }

  // 2. Query fast external IP-to-Country API fallback
  if(!detectedCurrency){
    try {
      const res = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(2500) });
      if(res.ok){
        const data = await res.json();
        if(data && data.country){
          detectedCountry = data.country.toUpperCase();
          detectedCurrency = (HP_CONFIG.geoToCurrency && HP_CONFIG.geoToCurrency[detectedCountry]) || null;
        }
      }
    } catch(e) {
      // Offline or network restricted
    }
  }

  // 3. Fallback to browser timezone and locale
  if(!detectedCurrency){
    detectedCountry = timezoneToCountry() || detectRegion() || "US";
    detectedCurrency = (HP_CONFIG.geoToCurrency && HP_CONFIG.geoToCurrency[detectedCountry]) || HP_CONFIG.defaultCurrency || "USD";
  }

  if(!HP_CONFIG.currencies || !HP_CONFIG.currencies[detectedCurrency]){
    detectedCurrency = HP_CONFIG.defaultCurrency || "USD";
  }

  applyCurrency(detectedCurrency, detectedCountry);
}

/* ---------- link verification (real backend API integration) ---------- */
async function verifyLink(url, el, info, cb){
  if(!url || !url.trim()){
    el.className = "verify";
    el.innerHTML = `<span class="dot"></span><span>Paste your footage link to attach it to your order</span>`;
    info.classList.remove("on");
    cb && cb(false);
    return;
  }

  el.className = "verify wait";
  el.innerHTML = `<span class="dot"></span><span>Checking link format...</span>`;
  info.classList.remove("on");

  try {
    const res = await HeyPitchAPI.checkResource(url.trim());
    const data = res.data;

    if (data.verified && data.isDownloadable) {
      el.className = "verify ok";
      el.innerHTML = `<span class="dot"></span><span>✔ Link provided successfully. (Ensure access is set to "Anyone with the link")</span>`;
      
      const providerLabel = (data.provider || 'Cloud').replace('_', ' ').toUpperCase();
      info.innerHTML = `<span>${providerLabel}</span><span>Link Provided</span><span>Format Valid</span>`;
      info.classList.add("on");
      cb && cb(true, 15);
    } else {
      el.className = "verify bad";
      const isRestricted = data.status === "unauthorized" || data.status === "view_only";
      el.innerHTML = `<span class="dot"></span><div>
        <b>${isRestricted ? "⚠️ Sharing Permission Needed:" : "⚠️ Invalid Link:"}</b> ${data.message || 'We cannot open this link. Please check permissions.'}
        <div style="font-size:12px;color:var(--muted);margin-top:3px">Please ensure your link is shared as <b>"Anyone with the link"</b> in your drive settings.</div>
      </div>`;
      info.classList.remove("on");
      cb && cb(false);
    }
  } catch (err) {
    // If backend is unreachable or returns error, perform local syntax safety check
    let host; try { host = new URL(url).hostname; } catch { host = null; }
    if(!host || !HOSTS.some(h => host.endsWith(h))){
      el.className = "verify bad";
      el.innerHTML = `<span class="dot"></span><span>That is not a link we can open. Use Google Drive, Dropbox, WeTransfer or Frame.io.</span>`;
      cb && cb(false);
      return;
    }

    const shared = /usp=sharing|dl=0|dl=1|\/share\//.test(url) || host.includes("wetransfer") || host.includes("we.tl") || host.includes("frame.io");
    if(!shared){
      el.className = "verify bad";
      el.innerHTML = `<span class="dot"></span><div><b>Sharing Access Required:</b> Set link to <code>Anyone with the link</code> in Drive/Dropbox so editors can access your files.</div>`;
      cb && cb(false);
      return;
    }

    el.className = "verify ok";
    el.innerHTML = `<span class="dot"></span><span>✔ Link provided successfully. (Ensure shared as "Anyone with the link")</span>`;
    info.innerHTML = `<span>CLOUD FILE</span><span>Link Provided</span>`;
    info.classList.add("on");
    cb && cb(true, 15);
  }
}
