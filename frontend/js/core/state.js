/* =========================================================
   HEYPITCH STORE - Centralized Application State
   ========================================================= */

// Currency state
let cur = (typeof localStorage !== "undefined" && localStorage.getItem('hp_currency')) || ((typeof HP_CONFIG !== "undefined" && HP_CONFIG.defaultCurrency) ? HP_CONFIG.defaultCurrency : "USD");

// User session state
let currentUser = null;

// Cart state & user-scoped isolation
let cart = [];

function getCartStorageKey(user = currentUser) {
  if (user && (user._id || user.id || user.userId || user.email)) {
    const uid = (user._id || user.id || user.userId || user.email).toLowerCase();
    return `hp_cart_${uid}`;
  }
  return 'hp_cart_guest';
}

function loadUserCart(user = currentUser) {
  try {
    const key = getCartStorageKey(user);
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    cart = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(cart)) cart = [];
  } catch (e) {
    cart = [];
  }
  if (typeof updateCart === "function") {
    updateCart();
  }
  return cart;
}

function saveUserCart(user = currentUser) {
  try {
    if (typeof localStorage === "undefined") return;
    const key = getCartStorageKey(user);
    localStorage.setItem(key, JSON.stringify(cart || []));
  } catch (e) {
    console.error("Failed to persist user cart:", e);
  }
}

function clearUserCart(user = currentUser) {
  try {
    if (typeof localStorage !== "undefined") {
      const key = getCartStorageKey(user);
      localStorage.removeItem(key);
    }
  } catch (e) {}
  cart = [];
  if (typeof updateCart === "function") {
    updateCart();
  }
}

// Order drawer state
let drawerState = null; // {styleId, qty, step, revision, linkOk, mins, consent}

// Gallery state
let activeTab = "foryou";
let galleryLimit = 8;

// Hero Maker studio state
let heroMode = "footage";       // footage | made
let heroPick = null;            // styleId (footage)
let heroLen = "s60";            // duration tier id
let heroLinkOk = false;
let heroMins = null;
let heroLink = "";
let madeStyle = "twin";         // made-mode chosen kind style
let avatarMode = "talking";
