(() => {
"use strict";

/* ============================================================
   2. UTILITIES
   ============================================================ */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const byId = id => GAMES.find(g => g.id === id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// Titles carry a couple of pre-escaped entities; strip for plain-text use.
const plain = s => String(s).replace(/&amp;/g,"&");

function fmtPlays(n){
  if(n >= 1e6) return (n/1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/,"") + "M";
  if(n >= 1e3) return Math.round(n/1e3) + "K";
  return String(n);
}

// Deterministic PRNG so a game's generated art never changes between loads.
function rng(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h,16777619); }
  return () => {
    h += 0x6D2B79F5; let t = h;
    t = Math.imul(t ^ t>>>15, t|1);
    t ^= t + Math.imul(t ^ t>>>7, t|61);
    return ((t ^ t>>>14) >>> 0) / 4294967296;
  };
}

const store = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

let favorites = new Set(store.get("tajinn:favs", []));
let recent    = store.get("tajinn:recent", []);

const saveFavs   = () => store.set("tajinn:favs", [...favorites]);
const saveRecent = () => store.set("tajinn:recent", recent);

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1900);
}

/* ============================================================
   3. BRAND MARK
   Original cartoon spice-bottle mascot, drawn from scratch:
   green cap, speckled chili body, dark label carrying a
   chili-bolt monogram. Defined once as a <symbol>, reused
   everywhere via <use> so there are no duplicate IDs.
   ============================================================ */
