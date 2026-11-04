/* fx.js — canvas particle effects for Amanda's birthday experience.
   Plain browser JS, no deps. Exposes window.FX only. */
(function () {
  'use strict';

  var CAP = 350;
  var canvas = null, ctx = null, w = 0, h = 0, dpr = 1;
  var running = false, last = 0, time = 0, lastTrail = 0;
  var reduced = false, scene = 'gate';
  var P = [];                      // all live particles
  var SPR = {}, sparkCache = {}, dotCache = {};

  var GATE = ['#e8c27a', '#f3d9a4', '#f7c6d3', '#fff8ee'];
  var PRESETS = {
    gate:     { spark: 45, pal: GATE },
    intro:    { spark: 45, pal: GATE },
    garden:   { petal: 22, spark: 20, pal: ['#fff8ee', '#f7c6d3', '#e8c27a'] },
    birthday: { spark: 60, dust: 30, pal: ['#e8c27a', '#f3d9a4', '#f7c6d3', '#e07a9b'] },
    matcha:   { spark: 25, pal: ['#e8c27a', '#e8c27a', '#f3d9a4', '#fff8ee', '#9dbf8e'] },
    lights:   { light: 55, star: 25, lz: [0.25, 1], reflect: true, pal: GATE },
    letter:   { spark: 25, light: 10, lz: [0.25, 0.5], reflect: true, pal: ['#fff8ee', '#e8c27a', '#f7c6d3', '#b9a7e0'] },
    finale:   { spark: 40, petal: 14, pal: ['#e8c27a', '#f7c6d3', '#fff8ee', '#f3d9a4'] }
  };
  var AMBIENT = ['spark', 'petal', 'light', 'star', 'dust'];
  var CONF = [['#e07a9b', '#c45f80'], ['#f7c6d3', '#e3a9b9'], ['#e8c27a', '#c9a058'],
              ['#f3d9a4', '#d9bb7f'], ['#fff8ee', '#e9dccb']];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function preset() { return PRESETS[scene] || PRESETS.gate; }
  function horizon() { return h * 0.82; }
  function speed() { return reduced ? 0.4 : 1; }
  function isDesktop() { return (window.innerWidth || 0) >= 900; }
  function density() {
    var c = window.BIRTHDAY_CONFIG && window.BIRTHDAY_CONFIG.particles;
    var d = c ? (isDesktop() ? c.desktop : c.mobile) : (isDesktop() ? 1.6 : 1);
    return typeof d === 'number' && d > 0 ? d : 1;
  }
  function rgba(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
    var n = m ? parseInt(m[1], 16) : 0xe8c27a;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function add(p) { if (P.length >= CAP) return null; P.push(p); return p; }

  /* ---------- sprites (pre-rendered once per DPR) ---------- */
  function sprite(sw, sh, fn) {
    var c = document.createElement('canvas');
    c.width = Math.ceil(sw * dpr); c.height = Math.ceil(sh * dpr);
    var g = c.getContext('2d');
    if (!g) return null;
    g.scale(dpr, dpr);
    fn(g, sw, sh);
    return c;
  }
  function radial(g, cx, cy, r, stops) {
    var gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    for (var i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    return gr;
  }
  function getSpark(col) {
    if (sparkCache[col] === undefined) {
      sparkCache[col] = sprite(32, 32, function (g) {
        g.fillStyle = radial(g, 16, 16, 16, [[0, rgba(col, 0.45)], [0.4, rgba(col, 0.12)], [1, rgba(col, 0)]]);
        g.fillRect(0, 0, 32, 32);
        var L = 13, o = 1.2;
        g.beginPath(); g.moveTo(16, 16 - L);
        g.quadraticCurveTo(16 + o, 16 - o, 16 + L, 16);
        g.quadraticCurveTo(16 + o, 16 + o, 16, 16 + L);
        g.quadraticCurveTo(16 - o, 16 + o, 16 - L, 16);
        g.quadraticCurveTo(16 - o, 16 - o, 16, 16 - L);
        g.fillStyle = col; g.fill();
        g.fillStyle = radial(g, 16, 16, 3, [[0, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]);
        g.fillRect(12, 12, 8, 8);
      });
    }
    return sparkCache[col];
  }
  function getDot(col) {
    if (dotCache[col] === undefined) {
      dotCache[col] = sprite(16, 16, function (g) {
        g.fillStyle = radial(g, 8, 8, 8, [[0, rgba(col, 1)], [0.3, rgba(col, 0.6)], [1, rgba(col, 0)]]);
        g.fillRect(0, 0, 16, 16);
      });
    }
    return dotCache[col];
  }
  function petalSprite(c0, c1, c2) {
    return sprite(28, 12, function (g, sw, sh) {
      var gr = g.createLinearGradient(0, 0, sw, 0);
      gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, c2);
      g.beginPath(); g.moveTo(1, sh / 2);
      g.quadraticCurveTo(sw * 0.45, -sh * 0.15, sw - 1, sh / 2);
      g.quadraticCurveTo(sw * 0.45, sh * 1.15, 1, sh / 2);
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(224,122,155,0.25)'; g.lineWidth = 0.6;
      g.beginPath(); g.moveTo(3, sh / 2); g.lineTo(sw * 0.8, sh / 2); g.stroke();
    });
  }
  function buildSprites() {
    sparkCache = {}; dotCache = {};
    SPR.glow = sprite(64, 64, function (g) {
      g.fillStyle = radial(g, 32, 32, 32, [[0, 'rgba(255,213,154,0.9)'], [0.25, 'rgba(255,190,120,0.42)'],
        [0.6, 'rgba(255,170,100,0.1)'], [1, 'rgba(255,170,100,0)']]);
      g.fillRect(0, 0, 64, 64);
    });
    SPR.glowCool = sprite(64, 64, function (g) {
      g.fillStyle = radial(g, 32, 32, 32, [[0, 'rgba(255,214,190,0.8)'], [0.3, 'rgba(205,175,225,0.32)'],
        [1, 'rgba(185,167,224,0)']]);
      g.fillRect(0, 0, 64, 64);
    });
    SPR.body = sprite(24, 34, function (g, sw, sh) {
      var tw = sw * 0.36, bw = sw * 0.46, top = 2, bot = sh - 3, cx = sw / 2;
      g.beginPath();
      g.moveTo(cx - tw, top + 3);
      g.quadraticCurveTo(cx, top - 1, cx + tw, top + 3);
      g.quadraticCurveTo(cx + bw + 1, sh * 0.55, cx + bw, bot - 3);
      g.quadraticCurveTo(cx, bot + 2, cx - bw, bot - 3);
      g.quadraticCurveTo(cx - bw - 1, sh * 0.55, cx - tw, top + 3);
      g.closePath();
      g.fillStyle = radial(g, cx, sh * 0.78, sh * 0.85, [[0, '#fff1c9'], [0.45, '#f6b36b'], [1, '#e98a5c']]);
      g.fill();
      g.fillStyle = radial(g, cx, bot - 2, bw, [[0, 'rgba(255,252,232,1)'], [1, 'rgba(255,241,201,0)']]);
      g.beginPath(); g.ellipse(cx, bot - 2.5, bw * 0.75, 2.4, 0, 0, Math.PI * 2); g.fill();
    });
    SPR.petalPink = petalSprite('#fff8ee', '#f7c6d3', '#e07a9b');
    SPR.petalWhite = petalSprite('#ffffff', '#fff8ee', '#f7c6d3');
  }
  function blit(img, x, y, sw, sh) { if (img) ctx.drawImage(img, x - sw / 2, y - sh / 2, sw, sh); }
  function xf(x, y, r, sx, sy) {
    var c = Math.cos(r), s = Math.sin(r);
    ctx.setTransform(c * sx * dpr, s * sx * dpr, -s * sy * dpr, c * sy * dpr, x * dpr, y * dpr);
  }

  /* ---------- ambient particle resets ---------- */
  function reset(p, initial) {
    var pr = preset();
    p.age = 0; p.ph = rand(0, 6.283);
    if (p.t === 'spark') {
      p.dot = Math.random() < 0.4;
      p.size = p.dot ? rand(4, 8) : rand(10, 22);
      p.col = pick(pr.pal || GATE);
      p.x = rand(0, w); p.y = rand(0, h);
      p.life = rand(3, 7); p.tw = rand(1.5, 3.5);
      p.vx = rand(-6, 6); p.vy = rand(-8, 2);
    } else if (p.t === 'petal') {
      p.white = Math.random() < 0.35;
      p.x = rand(-20, w + 20); p.y = initial ? rand(-h * 0.1, h) : rand(-60, -20);
      p.size = rand(16, 28); p.vy = rand(22, 45); p.vx = rand(-8, 8);
      p.rot = rand(0, 6.283); p.vr = rand(-0.8, 0.8);
      p.flip = rand(0, 6.283); p.vf = rand(1, 2.5);
      p.amp = rand(10, 30); p.sf = rand(0.5, 1.2);
    } else if (p.t === 'light') {
      var lz = pr.lz || [0.25, 0.5];
      p.z = rand(lz[0], lz[1]);
      p.size = rand(10, 34) * p.z; p.vy = rand(8, 26) * p.z;
      p.x = rand(0, w);
      p.y = initial ? rand(h * 0.05, h) : (p.z < 0.5 ? horizon() + rand(-10, 10) : h + rand(20, 60));
      p.age = initial ? 2 : 0;
      p.amp = 6 * p.z; p.sf = rand(0.3, 0.8); p.fs = rand(2, 5);
    } else if (p.t === 'star') {
      p.x = rand(0, w); p.y = rand(0, h * 0.6);
      p.size = rand(1.5, 3.5); p.tw = rand(0.8, 2.2);
    } else if (p.t === 'dust') {
      p.x = rand(0, w); p.y = rand(0, h);
      p.size = rand(2, 4); p.vx = rand(4, 12); p.vy = rand(-4, 4);
    }
  }

  function manage() {
    var pr = preset(), mult = density() * (reduced ? 0.3 : 1), cnt = {}, i, t;
    for (i = 0; i < AMBIENT.length; i++) cnt[AMBIENT[i]] = 0;
    for (i = 0; i < P.length; i++) if (P[i].amb && !P[i].dying) cnt[P[i].t]++;
    for (i = 0; i < AMBIENT.length; i++) {
      t = AMBIENT[i];
      var target = Math.round((pr[t] || 0) * mult);
      if (reduced && t === 'petal') target = 0;
      var diff = target - cnt[t];
      if (diff < 0) {
        for (var j = 0; j < P.length && diff < 0; j++) {
          if (P[j].amb && !P[j].dying && P[j].t === t) { P[j].dying = true; diff++; }
        }
      } else {
        for (var k = 0; k < Math.min(diff, 4); k++) {
          var p = add({ t: t, amb: true, fade: 0, dying: false });
          if (!p) break;
          reset(p, true);
        }
      }
    }
  }

  /* ---------- update ---------- */
  function update(dt) {
    var sp = speed(), j = 0;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (step(p, dt, sp)) P[j++] = p;
    }
    P.length = j;
  }

  function step(p, dt, sp) {
    if (p.amb) {
      p.fade = clamp01(p.fade + (p.dying ? -dt : dt) / 0.8);
      if (p.dying && p.fade <= 0) return false;
    }
    p.age += dt;
    switch (p.t) {
      case 'spark':
        if (p.age >= p.life) reset(p, false);
        p.x += p.vx * dt * sp; p.y += p.vy * dt * sp;
        p.al = Math.sin(Math.PI * p.age / p.life) * (0.6 + 0.4 * Math.sin(time * p.tw + p.ph)) * p.fade;
        return true;
      case 'petal':
        p.y += p.vy * dt * sp;
        p.x += (p.vx + Math.cos(time * p.sf + p.ph) * p.amp) * dt * sp;
        p.rot += p.vr * dt * sp; p.flip += p.vf * dt * sp;
        if (p.y > h + 30) reset(p, false);
        p.al = 0.9 * p.fade;
        return true;
      case 'light':
        p.y -= p.vy * dt * sp;
        p.x += Math.sin(time * p.sf + p.ph) * p.amp * dt;
        if (p.y < -60) reset(p, false);
        p.fl = 0.85 + 0.1 * Math.sin(time * p.fs + p.ph) + 0.05 * Math.sin(time * p.fs * 2.7);
        p.al = (0.45 + 0.55 * p.z) * clamp01(p.age / 1.5) * clamp01((p.y + 40) / (h * 0.25)) * p.fade;
        return true;
      case 'star':
        p.al = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * p.tw + p.ph))) * 0.8 * p.fade;
        return true;
      case 'dust':
        p.x += p.vx * dt * sp; p.y += (p.vy + Math.sin(time * 0.5 + p.ph) * 3) * dt * sp;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        p.al = (0.35 + 0.25 * Math.sin(time * 1.2 + p.ph)) * p.fade;
        return true;
      case 'wish':
        p.y -= p.vy * dt * sp;
        p.x += Math.sin(time * 0.9 + p.ph) * 14 * dt;
        p.trailT -= dt;
        if (p.trailT <= 0) { p.trailT = 0.08; spawnTrail(p.x + rand(-4, 4), p.y + p.size * 0.45); }
        p.fl = 0.9 + 0.1 * Math.sin(time * 4 + p.ph);
        p.al = clamp01(p.age) * clamp01((p.y + 40) / (h * 0.25));
        return p.y > -80;
      case 'tr':
      case 'bp':
        if (p.age >= p.life) return false;
        var k = Math.exp(-3 * dt);
        p.vx *= k; p.vy *= k; p.vy += p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        var r = 1 - p.age / p.life;
        p.al = r * r;
        return true;
      case 'conf':
        p.vy += 520 * dt;
        var drag = Math.exp(-(p.vy > 0 ? 3.2 : 1.1) * dt);
        p.vx *= drag; p.vy *= drag;
        p.x += (p.vx + (p.vy > 0 ? Math.sin(time * p.sf + p.ph) * p.sw : 0)) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt; p.flip += p.vf * dt;
        return !(p.y > h + 40 || p.x < -80 || p.x > w + 80 || p.age > 10);
    }
    return false;
  }

  /* ---------- draw ---------- */
  function drawLight(p, y, sy, glowPass, alphaMul) {
    var a = p.al * alphaMul;
    if (a <= 0.01) return;
    if (glowPass) {
      ctx.globalAlpha = a * p.fl * (p.big ? 0.95 : 0.6);
      var gs = p.size * (p.big ? 4.5 : 3.4);
      blit(p.z < 0.45 ? SPR.glowCool : SPR.glow, p.x, y, gs, gs * sy);
    } else {
      ctx.globalAlpha = a;
      blit(SPR.body, p.x, y, p.size * 0.7, p.size * sy);
    }
  }
  function isLight(p) { return p.t === 'light' || p.t === 'wish'; }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    var i, p, n = P.length;

    for (i = 0; i < n; i++) {
      p = P[i];
      if (p.t === 'star') { ctx.globalAlpha = p.al; blit(getDot('#fff8ee'), p.x, p.y, p.size * 3, p.size * 3); }
    }

    // reflections below the horizon
    if (preset().reflect) {
      var H = horizon();
      ctx.save();
      ctx.beginPath(); ctx.rect(0, H, w, h - H); ctx.clip();
      for (var pass = 0; pass < 2; pass++) {
        ctx.globalCompositeOperation = pass === 0 ? 'lighter' : 'source-over';
        for (i = 0; i < n; i++) {
          p = P[i];
          if (!isLight(p) || p.y >= H) continue;
          var ry = 2 * H - p.y;
          if (ry > h + 60) continue;
          var px = p.x;
          p.x = px + Math.sin(time * 2 + ry * 0.05) * 2;
          drawLight(p, ry, 0.55, pass === 0, 0.22);
          p.x = px;
        }
      }
      ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // light glows (additive), then bodies
    ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < n; i++) if (isLight(P[i])) drawLight(P[i], P[i].y, 1, true, 1);
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < n; i++) if (isLight(P[i])) drawLight(P[i], P[i].y, 1, false, 1);

    for (i = 0; i < n; i++) {
      p = P[i];
      if (p.t === 'dust') { ctx.globalAlpha = p.al; blit(getDot('#e8c27a'), p.x, p.y, p.size * 2.5, p.size * 2.5); }
    }

    // petals
    for (i = 0; i < n; i++) {
      p = P[i];
      if (p.t !== 'petal') continue;
      ctx.globalAlpha = p.al;
      var img = p.white ? SPR.petalWhite : SPR.petalPink;
      xf(p.x, p.y, p.rot, Math.cos(p.flip), 1);
      if (img) ctx.drawImage(img, -p.size / 2, -p.size * 0.22, p.size, p.size * 0.44);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // sparkles, trails, bursts
    for (i = 0; i < n; i++) {
      p = P[i];
      if (p.t !== 'spark' && p.t !== 'tr' && p.t !== 'bp') continue;
      if (p.al <= 0.01) continue;
      ctx.globalAlpha = p.al;
      var sz = p.size * (0.85 + 0.15 * Math.sin(time * 3 + p.ph));
      blit(p.dot ? getDot(p.col) : getSpark(p.col), p.x, p.y, sz, sz);
    }

    // confetti on top
    for (i = 0; i < n; i++) {
      p = P[i];
      if (p.t !== 'conf') continue;
      var cs = Math.cos(p.flip);
      if (cs > -0.08 && cs < 0.08) cs = cs < 0 ? -0.08 : 0.08;
      ctx.globalAlpha = 1;
      ctx.fillStyle = cs >= 0 ? p.c[0] : p.c[1];
      xf(p.x, p.y, p.rot, cs, 1);
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.cw / 2, -p.ch / 2, p.cw, p.ch);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  }

  /* ---------- loop & sizing ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!ctx || document.hidden) { last = now; return; }
    var dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0.016;
    last = now;
    time += dt;
    manage();
    update(dt);
    draw();
  }

  function resize() {
    if (!canvas) return;
    var nd = Math.min(2, window.devicePixelRatio || 1);
    var dprChanged = nd !== dpr || !SPR.glow;
    dpr = nd;
    w = window.innerWidth || canvas.clientWidth || 0;
    h = window.innerHeight || canvas.clientHeight || 0;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dprChanged) buildSprites();
  }

  /* ---------- one-shot effects ---------- */
  function spawnTrail(x, y) {
    add({ t: 'tr', x: x, y: y, vx: rand(-10, 10), vy: rand(-25, -5), g: 0, age: 0, ph: rand(0, 6.283),
          life: rand(0.4, 0.7), size: rand(5, 9), col: Math.random() < 0.6 ? '#e8c27a' : '#f3d9a4' });
  }

  var FX = {
    init: function (el) {
      if (!el || !el.getContext) return;
      if (el !== canvas) {
        var c = el.getContext('2d');
        if (!c) return;
        canvas = el; ctx = c;
        SPR = {};
      }
      resize();
      if (running) return;
      running = true;
      window.addEventListener('resize', resize);
      window.addEventListener('orientationchange', resize);
      document.addEventListener('visibilitychange', function () { last = 0; });
      requestAnimationFrame(frame);
    },
    setScene: function (name) {
      if (PRESETS[name]) scene = name;
    },
    confetti: function () {
      if (reduced || !w) return;
      var n = isDesktop() ? 120 : Math.round(60 * Math.min(density(), 1.3));
      var hs = Math.max(0.7, Math.min(1.4, h / 800)), ws = Math.max(0.5, Math.min(1.2, w / 900));
      for (var i = 0; i < n; i++) {
        var side = i % 2 ? -1 : 1;
        var ang = rand(55, 80) * Math.PI / 180, v = rand(700, 1250) * hs;
        var round = Math.random() < 0.3;
        if (!add({ t: 'conf', x: side > 0 ? rand(-10, 20) : w - rand(-10, 20), y: h + rand(0, 20), age: 0,
          vx: Math.cos(ang) * v * ws * side, vy: -Math.sin(ang) * v,
          rot: rand(0, 6.283), vr: rand(-6, 6), flip: rand(0, 6.283), vf: rand(4, 10),
          sf: rand(2, 4), sw: rand(20, 60), ph: rand(0, 6.283), c: pick(CONF),
          round: round, r: rand(2, 3.5), cw: rand(3, 5), ch: rand(8, 13) })) break;
      }
    },
    burst: function (x, y, colors) {
      var cols = colors && colors.length ? colors : ['#9dbf8e', '#e8c27a', '#fff8ee'];
      var n = reduced ? 6 : 24;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * 6.283 + rand(-0.2, 0.2), s = reduced ? 0 : rand(60, 180);
        if (!add({ t: 'bp', x: x + (reduced ? rand(-12, 12) : 0), y: y + (reduced ? rand(-12, 12) : 0),
          vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: reduced ? 0 : 40, age: 0, ph: rand(0, 6.283),
          life: rand(0.6, 1.1), size: rand(8, 14), col: pick(cols) })) break;
      }
    },
    wish: function (x, y) {
      add({ t: 'wish', big: true, x: x, y: y, z: 1, size: 40, vy: 22, age: 0, ph: rand(0, 6.283),
            trailT: 0, fl: 1, al: 0 });
    },
    trail: function (x, y) {
      if (reduced) return;
      var now = (window.performance && performance.now) ? performance.now() : Date.now();
      if (now - lastTrail < 30) return;
      lastTrail = now;
      spawnTrail(x, y);
      if (Math.random() < 0.5) spawnTrail(x + rand(-6, 6), y + rand(-6, 6));
    },
    setReducedMotion: function (b) { reduced = !!b; }
  };

  try {
    var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq) {
      reduced = !!mq.matches;
      var onChange = function (e) { reduced = !!e.matches; };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  } catch (e) { /* matchMedia unsupported */ }

  window.FX = FX;
})();
