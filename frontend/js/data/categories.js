/* =========================================================
   HEYPITCH STORE - Categories & Families Data
   ========================================================= */

HP_CONFIG.families = [
  { id:"cut",  side:"edit", name:"Cut",    blurb:"Talking head and single camera. Clean, caption led, ready to post.", intake:"footage", cap:"Up to 20 min of source per order" },
  { id:"clip", side:"edit", name:"Clip",   blurb:"Long form to shorts. Podcasts, interviews, webinars, cut into moments.", intake:"footage", cap:"Up to 20 min of source per order" },
  { id:"motion", side:"edit", name:"Motion", blurb:"Branded motion, ads and VSL. Your footage with a design system on top.", intake:"footage", cap:"Up to 20 min of source per order" },
  { id:"built", side:"made", name:"Built",  blurb:"No footage needed. Your avatar, an explainer, or a generated film.", intake:"script", cap:"Script or brief, no upload" }
];

// gallery tabs. featured=curated "For you". ai flag shows the small AI badge.
HP_CONFIG.categories = [
  { id:"foryou",   name:"For you",  desc:"A curated starting set, plus what pairs with it.", ai:false },
  { id:"popular",  name:"Popular",  desc:"The styles clients reach for most, across every category.", ai:true },
  { id:"behind",   name:"Behind the Person", desc:"Big words that sit behind the speaker.", ai:true },
  { id:"bold",     name:"Bold",     desc:"Loud, boxed, impossible to scroll past.", ai:true },
  { id:"clean",    name:"Clean",    desc:"Minimal captions that stay out of the way.", ai:false },
  { id:"editorial",name:"Editorial",desc:"Serif, considered, for founders and experts.", ai:true },
  { id:"dynamic",  name:"Dynamic",  desc:"Motion graphics, data and kinetic type.", ai:false },
  { id:"faceless", name:"Faceless", desc:"No face on camera. Voiceover, B roll and text.", ai:true },
  { id:"ads",      name:"Ads",      desc:"Built to convert. Hooks, offers and captions that sell.", ai:false },
  { id:"vsl",      name:"VSL",      desc:"Long form sales videos that hold attention.", ai:false },
  { id:"neon",     name:"Neon & FX", desc:"Glow, scanlines and generated effects.", ai:false },
  { id:"wild",     name:"Anything wild", desc:"The crazy ones. Bring an idea, we build it.", ai:true },
  { id:"nofootage",name:"No footage", desc:"Made from a script. Avatar, explainer or generated film.", ai:true }
];

HP_CONFIG.foryou = ["pulse","behindbig","moment","stamp","karaoke","promo","quiet","signal"];
