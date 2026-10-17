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
    return `<div class="tile ${s.bg} ${extraClass} hasvid"><video src="${s.preview}"${poster} muted loop playsinline preload="metadata" autoplay></video><div class="cap ${s.cap} onvid">${s.text}</div></div>`;
  }
  const extra = s.extra === "shape" ? `<i class="shape" style="width:38%;height:18%;left:12%;top:18%;transform:rotate(-8deg)"></i><i class="shape" style="width:20%;height:20%;right:14%;bottom:34%;background:var(--violet3);border-radius:50%"></i>`
    : s.extra === "bars" ? `<div class="bars"><i></i><i></i><i></i><i></i></div>`
    : s.extra === "orbit" ? `<div class="orbit"></div>`
    : s.extra === "scan" ? `<div class="scan"></div>` : "";
  const person = (s.fam === "cut" || s.fam === "clip" || s.kind === "avatar") ? `<div class="subject"></div><div class="head"></div>` : "";
  return `<div class="tile ${s.bg} ${extraClass}">${person}${extra}<div class="cap ${s.cap}">${s.text}</div></div>`;
}

/* ---------- currency: automatic by region ---------- */
function detectRegion(){
  // real deployment: server sets window.__REGION from an IP lookup.
  // fallback: infer from the browser locale.
  if(window.__REGION) return window.__REGION;
  try{
    const loc = (Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || "en-US");
    const parts = loc.split("-"); const cc = (parts[1] || "").toUpperCase();
    if(cc) return cc;
  }catch(e){}
  return "US";
}

function renderCurrency(){
  const region = detectRegion();
  cur = HP_CONFIG.geoToCurrency[region] || HP_CONFIG.defaultCurrency;
  const badge = $("#curBadge");
  if(badge) badge.textContent = `${region} · ${cur}`;
}

/* ---------- link verification (simulated; replace with backend call) ---------- */
function verifyLink(url, el, info, cb){
  el.className = "verify wait"; el.innerHTML = `<span class="dot"></span><span>Checking access</span>`; info.classList.remove("on");
  let host; try { host = new URL(url).hostname; } catch { host = null; }
  setTimeout(() => {
    if(!host || !HOSTS.some(h => host.endsWith(h))){
      el.className = "verify bad"; el.innerHTML = `<span class="dot"></span><span>That is not a link we can open. Use Google Drive, Dropbox, WeTransfer or Frame.io.</span>`; cb && cb(false); return;
    }
    const shared = /usp=sharing|dl=0|dl=1|\/share\//.test(url) || host.includes("wetransfer") || host.includes("we.tl") || host.includes("frame.io");
    if(!shared){
      el.className = "verify bad"; el.innerHTML = `<span class="dot"></span><span>We cannot open this yet. In the share menu set it to <code>Anyone with the link</code>, then paste again.</span>`; cb && cb(false); return;
    }
    // second check: can the team actually DOWNLOAD, not just view
    el.className = "verify wait"; el.innerHTML = `<span class="dot"></span><span>Link opens. Checking download access</span>`;
    setTimeout(() => {
      // Drive "view only" links block download; we detect and ask to allow it
      const viewOnly = host.includes("drive.google") && /\/view/.test(url) && !/usp=sharing/.test(url);
      if(viewOnly){
        el.className = "verify bad"; el.innerHTML = `<span class="dot"></span><span>This is view only, so the team cannot download it. Set access to <code>Anyone with the link</code> and allow download, then paste again.</span>`; cb && cb(false); return;
      }
      el.className = "verify ok"; el.innerHTML = `<span class="dot"></span><span>Open and downloadable. Reading the file.</span>`;
      setTimeout(() => {
        const mins = 8 + Math.floor(Math.random()*40), size = (mins * 0.11).toFixed(1);
        info.innerHTML = `<span>MP4</span><span>${mins} min ${Math.floor(Math.random()*59)} sec</span><span>${size} GB</span><span>Download OK</span>`;
        info.classList.add("on"); cb && cb(true, mins);
      }, 500);
    }, 650);
  }, 700);
}
