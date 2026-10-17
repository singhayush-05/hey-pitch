/* =========================================================
   HP_CONFIG. Commercial and system configuration.
   Edit here to change prices, currencies, limits or copy.
   ========================================================= */
const HP_CONFIG = {
  brand: "HeyPitch",
  apiBaseUrl: (typeof window !== "undefined" && window.HP_API_BASE)
    ? window.HP_API_BASE
    : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")
      ? "https://hey-pitch.onrender.com/api/v1"
      : "http://localhost:5000/api/v1",
  currencies: {
    USD: { symbol: "$",  rate: 1,    round: 1 },
    GBP: { symbol: "£",  rate: 0.79, round: 1 },
    EUR: { symbol: "€",  rate: 0.92, round: 1 },
    AED: { symbol: "AED ", rate: 3.67, round: 5 },
    INR: { symbol: "₹",  rate: 84,   round: 50 }
  },
  defaultCurrency: "USD",
  // currency is chosen automatically from the visitor's region. maps a detected
  // region code to a currency. real deployment reads this from an IP lookup on the server.
  geoToCurrency: { US:"USD", GB:"GBP", UK:"GBP", AU:"USD", AE:"AED", SA:"AED", IN:"INR",
                   DE:"EUR", FR:"EUR", ES:"EUR", IT:"EUR", NL:"EUR", IE:"EUR", EU:"EUR" },
  showCurrencyPicker: false,   // review: no manual choosing, region decides
  // short form is priced by finished length. the link checker reads source duration
  // and the buyer picks the output length here.
  durationTiers: [
    { id:"s60", label:"Up to 60 sec", mult:1,    note:"Best for a single hook or clip" },
    { id:"s90", label:"Up to 90 sec", mult:1.35, note:"More room to tell the story" }
  ],
  sourceCapMins: 20,           // per short-form order; checker warns above this
  // free trial: one watermarked short edit, sign-in gated, upsell to remove logo.
  // used as a lead magnet from ads; captures email + brief for follow up.
  trial: { seconds: 15, removeLogo: 12, enabled: true },
  // delivery promise scales with quantity. above callThreshold, team books a call.
  delivery: {
    base: "24 to 48 hours",
    tiers: [
      { max:2,  text:"24 to 48 hours" },
      { max:5,  text:"3 to 4 working days" },
      { max:10, text:"5 to 7 working days" }
    ],
    callThreshold: 10,
    callPromise: "At least 2 to 3 videos land within 48 hours, the rest on the schedule we agree on the call."
  },
  // why they want the video. shapes the brief and lets the team tailor the work.
  purposes: [
    { id:"branding", label:"Personal branding" },
    { id:"ads",      label:"Paid ads" },
    { id:"vsl",      label:"VSL, sales video" },
    { id:"content",  label:"Content, organic" },
    { id:"product",  label:"Product or demo" },
    { id:"other",    label:"Something else" }
  ],
  // social proof popups. company partly hidden on purpose.
  proof: [
    { who:"Josefa", what:"an AI avatar video", co:"Bright****", where:"Austin" },
    { who:"Marcus", what:"a podcast clip pack", co:"North****", where:"London" },
    { who:"Priya",  what:"an animated explainer", co:"Medi****", where:"Dubai" },
    { who:"Tom",    what:"a VSL edit", co:"Scale****", where:"Sydney" },
    { who:"Lena",   what:"3 ad cuts", co:"Kettle****", where:"Berlin" },
    { who:"Sam",    what:"a Gen AI film", co:"Vault****", where:"Toronto" }
  ],
  quantities: [1, 5, 10, 20],
  quantityDiscount: { 1: 0, 5: 0.08, 10: 0.15, 20: 0.22 },
  revisionAddon: 0.35,
  avatarModes: [
    { id:"talking", label:"Talking head", note:"Seated, straight to camera" },
    { id:"walking", label:"Walking",      note:"Moving shot, more natural" },
    { id:"photo",   label:"From a photo", note:"One image, we animate it" },
    { id:"have",    label:"I have an avatar", note:"Just edit it, no build fee", nobuild:true }
  ],
  cycleWords: ["videos","shorts","podcasts","ads","explainers","avatars"]
};

const HOSTS = ["drive.google.com","docs.google.com","dropbox.com","www.dropbox.com","wetransfer.com","we.tl","frame.io","app.frame.io"];
