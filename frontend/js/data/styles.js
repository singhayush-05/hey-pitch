/* =========================================================
   HEYPITCH STORE - Styles Catalog & Made Types
   Real Short-Form Video Templates Attached
   ========================================================= */

HP_CONFIG.styles = [
  // Cut (basic editing floor)
  { id:"plain",    fam:"cut", name:"Plain",    mood:"Clean words, nothing loud",      price:30,  credits:1, days:2, bg:"bg-slate", cap:"line",    text:"Say it once", cat:["clean"], shortform:true, preview:"./assets/videos/video1.mp4" },
  { id:"pulse",    fam:"cut", name:"Pulse",    mood:"Active word highlight",         price:39,  credits:1, days:2, bg:"bg-ink",   cap:"word",    text:"<b>Make</b> <b>it</b> <b>land</b>", tag:"Popular", badge:"trend", cat:["popular","bold"], shortform:true, preview:"./assets/videos/video1.mp4" },
  { id:"stamp",    fam:"cut", name:"Stamp",    mood:"Boxed keywords, high contrast", price:45,  credits:1, days:2, bg:"bg-warm",  cap:"box",     text:"<b>Stop</b> guessing", pro:true, cat:["popular","bold"], shortform:true, preview:"./assets/videos/video2.mp4" },
  { id:"quiet",    fam:"cut", name:"Quiet",    mood:"Editorial serif, for experts",  price:45,  credits:1, days:3, bg:"bg-bloom", cap:"serif",   text:"there is still time", cat:["editorial","clean"], shortform:true, preview:"./assets/videos/video3.mp4" },
  { id:"note",     fam:"cut", name:"Note",     mood:"Underlined single line",        price:30,  credits:1, days:2, bg:"bg-slate", cap:"line",    text:"the clearest", cat:["clean"], shortform:true, preview:"./assets/videos/video4.mp4" },

  // Clip
  { id:"moment",   fam:"clip", name:"Moment",   mood:"Hook first, one idea per clip",price:35,  credits:1, days:3, bg:"bg-ink",   cap:"word",    text:"<b>Here is</b> <b>what</b> <b>worked</b>", tag:"Popular", badge:"trend", cat:["popular","bold"], shortform:true, preview:"./assets/videos/video1.mp4" },
  { id:"behindbig",fam:"clip", name:"Loud",     mood:"Big words behind the speaker", price:45,  credits:1, days:3, bg:"bg-bloom", cap:"behind",  text:"NEVER", badge:"new", cat:["behind","bold"], shortform:true, preview:"./assets/videos/video2.mp4" },
  { id:"stage",    fam:"clip", name:"Stage",    mood:"Name sits behind the shoulder",price:45,  credits:1, days:3, bg:"bg-warm",  cap:"behind",  text:"IDEA", cat:["behind"], shortform:true, preview:"./assets/videos/video1.mp4" },
  { id:"karaoke",  fam:"clip", name:"Karaoke",  mood:"Word by word colour flip",     price:39,  credits:1, days:3, bg:"bg-slate", cap:"karaoke", text:"<b>Read this now</b>", pro:true, cat:["popular","dynamic"], shortform:true, preview:"./assets/videos/video4.mp4" },

  // Motion
  { id:"signal",   fam:"motion", name:"Signal", mood:"Motion graphics on your cut", price:120, credits:3, days:4, bg:"bg-motion", cap:"glow", text:"LEVEL UP", extra:"shape", cat:["dynamic","neon"], shortform:true, preview:"./assets/videos/video3.mp4" },
  { id:"ledger",   fam:"motion", name:"Ledger", mood:"Data, charts and numbers",    price:140, credits:3, days:4, bg:"bg-grid",   cap:"line", text:"3x faster", extra:"bars", cat:["dynamic","faceless"], shortform:true, preview:"./assets/videos/video2.mp4" },
  { id:"promo",    fam:"motion", name:"Promo",  mood:"Ad and VSL treatment",        price:190, credits:4, days:5, bg:"bg-warm",   cap:"box",  text:"<b>Built</b> to convert", tag:"Ads", pro:true, cat:["bold","dynamic","ads","vsl"], shortform:true, preview:"./assets/videos/video1.mp4" },
  { id:"neon",     fam:"motion", name:"Neon",   mood:"Glow captions, night look",   price:130, credits:3, days:4, bg:"bg-ink",    cap:"glow", text:"after dark", extra:"scan", badge:"new", cat:["neon","wild"], shortform:true, preview:"./assets/videos/video3.mp4" },
  { id:"reel",     fam:"motion", name:"Faceless", mood:"Voiceover, B roll, big text",price:110,credits:2, days:4, bg:"bg-grid",  cap:"box",  text:"<b>watch this</b>", cat:["faceless","content"], shortform:true, preview:"./assets/videos/video4.mp4" },
  { id:"hookad",   fam:"motion", name:"Hook",   mood:"Scroll stopping ad opener",   price:160, credits:3, days:4, bg:"bg-warm",   cap:"word", text:"<b>Wait</b> <b>for</b> <b>it</b>", tag:"Ads", badge:"trend", cat:["ads","bold","wild"], shortform:true, preview:"./assets/videos/video1.mp4" },

  // Built (no footage)
  { id:"twin",     fam:"built", name:"Twin",    mood:"Your AI avatar, any script",  price:49,  credits:1, days:3, bg:"bg-ink",   cap:"word", text:"<b>No</b> <b>camera</b> <b>needed</b>", tag:"Avatar", badge:"trend", build:190, kind:"avatar", cat:["nofootage"], preview:"./assets/videos/video2.mp4" },
  { id:"explain",  fam:"built", name:"Explain", mood:"Animated explainer, 60 seconds",price:1200,credits:16, days:12, bg:"bg-motion", cap:"glow", text:"How it works", extra:"orbit", tag:"Animation", pro:true, kind:"explainer", call:true, cat:["nofootage","dynamic"], preview:"./assets/videos/video3.mp4" },
  { id:"film",     fam:"built", name:"Film",    mood:"Generated cinematic, per shot",price:390,credits:6, days:7, bg:"bg-bloom", cap:"serif", text:"begin", extra:"scan", tag:"Gen AI", badge:"new", kind:"genai", call:true, cat:["nofootage","neon"], preview:"./assets/videos/video4.mp4" }
];

const MADE_TYPES = [
  { style:"twin",    title:"Avatar",     desc:"Your face, any script",   sample:"Avatar samples", fx:["twin","stage","pulse"] },
  { style:"explain", title:"Explainer",  desc:"Animated, from an idea",  sample:"Our explainers", fx:["explain","signal","ledger"] },
  { style:"film",    title:"Gen AI film",desc:"Cinematic, from a script",sample:"Our films",      fx:["film","neon","quiet"] }
];