function buildDefs(){
  const r = rng("tajinn-speckle");
  let speck = "";
  for(let i=0;i<58;i++){
    const x = 28 + r()*64, y = 90 + r()*98, s = .9 + r()*2.1;
    const tone = r();
    const fill = tone > .68 ? "#FFD9A8" : tone > .34 ? "#B02A16" : "#7E1A0E";
    speck += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="${fill}" opacity="${(.35+r()*.5).toFixed(2)}"/>`;
  }

  $("#defs").innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tjCap" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#7CFF5E"/><stop offset=".5" stop-color="#28D62B"/><stop offset="1" stop-color="#0B8A17"/>
      </linearGradient>
      <linearGradient id="tjBody" x1=".1" y1="0" x2=".9" y2="1">
        <stop offset="0" stop-color="#FF9B4D"/><stop offset=".45" stop-color="#F0512A"/><stop offset="1" stop-color="#A82115"/>
      </linearGradient>
      <linearGradient id="tjBand" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FF8A3D"/><stop offset="1" stop-color="#C82B1E"/>
      </linearGradient>
      <clipPath id="tjClip">
        <path d="M44 42h32v14c0 4.5 2.4 6.6 6.6 9.6C90.6 71.4 95 80.6 95 90.5V176c0 8.8-7.2 16-16 16H41c-8.8 0-16-7.2-16-16V90.5c0-9.9 4.4-19.1 12.4-24.9C41.6 62.6 44 60.5 44 56z"/>
      </clipPath>
    </defs>

    <symbol id="tj-mark" viewBox="0 0 120 200">
      <g stroke="#0A0A0A" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round">
        <!-- cap -->
        <rect x="39" y="6" width="42" height="40" rx="9" fill="url(#tjCap)"/>
        <path d="M48 14v24M60 14v24M72 14v24" stroke="#0A0A0A" stroke-width="2.6" opacity=".5"/>
        <rect x="70" y="16" width="9" height="12" rx="3" fill="#B6FF9E" stroke="none" opacity=".55"/>

        <!-- neck + body -->
        <path d="M44 42h32v14c0 4.5 2.4 6.6 6.6 9.6C90.6 71.4 95 80.6 95 90.5V176c0 8.8-7.2 16-16 16H41c-8.8 0-16-7.2-16-16V90.5c0-9.9 4.4-19.1 12.4-24.9C41.6 62.6 44 60.5 44 56z" fill="url(#tjBody)"/>

        <g clip-path="url(#tjClip)" stroke="none">
          ${speck}
          <!-- gloss -->
          <path d="M36 84c-3 8-4 18-4 26v70h9V108c0-9 1-17 4-24z" fill="#FFFFFF" opacity=".26"/>
          <path d="M86 92v84h6V92z" fill="#000000" opacity=".2"/>
        </g>

        <!-- collar bands -->
        <rect x="25" y="88" width="70" height="15" rx="5" fill="url(#tjBand)"/>
        <rect x="25" y="163" width="70" height="15" rx="5" fill="url(#tjBand)"/>

        <!-- label -->
        <rect x="27" y="108" width="66" height="52" rx="7" fill="#0A1A0C"/>

        <!-- chili-bolt monogram -->
        <g stroke="none">
          <path d="M64 114l-19 26h11l-6 18 21-27H60z" fill="#39FF14"/>
          <path d="M64 114c3-5 8-6 11-3-4 0-6 2-7 5z" fill="#28D62B"/>
          <circle cx="36" cy="152" r="2.6" fill="#39FF14" opacity=".65"/>
          <circle cx="84" cy="118" r="2.6" fill="#39FF14" opacity=".65"/>
          <circle cx="84" cy="150" r="1.9" fill="#A8E831" opacity=".5"/>
        </g>
      </g>
    </symbol>
  </svg>`;
}

const markHTML = (cls = "") =>
  `<svg class="mark tilt ${cls}" viewBox="0 0 120 200" role="img" aria-label="Project Tajinn"><use href="#tj-mark"/></svg>`;

/* ============================================================
   4. THUMBNAIL GENERATOR
   Every "screenshot" is generated SVG art, seeded from the
   game id — no external images, no borrowed artwork, and the
   same game always renders the same tile.
   ============================================================ */
const PALETTES = {
  Racing:     ["#FF5E3A","#FFB020"],
  Action:     ["#FF2D55","#FF7A45"],
  Arcade:     ["#39FF14","#0BE3A0"],
  Adventure:  ["#37D3FF","#4C6FFF"],
  Puzzle:     ["#B15CFF","#FF5CD6"],
  Sports:     ["#FFC93C","#FF7A45"],
  Strategy:   ["#4C6FFF","#37D3FF"],
  Horror:     ["#FF3B3B","#8A1020"],
  Simulation: ["#2EE6A8","#12A0C8"],
  Platformer: ["#FFA23A","#FF4D6D"],
  Casual:     ["#7CF6A0","#39FF14"]
};

function pattern(kind, a, b, r){
  const W = 320, H = 200;
  switch(kind){
    case "grid":{ // perspective floor
      let p = "";
      for(let i=0;i<=14;i++){
        const x = i/14, sx = W*x;
        p += `<line x1="${sx}" y1="${H}" x2="${W*0.5 + (x-0.5)*W*0.22}" y2="${H*0.42}" stroke="${a}" stroke-width="1" opacity=".38"/>`;
      }
      for(let i=1;i<=8;i++){
        const t = Math.pow(i/8, 2.1), y = H*0.42 + (H*0.58)*t;
        p += `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}" stroke="${a}" stroke-width="1" opacity="${(.16+t*.4).toFixed(2)}"/>`;
      }
      return p;
    }
    case "stars":{
      let p = "";
      for(let i=0;i<70;i++){
        p += `<circle cx="${(r()*W).toFixed(1)}" cy="${(r()*H).toFixed(1)}" r="${(r()*1.4+.35).toFixed(2)}" fill="${r()>.7?b:a}" opacity="${(.25+r()*.7).toFixed(2)}"/>`;
      }
      return p;
    }
    case "hex":{
      let p = "";
      for(let row=0;row<6;row++) for(let col=0;col<9;col++){
        const x = col*40 + (row%2?20:0), y = row*36;
        p += `<path d="M${x} ${y+10}l10-6 10 6v12l-10 6-10-6z" fill="none" stroke="${a}" stroke-width="1" opacity="${(.1+r()*.4).toFixed(2)}"/>`;
      }
      return p;
    }
    case "chevron":{
      let p = "";
      for(let i=-2;i<11;i++){
        p += `<path d="M${i*34} ${H} L${i*34+52} 0 L${i*34+72} 0 L${i*34+20} ${H}z" fill="${i%2?a:b}" opacity="${(.07 + Math.abs(i%3)*.05).toFixed(2)}"/>`;
      }
      return p;
    }
    case "waves":{
      let p = "";
      for(let i=0;i<6;i++){
        const y = 40 + i*28, amp = 8 + r()*16;
        p += `<path d="M0 ${y} Q80 ${y-amp} 160 ${y} T320 ${y}" fill="none" stroke="${i%2?a:b}" stroke-width="1.4" opacity="${(.18+r()*.4).toFixed(2)}"/>`;
      }
      return p;
    }
    case "blocks":{
      let p = "";
      for(let i=0;i<26;i++){
        const s = 12 + r()*38;
        p += `<rect x="${(r()*W).toFixed(1)}" y="${(r()*H).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="2" fill="${r()>.5?a:b}" opacity="${(.07+r()*.24).toFixed(2)}"/>`;
      }
      return p;
    }
    case "circuit":{
      let p = "";
      for(let i=0;i<16;i++){
        const x = (r()*W)|0, y = (r()*H)|0, len = 26+r()*70, dir = r()>.5;
        const x2 = dir ? x+len : x, y2 = dir ? y : y+len;
        p += `<path d="M${x} ${y} L${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="${a}" stroke-width="1.2" opacity=".32" fill="none"/>`;
        p += `<circle cx="${x2.toFixed(0)}" cy="${y2.toFixed(0)}" r="2.4" fill="${b}" opacity=".6"/>`;
      }
      return p;
    }
    default:{ // rings
      let p = "";
      for(let i=0;i<7;i++){
        p += `<circle cx="${(60+r()*200).toFixed(0)}" cy="${(40+r()*120).toFixed(0)}" r="${(16+r()*62).toFixed(0)}" fill="none" stroke="${i%2?a:b}" stroke-width="1.3" opacity="${(.14+r()*.34).toFixed(2)}"/>`;
      }
      return p;
    }
  }
}

function glyph(kind, color, r){
  const cx = 160, cy = 100;
  switch(kind){
    case 0: return `<path d="M${cx} ${cy-38} L${cx+34} ${cy+26} L${cx-34} ${cy+26}z" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`;
    case 1: return `<circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="${color}" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="13" fill="${color}"/>`;
    case 2: return `<rect x="${cx-30}" y="${cy-30}" width="60" height="60" rx="8" fill="none" stroke="${color}" stroke-width="4" transform="rotate(45 ${cx} ${cy})"/>`;
    case 3: return `<path d="M${cx+8} ${cy-40} L${cx-24} ${cy+6} L${cx-2} ${cy+6} L${cx-8} ${cy+42} L${cx+26} ${cy-6} L${cx+3} ${cy-6}z" fill="${color}"/>`;
    case 4: return `<path d="M${cx-32} ${cy+20} L${cx} ${cy-26} L${cx+32} ${cy+20}" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M${cx-32} ${cy+34} L${cx+32} ${cy+34}" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>`;
    case 5: return `<path d="M${cx} ${cy-38} l33 19v38l-33 19-33-19v-38z" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`;
    case 6: return `<path d="M${cx-34} ${cy} h68 M${cx} ${cy-34} v68" stroke="${color}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="${color}" stroke-width="4"/>`;
    default:return `<path d="M${cx-36} ${cy+14} q18 -34 36 0 t36 0" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/><path d="M${cx-36} ${cy-16} q18 -34 36 0 t36 0" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  }
}

const thumbCache = new Map();

function thumb(game){
  if(thumbCache.has(game.id)) return thumbCache.get(game.id);

  const r = rng(game.id);
  const [a,b] = PALETTES[game.category] || PALETTES.Arcade;
  const kinds = ["grid","stars","hex","chevron","waves","blocks","circuit","rings"];
  const kind  = kinds[Math.floor(r()*kinds.length)];
  const gi    = Math.floor(r()*8);
  const ang   = Math.floor(r()*90) + 130;
  const uid   = "t" + game.id.replace(/[^a-z0-9]/g,"");

  const svg = `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="${uid}g" gradientTransform="rotate(${ang} .5 .5)">
        <stop offset="0" stop-color="#05100A"/>
        <stop offset=".55" stop-color="#040A08"/>
        <stop offset="1" stop-color="#020604"/>
      </linearGradient>
      <radialGradient id="${uid}h" cx="${(28+r()*44).toFixed(0)}%" cy="${(22+r()*40).toFixed(0)}%" r="72%">
        <stop offset="0" stop-color="${a}" stop-opacity=".42"/>
        <stop offset=".55" stop-color="${b}" stop-opacity=".12"/>
        <stop offset="1" stop-color="${b}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${uid}v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".62"/>
      </linearGradient>
    </defs>
    <rect width="320" height="200" fill="url(#${uid}g)"/>
    <rect width="320" height="200" fill="url(#${uid}h)"/>
    <g>${pattern(kind, a, b, r)}</g>
    <g opacity=".9" filter="none">${glyph(gi, a, r)}</g>
    <rect width="320" height="200" fill="url(#${uid}v)"/>
  </svg>`;

  thumbCache.set(game.id, svg);
  return svg;
}

/* ============================================================
   5. COMPONENTS
   ============================================================ */
const ICON = {
  play:  `<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>`,
  star:  `<svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75L6.8 19.6l1-5.8-4.2-4.1 5.8-.85z"/></svg>`,
  eye:   `<svg viewBox="0 0 24 24" stroke-linecap="round"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
  back:  `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  dice:  `<svg viewBox="0 0 24 24" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  discord:`<svg viewBox="0 0 24 24"><path d="M19.3 5.4A16.7 16.7 0 0 0 15.1 4l-.2.4a12.6 12.6 0 0 1 3.7 1.9 15.9 15.9 0 0 0-13.3 0A12.7 12.7 0 0 1 9.1 4.4L8.9 4a16.6 16.6 0 0 0-4.2 1.4C2 9.4 1.3 13.3 1.6 17.1A16.8 16.8 0 0 0 6.7 19.7l1-1.7a11 11 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 11.2 0l.4.3a11 11 0 0 1-1.7.8l1 1.7a16.7 16.7 0 0 0 5.1-2.6c.4-4.4-.7-8.3-3.1-12zM8.7 14.7c-1 0-1.8-.9-1.8-2.1s.8-2.1 1.8-2.1 1.9.9 1.8 2.1-.8 2.1-1.8 2.1zm6.6 0c-1 0-1.8-.9-1.8-2.1s.8-2.1 1.8-2.1 1.9.9 1.8 2.1-.8 2.1-1.8 2.1z"/></svg>`
};

function cardHTML(g, i = 0, opts = {}){
  const fav = favorites.has(g.id);
  const badge = g.isNew
    ? `<span class="badge">New</span>`
    : (g.playCount > 1200000 ? `<span class="badge hot">Hot</span>` : "");

  // Rank is only passed where ordering actually means something.
  const rank = opts.rank
    ? `<span class="rank">${String(opts.rank).padStart(2,"0")}</span>` : "";

  return `
  <article class="card ${opts.rank ? "ranked" : ""}" style="animation-delay:${Math.min(i,11)*36}ms">
    ${badge}${rank}
    <button class="star ${fav?"on":""}" data-fav="${g.id}"
            aria-label="${fav?"Remove":"Add"} ${esc(plain(g.title))} ${fav?"from":"to"} favorites"
            aria-pressed="${fav}">${ICON.star}</button>
    <a href="#/game/${g.id}" aria-label="Open ${esc(plain(g.title))}">
      <div class="shot">
        ${thumb(g)}
        <div class="veil"><span class="play-now">${ICON.play} Play now</span></div>
      </div>
      <div class="meta">
        <h3>${g.title}</h3>
        <div class="row">
          <span class="cat">${g.category}</span>
          <span class="plays">${ICON.eye} ${fmtPlays(g.playCount)}</span>
        </div>
      </div>
    </a>
  </article>`;
}

const sectionHead = (eyebrow, title, sub, moreHref, moreLabel) => `
  <div class="sect-hd">
    <div>
      <div class="eyebrow">${eyebrow}</div>
      <h2>${title}</h2>
      ${sub ? `<p class="sub">${sub}</p>` : ""}
    </div>
    ${moreHref ? `<a class="link-more" href="${moreHref}">${moreLabel} ${ICON.arrow}</a>` : ""}
  </div>`;

const emptyHTML = (title, msg, btnHref, btnLabel) => `
  <div class="empty">
    ${markHTML()}
    <h3>${title}</h3>
    <p>${msg}</p>
    ${btnHref ? `<a class="btn primary" href="${btnHref}" style="margin-top:8px">${btnLabel}</a>` : ""}
  </div>`;

/* ============================================================
   6. FILTER STATE
   ============================================================ */
const state = { q:"", cat:"All", sort:"popular", shuffle:0 };

function filtered(){
  const q = state.q.trim().toLowerCase();
  let out = GAMES.filter(g => {
    if(state.cat !== "All" && g.category !== state.cat) return false;
    if(!q) return true;
    return plain(g.title).toLowerCase().includes(q)
        || g.category.toLowerCase().includes(q)
        || g.tags.some(t => t.toLowerCase().includes(q));
  });

  if(state.sort === "popular")      out.sort((a,b) => b.playCount - a.playCount);
  else if(state.sort === "newest")  out.sort((a,b) => (b.isNew?1:0) - (a.isNew?1:0) || b.playCount - a.playCount);
  else if(state.sort === "az")      out.sort((a,b) => plain(a.title).localeCompare(plain(b.title)));
  else if(state.sort === "random"){
    const r = rng("shuffle" + state.shuffle);
    out = out.map(g => [r(), g]).sort((x,y) => x[0]-y[0]).map(x => x[1]);
  }
  return out;
}

/* ============================================================
   7. VIEWS
   ============================================================ */
const app = () => $("#app");

function viewHome(){
  const featured = GAMES.filter(g => g.featured);
  const fresh    = [...GAMES].filter(g => g.isNew);
  const popular  = [...GAMES].sort((a,b) => b.playCount - a.playCount).slice(0,10);

  app().innerHTML = `
    <section class="hero" id="hero">
      ${markHTML("lit")}
      <h1 id="hero-title" aria-label="Project Tajinn"></h1>
      <p class="tag after d1">Your games. Your world.</p>
      <p class="kicker after d2">Play &middot; Discover &middot; Escape</p>
      <div class="cta after d3">
        <a class="btn primary lg" href="#/games">${ICON.play} Explore games</a>
        <button class="btn ghost lg" data-random>${ICON.dice} Random game</button>
      </div>
      <div class="hero-fade"></div>
    </section>

    <section class="sect">
      <div class="wrap">
        ${sectionHead("Handpicked", "Featured games", "The ones we'd load first.", "#/games", "All games")}
      </div>
      <div class="rail">${featured.map((g,i) => cardHTML(g,i)).join("")}</div>
    </section>

    <section class="sect">
      <div class="wrap">
        ${sectionHead("Just landed", "New this week", "Fresh additions to the library.", "#/games", "Browse")}
        <div class="grid">${fresh.map((g,i) => cardHTML(g,i)).join("")}</div>
      </div>
    </section>

    <section class="sect">
      <div class="wrap">
        ${sectionHead("Most played", "Popular right now", "What everyone else is doing instead of working.", "#/games", "See all")}
        <div class="grid">${popular.map((g,i) => cardHTML(g,i,{rank:i+1})).join("")}</div>

        <div class="community brackets">
          <div>
            <h3>Join the community</h3>
            <p>Game requests, early builds, and the people who found this place before you did.</p>
          </div>
          <a class="dbtn" href="${DISCORD_URL}">${ICON.discord} Join the community</a>
        </div>
      </div>
    </section>`;

  typeHero();
}

/* Type the wordmark out one character at a time, with an underbar
   cursor riding the write head and parking, still blinking, at the end.
   Every character is in the DOM from the start (just transparent), so
   the line never reflows mid-type. */
function typeHero(){
  const hero = $("#hero"), el = $("#hero-title");
  if(!hero || !el) return;

  const TEXT = "PROJECT TAJINN";

  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    el.innerHTML = [...TEXT].map(c =>
      `<span class="ch on">${c === " " ? "&nbsp;" : c}</span>`).join("");
    el.lastElementChild.classList.add("cur");
    hero.classList.add("typed");
    return;
  }

  el.innerHTML = [...TEXT].map(c =>
    `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join("");

  const chars = [...el.children];
  let i = 0;

  (function step(){
    if(!document.body.contains(el)) return;      // view changed mid-type

    chars.forEach((c,n) => c.classList.toggle("cur", n === i - 1));

    if(i < chars.length){
      chars[i].classList.add("on");
      const ch = TEXT[i];
      i++;
      // Slight pause on the word break so it reads like typing, not a ticker.
      setTimeout(step, ch === " " ? 190 : 52 + Math.random()*58);
    }else{
      chars[chars.length - 1].classList.add("cur");   // cursor parks, keeps blinking
      hero.classList.add("typed");
    }
  })();
}

function viewGames(){
  app().innerHTML = `
    <section class="sect">
      <div class="wrap">
        ${sectionHead("Full library", "All games", `${GAMES.length} titles, no downloads, no sign-up.`, "", "")}
        <div class="controls">
          <div class="cats" id="cats">
            ${CATEGORIES.map(c => `<button class="pill ${c===state.cat?"on":""}" data-cat="${c}">${c}</button>`).join("")}
          </div>
          <div class="sorts" id="sorts">
            ${[["popular","Popular"],["newest","Newest"],["az","A–Z"],["random","Random"]]
              .map(([k,l]) => `<button class="${k===state.sort?"on":""}" data-sort="${k}">${l}</button>`).join("")}
          </div>
        </div>
        <div id="grid-wrap"></div>
      </div>
    </section>`;
  renderGrid();
}

function renderGrid(){
  const wrap = $("#grid-wrap");
  if(!wrap) return;
  const list = filtered();

  if(!list.length){
    wrap.innerHTML = emptyHTML(
      "No games found",
      state.q ? `Nothing matches &ldquo;${esc(state.q)}&rdquo;. Try searching for something else.`
              : "Nothing in this category yet. Try another one.",
      "", "");
    return;
  }

  wrap.innerHTML = `
    <p class="count" style="margin-bottom:18px"><b>${list.length}</b> ${list.length===1?"game":"games"}${state.cat!=="All"?` in ${state.cat}`:""}${state.q?` for “${esc(state.q)}”`:""}</p>
    <div class="grid">${list.map((g,i) => cardHTML(g,i)).join("")}</div>`;
}

function viewCategories(){
  const counts = {};
  GAMES.forEach(g => counts[g.category] = (counts[g.category]||0) + 1);

  app().innerHTML = `
    <section class="sect">
      <div class="wrap">
        ${sectionHead("Browse by type", "Categories", "Pick a lane.", "#/games", "All games")}
        <div class="cat-grid">
          ${CATEGORIES.filter(c => c !== "All").map(c => {
            const [a,b] = PALETTES[c];
            return `<button class="cat-tile" data-gocat="${c}">
              <span class="glow" style="background:radial-gradient(110% 90% at 18% 8%, ${a}2E, transparent 62%), radial-gradient(90% 80% at 96% 100%, ${b}22, transparent 60%)"></span>
              <h3>${c}</h3>
              <span>${counts[c]||0} ${(counts[c]||0)===1?"title":"titles"}</span>
            </button>`;
          }).join("")}
        </div>
      </div>
    </section>`;
}

function viewFavorites(){
  const list = GAMES.filter(g => favorites.has(g.id));
  app().innerHTML = `
    <section class="sect">
      <div class="wrap">
        ${sectionHead("Saved", "Favorites", "Your shortlist, kept on this device.", "#/games", "Find more")}
        ${list.length
          ? `<div class="grid">${list.map((g,i) => cardHTML(g,i)).join("")}</div>`
          : emptyHTML("No favorites yet", "Star a game to save it here. It'll still be here next time you come back.", "#/games", "Browse games")}
      </div>
    </section>`;
}

function viewRecent(){
  const list = recent.map(byId).filter(Boolean);
  app().innerHTML = `
    <section class="sect">
      <div class="wrap">
        ${sectionHead("History", "Recently played", "The last 10 games you opened.", "#/games", "Find more")}
        ${list.length
          ? `<div class="grid">${list.map((g,i) => cardHTML(g,i)).join("")}</div>`
          : emptyHTML("Nothing played yet", "Start exploring Project Tajinn and your history shows up here.", "#/games", "Explore games")}
      </div>
    </section>`;
}

function related(g, n = 6){
  const pool = GAMES.filter(x => x.id !== g.id);
  const score = x =>
    (x.category === g.category ? 10 : 0) +
    x.tags.filter(t => g.tags.includes(t)).length * 3;
  return pool.map(x => [score(x), x])
             .sort((a,b) => b[0]-a[0] || b[1].playCount - a[1].playCount)
             .slice(0,n).map(x => x[1]);
}

function pushRecent(id){
  recent = [id, ...recent.filter(x => x !== id)].slice(0,10);
  saveRecent();
}

function viewGame(id){
  const g = byId(id);
  if(!g) return viewNotFound();
  pushRecent(id);

  const fav = favorites.has(g.id);
  const rel = related(g);

  app().innerHTML = `
    <div class="wrap">
      <a class="crumb" href="#/games">${ICON.back} Back to games</a>

      <section class="detail">
        <div class="hero-shot">${thumb(g)}</div>

        <div class="detail-info">
          <div class="eyebrow">${g.category}${g.isNew?" &middot; New":""}</div>
          <h1>${g.title}</h1>
          <p class="desc">${g.description}</p>

          <div class="stat-row">
            <div class="stat"><b>${fmtPlays(g.playCount)}</b><span>Plays</span></div>
            <div class="stat"><b>${g.category}</b><span>Category</span></div>
            <div class="stat"><b>${g.isNew?"New":"Classic"}</b><span>Status</span></div>
            <div class="stat"><b>Free</b><span>Price</span></div>
          </div>

          <div class="tags">${g.tags.map(t => `<button class="tag-chip" data-gotag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>

          <div class="detail-actions">
            <a class="btn primary lg" href="#/play/${g.id}">${ICON.play} Play game</a>
            <button class="fav-btn ${fav?"on":""}" data-fav="${g.id}" aria-pressed="${fav}">
              ${ICON.star} ${fav?"Saved":"Add to favorites"}
            </button>
          </div>
        </div>
      </section>

      <section class="sect">
        ${sectionHead("More like this", "You might also like", "", "", "")}
        <div class="grid">${rel.map((x,i) => cardHTML(x,i)).join("")}</div>
      </section>
    </div>`;
}

function viewPlay(id){
  const g = byId(id);
  if(!g) return viewNotFound();
  pushRecent(id);

  const rel = related(g, 4);
  const live = g.gameUrl && g.gameUrl !== "COMING_SOON";

  // When a real gameUrl lands in the data, this becomes the actual player.
  const stage = live
    ? `<iframe class="player" src="${esc(g.gameUrl)}" title="${esc(plain(g.title))}" allowfullscreen style="display:block;border:1px solid var(--line)"></iframe>`
    : `<div class="player brackets">
         <div class="sweep"></div>
         <div class="stamp"><i></i> Game preview</div>
         ${markHTML("lit")}
         <h2>Game coming soon</h2>
         <p>This game is currently being prepared for Project Tajinn. It&rsquo;ll be playable right here when it lands.</p>
         <div class="load"><i></i></div>
         <div class="pbtns">
           <a class="btn primary" href="#/games">${ICON.back} Back to games</a>
           <button class="btn ghost" data-random>${ICON.dice} Random game</button>
         </div>
       </div>`;

  app().innerHTML = `
    <div class="wrap">
      <a class="crumb" href="#/game/${g.id}">${ICON.back} ${g.title}</a>

      <section style="padding:20px 0 0">
        ${stage}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:20px 0 0">
          <div>
            <h2 style="font-size:clamp(1.3rem,3.4vw,2rem);text-transform:uppercase;letter-spacing:.02em">${g.title}</h2>
            <p class="count" style="margin-top:6px">${g.category} &middot; <b>${fmtPlays(g.playCount)}</b> plays</p>
          </div>
          <button class="fav-btn ${favorites.has(g.id)?"on":""}" data-fav="${g.id}" aria-pressed="${favorites.has(g.id)}">
            ${ICON.star} ${favorites.has(g.id)?"Saved":"Add to favorites"}
          </button>
        </div>
      </section>

      <section class="sect">
        ${sectionHead("Keep going", "You might also like", "", "", "")}
        <div class="grid">${rel.map((x,i) => cardHTML(x,i)).join("")}</div>
      </section>
    </div>`;
}

function viewNotFound(){
  app().innerHTML = `<div class="wrap">${emptyHTML("Page not found","That link doesn't go anywhere. Let's get you back to the games.","#/games","Browse games")}</div>`;
}

/* ============================================================
   8. ROUTER
   ============================================================ */
const NAV = [
  ["#/","Home"],
  ["#/games","Games"],
  ["#/categories","Categories"],
  ["#/favorites","Favorites"],
  ["#/recent","Recently Played"]
];

function buildNav(){
  const html = NAV.map(([h,l]) => `<a href="${h}">${l}</a>`).join("");
  $("#nav").innerHTML = html;
  $("#drawer").innerHTML = html;
}

function markNav(hash){
  const base = "#/" + (hash.split("/")[1] || "");
  $$("#nav a, #drawer a").forEach(a => {
    a.classList.toggle("on", a.getAttribute("href") === base);
  });
}

function route(){
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//,"").split("/");

  switch(parts[0]){
    case "":            viewHome(); break;
    case "games":       viewGames(); break;
    case "categories":  viewCategories(); break;
    case "favorites":   viewFavorites(); break;
    case "recent":      viewRecent(); break;
    case "game":        viewGame(parts[1]); break;
    case "play":        viewPlay(parts[1]); break;
    default:            viewNotFound();
  }

  markNav(hash);
  closeDrawer();
  window.scrollTo(0,0);
}

function go(hash){ location.hash = hash; }

function randomGame(){
  const g = GAMES[Math.floor(Math.random()*GAMES.length)];
  go("#/play/" + g.id);
}

/* ============================================================
   9. INTERACTIONS
   ============================================================ */
function updateFavCount(){
  const el = $("#fav-count");
  el.textContent = favorites.size;
  el.dataset.n = favorites.size;
}

function toggleFav(id, btn){
  const g = byId(id);
  if(!g) return;

  if(favorites.has(id)){
    favorites.delete(id);
    toast("Removed from favorites");
  }else{
    favorites.add(id);
    toast("Saved to favorites");
  }
  saveFavs();
  updateFavCount();

  // Update every control bound to this game without a full re-render.
  $$(`[data-fav="${CSS.escape(id)}"]`).forEach(el => {
    const on = favorites.has(id);
    el.classList.toggle("on", on);
    el.setAttribute("aria-pressed", String(on));
    if(el.classList.contains("fav-btn")){
      el.innerHTML = `${ICON.star} ${on ? "Saved" : "Add to favorites"}`;
    }else{
      el.setAttribute("aria-label", `${on?"Remove":"Add"} ${plain(g.title)} ${on?"from":"to"} favorites`);
    }
  });

  if(btn && btn.classList.contains("star")){
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
  }

  // Favorites view is a live list — rebuild it when it's on screen.
  if(location.hash.startsWith("#/favorites")) viewFavorites();
}

function closeDrawer(){
  $("#drawer").classList.remove("open");
  $("#burger").setAttribute("aria-expanded","false");
}

document.addEventListener("click", e => {
  const fav = e.target.closest("[data-fav]");
  if(fav){ e.preventDefault(); toggleFav(fav.dataset.fav, fav); return; }

  const rnd = e.target.closest("[data-random]");
  if(rnd){ e.preventDefault(); randomGame(); return; }

  const cat = e.target.closest("[data-cat]");
  if(cat){
    state.cat = cat.dataset.cat;
    $$("#cats .pill").forEach(p => p.classList.toggle("on", p.dataset.cat === state.cat));
    renderGrid();
    return;
  }

  const sort = e.target.closest("[data-sort]");
  if(sort){
    if(sort.dataset.sort === "random" && state.sort === "random") state.shuffle++;
    state.sort = sort.dataset.sort;
    $$("#sorts button").forEach(b => b.classList.toggle("on", b.dataset.sort === state.sort));
    renderGrid();
    return;
  }

  const goCat = e.target.closest("[data-gocat]");
  if(goCat){
    state.cat = goCat.dataset.gocat;
    state.q = "";
    $("#q").value = "";
    go("#/games");
    return;
  }

  const goTag = e.target.closest("[data-gotag]");
  if(goTag){
    state.q = goTag.dataset.gotag;
    state.cat = "All";
    $("#q").value = state.q;
    go("#/games");
    return;
  }

  const burger = e.target.closest("#burger");
  if(burger){
    const d = $("#drawer");
    const open = d.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
    return;
  }
});

// Search drives one shared filter state.
let searchTimer;
$("#q").addEventListener("input", e => {
  state.q = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if(!location.hash.startsWith("#/games")) go("#/games");
    else renderGrid();
  }, 130);
});

document.addEventListener("keydown", e => {
  if(e.key === "/" && document.activeElement !== $("#q")){
    e.preventDefault();
    $("#q").focus();
  }
  if(e.key === "Escape"){
    if($("#drawer").classList.contains("open")) closeDrawer();
    else if(document.activeElement === $("#q")) $("#q").blur();
  }
});

/* ============================================================
   10. HUD READOUTS
   ============================================================ */
function startHUD(){
  const clock = $("#hud-clock"), ping = $("#hud-ping"), batt = $("#hud-batt");

  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  };
  tick();
  setInterval(tick, 20000);

  // Cosmetic readout — drifts like a real latency meter. Makes no
  // network request; swap in a real timing probe here if you ever want one.
  let base = 24;
  const jitter = () => {
    base = Math.max(9, Math.min(120, base + (Math.random()*14 - 7)));
    ping.textContent = Math.round(base) + " ms";
  };
  jitter();
  setInterval(jitter, 4200);

  if(navigator.getBattery){
    navigator.getBattery().then(b => {
      const show = () => batt.textContent = Math.round(b.level*100) + "%";
      show();
      b.addEventListener("levelchange", show);
    }).catch(() => batt.textContent = "100%");
  }
}

/* ============================================================
   12. BOOT
   ============================================================ */
function boot(){
  buildDefs();
  $("#boot-mark").innerHTML = markHTML("lit");
  $("#hdr-mark").innerHTML  = markHTML();
  $("#ftr-mark").innerHTML  = markHTML();
  $("#ftr-discord").href    = DISCORD_URL;
  $("#ftr-stat").textContent = `${GAMES.length} titles · prototype build`;

  buildNav();
  updateFavCount();
  startHUD();
  startBackground();

  // Animate the boot ellipsis, then hand over to the app.
  let n = 0;
  const dots = $("#dots");
  const di = setInterval(() => { n = (n+1)%4; dots.textContent = ".".repeat(n); }, 240);

  route();
  window.addEventListener("hashchange", route);

  setTimeout(() => {
    clearInterval(di);
    $("#boot").classList.add("done");
  }, 1150);
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", boot)
  : boot();

})();
