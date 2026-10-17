/* =========================================================
   HEYPITCH STORE - Centralized Application State
   ========================================================= */

// Currency state
let cur = (typeof localStorage !== "undefined" && localStorage.getItem('hp_currency')) || ((typeof HP_CONFIG !== "undefined" && HP_CONFIG.defaultCurrency) ? HP_CONFIG.defaultCurrency : "USD");

// Cart state
let cart = [];

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
