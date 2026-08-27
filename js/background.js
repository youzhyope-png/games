/* ============================================================
   11. ANIMATED BACKGROUND
   Ten layers, drawn back to front:
     starfield (3 parallax depths) · perspective floor · flow field ·
     constellation net · ribbons · ripples · arcs · meteors ·
     sweep beam · wave band
   Counts scale with viewport area. Pauses when the tab is hidden.
   ============================================================ */
function startBackground(){
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce) return;

  const c = document.getElementById("bg-canvas");
  const ctx = c.getContext("2d", {alpha:true});

  let W, H, dpr, t = 0, raf = null;
  let stars = [], flow = [], nodes = [], motes = [];
  let meteors = [], rings = [], arcs = [];
  let nextMeteor = 0, nextRing = 0, nextArc = 0;
  let beam = -0.35;

  const TAU = Math.PI * 2;

  /* The field every flow particle steers by. Three sines at different
     scales, one of them coupled to x+y, which is what stops the whole
     field from resolving into readable stripes. */
  function fieldAngle(x, y){
    return Math.sin(x * 0.0016 + t * 0.34) * 1.7
         + Math.cos(y * 0.0021 - t * 0.27) * 1.7
         + Math.sin((x + y) * 0.0009 + t * 0.15) * 1.25;
  }

  function resetFlow(p, seed){
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.px = p.x; p.py = p.y;
    p.sp = (0.9 + Math.random() * 1.9) * dpr;
    p.life = seed ? Math.random() : 1;
    p.decay = 0.0016 + Math.random() * 0.0028;
    p.w = (0.6 + Math.random() * 1.5) * dpr;
    p.hot = Math.random() < 0.22;
  }

  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = c.width  = Math.floor(innerWidth  * dpr);
    H = c.height = Math.floor(innerHeight * dpr);
    c.style.width  = innerWidth + "px";
    c.style.height = innerHeight + "px";

    // Budget everything off screen area so a phone isn't asked to draw
    // the same particle count as a 1440p monitor.
    const area = (innerWidth * innerHeight) / (1440 * 900);
    const scale = Math.max(0.42, Math.min(1.35, area));

    stars = Array.from({length: Math.round(190 * scale)}, () => {
      const depth = Math.random();
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: ((depth * 1.5) + 0.3) * dpr,
        a: 0.18 + depth * 0.55,
        vx:-(0.04 + depth * 0.30) * dpr,
        vy: (0.012 + depth * 0.06) * dpr,
        tw: Math.random() * TAU,
        ts: 0.6 + Math.random() * 2.2
      };
    });

    flow = Array.from({length: Math.round(150 * scale)}, () => {
      const p = {}; resetFlow(p, true); return p;
    });

    nodes = Array.from({length: Math.round(34 * scale)}, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.9,
      vx:(Math.random() - .5) * 0.42 * dpr,
      vy:(Math.random() - .5) * 0.42 * dpr,
      r:(1.1 + Math.random() * 1.5) * dpr
    }));

    motes = Array.from({length: Math.round(70 * scale)}, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r:(Math.random() * 1.9 + .5) * dpr,
      vy:-(Math.random() * .24 + .06) * dpr,
      vx:(Math.random() - .5) * .07 * dpr,
      a: Math.random() * .55 + .18,
      p: Math.random() * TAU
    }));

    meteors = []; rings = []; arcs = [];
  }

  /* ---- starfield: three depths, parallax drift, independent twinkle ---- */
  function drawStars(){
    for(const s of stars){
      s.x += s.vx; s.y += s.vy; s.tw += 0.02 * s.ts;
      if(s.x < -4) { s.x = W + 4; s.y = Math.random() * H; }
      if(s.y > H + 4){ s.y = -4;  s.x = Math.random() * W; }

      ctx.globalAlpha = s.a * (0.45 + 0.55 * Math.abs(Math.sin(s.tw)));
      ctx.fillStyle = "#B6FFC0";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- perspective floor scrolling toward the viewer ---- */
  function drawFloor(){
    const hz = H * 0.60;
    const vp = W * 0.5;

    ctx.strokeStyle = "rgba(57,255,20,.30)";
    ctx.lineWidth = 1 * dpr;

    for(let i = -16; i <= 16; i++){
      ctx.globalAlpha = 0.20 - Math.abs(i) * 0.009;
      if(ctx.globalAlpha <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(vp + i * (W * 0.075), H);
      ctx.lineTo(vp + i * (W * 0.014), hz);
      ctx.stroke();
    }

    const roll = (t * 0.42) % 1;
    for(let i = 0; i < 14; i++){
      const u = (i + roll) / 14;
      const y = hz + (H - hz) * Math.pow(u, 2.7);
      ctx.globalAlpha = 0.04 + u * 0.30;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- flow field: the main body of movement ---- */
  function drawFlow(){
    ctx.lineCap = "round";
    for(const p of flow){
      p.px = p.x; p.py = p.y;
      const a = fieldAngle(p.x, p.y);
      p.x += Math.cos(a) * p.sp;
      p.y += Math.sin(a) * p.sp;
      p.life -= p.decay;

      if(p.life <= 0 || p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30){
        resetFlow(p, false);
        continue;
      }

      // Fade in and out across the lifetime — no popping at either end.
      const al = Math.sin(p.life * Math.PI) * (p.hot ? 0.55 : 0.30);
      ctx.globalAlpha = al;
      ctx.strokeStyle = p.hot ? "#B6FFC0" : "#39FF14";
      ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- constellation net ---- */
  function drawNet(){
    const link = Math.min(W, H) * 0.19;

    for(const n of nodes){
      n.x += n.vx; n.y += n.vy;
      if(n.x < 0 || n.x > W) n.vx *= -1;
      if(n.y < 0 || n.y > H * 0.92) n.vy *= -1;
    }

    ctx.lineWidth = 1 * dpr;
    for(let i = 0; i < nodes.length; i++){
      for(let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if(d > link) continue;
        ctx.globalAlpha = (1 - d / link) * 0.22;
        ctx.strokeStyle = "#39FF14";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for(const n of nodes){
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#7CF6A0";
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- ribbons ---- */
  function drawRibbons(){
    ctx.lineWidth = 1.3 * dpr;
    for(let i = 0; i < 6; i++){
      const y0  = H * (0.13 + i * 0.145) + Math.sin(t * 0.4 + i * 1.7) * H * 0.045;
      const amp = H * (0.032 + i * 0.010);
      const dir = i % 2 ? -1 : 1;
      ctx.globalAlpha = 0.20 - i * 0.020;
      ctx.strokeStyle = i % 2 ? "#39FF14" : "#7CF6A0";
      ctx.beginPath();
      for(let x = 0; x <= W; x += Math.max(8, 12 * dpr)){
        const y = y0
          + Math.sin(x * 0.0016 + t * (0.55 + i * 0.22) * dir + i) * amp
          + Math.sin(x * 0.0007 - t * 0.35 * dir) * amp * 0.4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- ripples ---- */
  function drawRings(){
    const now = performance.now();
    if(now > nextRing){
      rings.push({
        x: Math.random() * W,
        y: H * (0.12 + Math.random() * 0.62),
        r: 0,
        grow:(1.1 + Math.random() * 1.4) * dpr,
        life: 1
      });
      nextRing = now + 1500 + Math.random() * 2400;
    }
    for(let i = rings.length - 1; i >= 0; i--){
      const g = rings[i];
      g.r += g.grow; g.life -= 0.0045;
      if(g.life <= 0){ rings.splice(i, 1); continue; }
      ctx.globalAlpha = Math.sin(g.life * Math.PI) * 0.30;
      ctx.strokeStyle = "#39FF14";
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- energy arcs ---- */
  function spawnArc(){
    const x1 = Math.random() * W, y1 = Math.random() * H * 0.72;
    const ang = Math.random() * TAU;
    const len = (170 + Math.random() * 300) * dpr;
    const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;

    const nx = -(y2 - y1), ny = (x2 - x1);
    const nl = Math.hypot(nx, ny) || 1;

    const segs = 10, pts = [];
    for(let i = 0; i <= segs; i++){
      const u = i / segs;
      const j = (i === 0 || i === segs) ? 0 : (Math.random() - .5) * 40 * dpr;
      pts.push([x1 + (x2 - x1) * u + nx / nl * j,
                y1 + (y2 - y1) * u + ny / nl * j]);
    }
    arcs.push({pts, life: 1});
  }

  function drawArcs(){
    const now = performance.now();
    if(now > nextArc){
      spawnArc();
      nextArc = now + 3200 + Math.random() * 4800;
    }
    for(let i = arcs.length - 1; i >= 0; i--){
      const a = arcs[i];
      a.life -= 0.045;
      if(a.life <= 0){ arcs.splice(i, 1); continue; }

      // Flicker, because a smoothly fading bolt reads as a shape, not a spark.
      const fl = a.life * (0.55 + Math.random() * 0.45);

      ctx.globalAlpha = fl * 0.30;
      ctx.strokeStyle = "#39FF14";
      ctx.lineWidth = 4 * dpr;
      ctx.beginPath();
      a.pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();

      ctx.globalAlpha = fl * 0.9;
      ctx.strokeStyle = "#DFFFD2";
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      a.pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- meteors ---- */
  function spawnMeteor(){
    const sp  = (8 + Math.random() * 8) * dpr;
    const ang = 0.30 + Math.random() * 0.30;
    meteors.push({
      x: Math.random() * W * 0.85 - W * 0.18,
      y:-30 * dpr + Math.random() * H * 0.42,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      len:(150 + Math.random() * 220) * dpr,
      w:(1.2 + Math.random() * 1.4) * dpr,
      life: 1,
      decay: 0.006 + Math.random() * 0.006
    });
  }

  function drawMeteors(){
    const now = performance.now();
    if(now > nextMeteor){
      spawnMeteor();
      if(Math.random() < 0.35) setTimeout(spawnMeteor, 160 + Math.random() * 300);
      nextMeteor = now + 1400 + Math.random() * 2400;
    }

    for(let i = meteors.length - 1; i >= 0; i--){
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= m.decay;

      if(m.life <= 0 || m.x - m.len > W || m.y - m.len > H){
        meteors.splice(i, 1);
        continue;
      }

      const sp = Math.hypot(m.vx, m.vy) || 1;
      const tx = m.x - (m.vx / sp) * m.len;
      const ty = m.y - (m.vy / sp) * m.len;
      const a  = Math.sin(Math.min(1, m.life) * Math.PI) * 0.95;

      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0,    "rgba(214,255,200," + a.toFixed(3) + ")");
      g.addColorStop(0.18, "rgba(57,255,20,"   + (a * 0.78).toFixed(3) + ")");
      g.addColorStop(1,    "rgba(57,255,20,0)");

      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = m.w;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke();

      ctx.globalAlpha = a;
      ctx.fillStyle = "#EFFFE6";
      ctx.beginPath(); ctx.arc(m.x, m.y, m.w * 1.2, 0, TAU); ctx.fill();

      ctx.globalAlpha = a * 0.30;
      ctx.fillStyle = "#39FF14";
      ctx.beginPath(); ctx.arc(m.x, m.y, m.w * 4.6, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- motes ---- */
  function drawMotes(){
    for(const m of motes){
      m.y += m.vy;
      m.x += m.vx + Math.sin(t * 1.6 + m.p) * .16 * dpr;
      if(m.y < -12){ m.y = H + 12; m.x = Math.random() * W; }
      if(m.x < -12) m.x = W + 12;
      if(m.x > W + 12) m.x = -12;

      ctx.globalAlpha = m.a * (0.55 + 0.45 * Math.sin(t * 2.2 + m.p));
      ctx.fillStyle = "#39FF14";
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- sweep beam: one slow pass of light down the viewport ---- */
  function drawBeam(){
    beam += 0.0019;
    if(beam > 1.5) beam = -0.45 - Math.random() * 0.7;

    const by = beam * H;
    const half = 190 * dpr;
    const g = ctx.createLinearGradient(0, by - half, 0, by + half);
    g.addColorStop(0,   "rgba(57,255,20,0)");
    g.addColorStop(0.5, "rgba(57,255,20,.075)");
    g.addColorStop(1,   "rgba(57,255,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, by - half, W, half * 2);
  }

  /* ---- wave band ---- */
  function drawWaves(){
    const layers = [
      {y:.79, amp:.036, k:.0013, sp: .24, fill:"rgba(7,61,11,.34)",   crest:"rgba(57,255,20,.30)"},
      {y:.86, amp:.028, k:.0019, sp:-.33, fill:"rgba(11,107,22,.30)", crest:"rgba(57,255,20,.42)"},
      {y:.92, amp:.021, k:.0026, sp: .45, fill:"rgba(25,214,43,.20)", crest:"rgba(57,255,20,.55)"},
      {y:.97, amp:.014, k:.0034, sp:-.58, fill:"rgba(57,255,20,.13)", crest:"rgba(150,255,120,.55)"}
    ];
    const step = Math.max(6, 10 * dpr);

    for(const L of layers){
      const base = H * L.y, amp = H * L.amp;
      const pts = [];
      for(let x = 0; x <= W + step; x += step){
        const y = base
          + Math.sin(x * L.k        + t * L.sp * 9)   * amp
          + Math.sin(x * L.k * 0.43 - t * L.sp * 5.5) * amp * 0.55
          + Math.sin(x * L.k * 2.1  + t * L.sp * 13)  * amp * 0.18;
        pts.push([x, y]);
      }

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for(const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = L.fill; ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for(const [x, y] of pts) ctx.lineTo(x, y);
      ctx.strokeStyle = L.crest; ctx.lineWidth = 1.4 * dpr; ctx.stroke();
    }
  }

  function frame(){
    t += .006;
    ctx.clearRect(0, 0, W, H);

    drawStars();
    drawFloor();
    drawFlow();
    drawNet();
    drawRibbons();
    drawRings();
    drawArcs();
    drawMeteors();
    drawMotes();
    drawBeam();
    drawWaves();

    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function play(){ if(!raf) raf = requestAnimationFrame(frame); }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf = null; } }

  size();
  const now0 = performance.now();
  nextMeteor = now0 + 900;
  nextRing   = now0 + 600;
  nextArc    = now0 + 2600;
  play();

  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(size, 180); });
  // A backgrounded tab shouldn't bank up a burst of events to fire on return.
  document.addEventListener("visibilitychange", () => {
    if(document.hidden){ stop(); }
    else {
      const n = performance.now();
      nextMeteor = n + 700; nextRing = n + 400; nextArc = n + 1800;
      play();
    }
  });
}

