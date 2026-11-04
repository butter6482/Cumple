/* Director de escenas, interacciones y audio. Contenido y textos: config.js */
(function () {
  "use strict";
  var cfg = window.BIRTHDAY_CONFIG;
  var FX = window.FX || { init: noop, setScene: noop, confetti: noop, burst: noop, wish: noop, trail: noop };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function noop() {}

  /* ---------- Config → DOM ---------- */
  Object.keys(cfg.colors).forEach(function (k) {
    document.documentElement.style.setProperty("--" + k.replace(/[A-Z]/g, function (m) { return "-" + m.toLowerCase(); }), cfg.colors[k]);
  });
  $$("[data-text]").forEach(function (el) {
    var v = cfg.text[el.getAttribute("data-text")];
    if (v != null) el.textContent = v;
  });
  $("#letter-text").textContent = cfg.letter;

  /* ---------- Lirios SVG (original) ---------- */
  var OUTER = "M0,0 C-24,-16 -28,-60 0,-94 C28,-60 24,-16 0,0Z";
  var INNER = "M0,0 C-17,-18 -19,-60 0,-86 C19,-60 17,-18 0,0Z";
  function lilySVG(variant) {
    var white = variant === "white";
    var fill = white ? "url(#g-petal-white)" : "url(#g-petal-pink)";
    var rib = white ? "rgba(160,190,140,.45)" : "rgba(200,60,110,.35)";
    var petals = "";
    [0, 120, 240, 60, 180, 300].forEach(function (a, i) {
      var d = i < 3 ? OUTER : INNER;
      var freckles = white ? "" :
        '<circle cx="-4" cy="-22" r="1.6" fill="#c2406f" opacity=".55"/><circle cx="5" cy="-30" r="1.3" fill="#c2406f" opacity=".5"/><circle cx="-2" cy="-36" r="1.1" fill="#c2406f" opacity=".45"/>';
      petals += '<g transform="rotate(' + a + ')"><g class="petal" style="--d:' + (i * 0.12).toFixed(2) + 's">' +
        '<path d="' + d + '" fill="' + fill + '"/>' +
        '<path d="' + d + '" fill="url(#g-sheen)"/>' +
        '<path d="M0,-8 Q3,-46 0,-78" fill="none" stroke="' + rib + '" stroke-width="1.6" stroke-linecap="round"/>' +
        freckles + "</g></g>";
    });
    var stamens = "";
    for (var i = 0; i < 6; i++) {
      var ang = -150 + i * 60 + 30;
      stamens += '<g transform="rotate(' + ang + ')"><path d="M0,0 Q4,-24 0,-46" fill="none" stroke="#efe0b4" stroke-width="1.5"/>' +
        '<ellipse cx="0" cy="-48" rx="2.6" ry="6" fill="#b5523b"/></g>';
    }
    return '<svg class="lily lily--' + (white ? "white" : "pink") + '" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">' +
      '<circle class="lily-glow" r="70" fill="url(#g-glow)"/>' +
      '<g class="petals">' + petals + "</g>" +
      '<g class="lily-center"><circle r="7" fill="' + (white ? "#cfe3b8" : "#f4b6c9") + '"/>' + stamens +
      '<path d="M0,0 Q-3,-30 3,-56" fill="none" stroke="#b7cf8f" stroke-width="2.4"/><circle cx="3" cy="-58" r="4" fill="#e48aa6"/></g></svg>';
  }
  function flowerHTML(f) {
    var dx = f.dx || 0;
    var stem = "M50 300 C " + (50 - dx * 0.4) + " 220 " + (50 + dx * 0.6) + " 120 " + (50 + dx) + " 14";
    var side = f.leaf || 1;
    var leaf = "M50 230 C " + (50 - 34 * side) + " 210 " + (50 - 44 * side) + " 172 " + (50 - 36 * side) + " 150 C " + (50 - 26 * side) + " 182 " + (50 - 12 * side) + " 204 50 218 Z";
    return '<div class="flower" style="--x:' + f.x + "%;--h:" + f.h + "%;--s:" + f.s + ";--delay:" + f.delay + "s;--tilt:" + f.tilt + 'deg">' +
      '<svg class="stem" viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true"><path class="stem-path" pathLength="1" d="' + stem + '"/><path class="leaf" d="' + leaf + '"/></svg>' +
      '<div class="flower-head">' + lilySVG(f.white ? "white" : "pink") + "</div></div>";
  }
  $$("[data-lily]").forEach(function (el) {
    var v = el.getAttribute("data-lily");
    el.innerHTML = lilySVG(v === "white" ? "white" : "pink");
    el.classList.add(v === "seal" ? "is-static" : "is-open");
  });

  $("#garden").innerHTML = [
    { x: 9, h: 46, s: 0.8, delay: 0.5, tilt: -14, dx: -4, white: true, leaf: 1 },
    { x: 24, h: 62, s: 1, delay: 0.1, tilt: -6, dx: 3, leaf: -1 },
    { x: 40, h: 50, s: 0.85, delay: 0.8, tilt: 4, dx: -2, white: true, leaf: 1 },
    { x: 56, h: 70, s: 1.1, delay: 0.3, tilt: -3, dx: 2, leaf: -1 },
    { x: 72, h: 54, s: 0.9, delay: 0.6, tilt: 8, dx: 4, white: true, leaf: 1 },
    { x: 88, h: 64, s: 1, delay: 0.2, tilt: 12, dx: -3, leaf: -1 },
    { x: 33, h: 34, s: 0.7, delay: 1.1, tilt: -10, dx: 2, leaf: 1 },
    { x: 80, h: 36, s: 0.7, delay: 1.2, tilt: 10, dx: -2, white: true, leaf: -1 }
  ].map(flowerHTML).join("");

  $("#bouquet").innerHTML = [
    { x: 20, h: 60, s: 0.85, delay: 0.6, tilt: -20, dx: -6, white: true, leaf: 1 },
    { x: 36, h: 80, s: 1, delay: 0.3, tilt: -9, dx: -3, leaf: 1 },
    { x: 50, h: 94, s: 1.12, delay: 0, tilt: 0, dx: 0, white: false, leaf: -1 },
    { x: 64, h: 78, s: 1, delay: 0.45, tilt: 9, dx: 3, white: true, leaf: -1 },
    { x: 80, h: 58, s: 0.85, delay: 0.75, tilt: 20, dx: 6, leaf: -1 }
  ].map(flowerHTML).join("");

  $("#frame").innerHTML = ["pink", "white", "white", "pink"].map(function (v, i) {
    return '<div class="frame-lily fl-' + (i + 1) + '" style="--delay:' + (0.2 + i * 0.25) + 's">' + lilySVG(v) + "</div>";
  }).join("");

  $("#glow-lilies").innerHTML = ["white", "pink", "white"].map(function (v, i) {
    return '<div class="glow-lily" style="--delay:' + (0.6 + i * 0.4) + 's">' + lilySVG(v) + "</div>";
  }).join("");

  // Título letra a letra
  var bt = $("#bday-title");
  var title = bt.textContent;
  bt.setAttribute("aria-label", title);
  bt.innerHTML = "";
  var ci = 0;
  // Una línea por frase: "Happy Birthday," / "Amanda!"
  title.replace(/,\s+/, ",\n").split("\n").forEach(function (word) {
    var w = document.createElement("span");
    w.className = "word";
    w.setAttribute("aria-hidden", "true");
    Array.from(word).forEach(function (ch) {
      var s = document.createElement("span");
      s.className = ch === " " ? "ch sp" : "ch";
      s.style.setProperty("--i", ci++);
      s.textContent = ch === " " ? " " : ch;
      w.appendChild(s);
    });
    bt.appendChild(w);
  });

  /* ---------- Director de escenas ---------- */
  var order = cfg.scenes.filter(function (n) { return $('[data-scene="' + n + '"]'); });
  var current = null, busy = false, timers = [];
  var progress = $(".progress");
  progress.innerHTML = order.map(function () { return '<span class="dot"></span>'; }).join("");
  $$(".scene").forEach(function (s) { s.inert = true; });

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function sec(name) { return $('.scene[data-scene="' + name + '"]'); }
  function nextOf(name) { var i = order.indexOf(name); return order[i + 1]; }

  function go(name) {
    var next = sec(name);
    if (busy || !next || name === current) return;
    busy = true;
    timers.forEach(clearTimeout); timers = [];
    if (current) { var prev = sec(current); prev.classList.remove("active"); prev.inert = true; }
    next.inert = false;
    next.classList.remove("play");
    void next.offsetWidth;
    next.classList.add("play", "active");
    document.body.setAttribute("data-scene", name);
    current = name;
    if (enter[name]) enter[name](next);
    FX.setScene(name);
    $$(".dot", progress).forEach(function (d, i) { d.classList.toggle("on", order[i] === name); });
    setTimeout(function () { busy = false; }, 1000);
  }

  var enter = {
    birthday: function () { later(function () { FX.confetti(); }, 900); },
    matcha: function (s) {
      var m = $("#matcha");
      m.classList.remove("mixed", "shake");
      m.style.setProperty("--level", 0);
      s.classList.remove("done");
      $("#matcha-sip").textContent = "";
      sips = 0;
    },
    lights: function () { $("#wish-msg").textContent = ""; },
    letter: function (s) {
      $("#envelope").classList.remove("open");
      s.classList.remove("reading");
      var card = $("#letter-card");
      card.classList.remove("show");
      card.hidden = true;
    },
    finale: function () { $("#planted").innerHTML = ""; }
  };

  /* ---------- Audio ---------- */
  var audio = $("#song");
  var controls = $(".audio-controls");
  var btnPlay = $("#btn-play"), btnMute = $("#btn-mute");
  var audioOK = !!(cfg.music && cfg.music.src);
  var userPaused = false, resumeOnShow = false;
  if (audioOK) {
    audio.addEventListener("error", function () { audioOK = false; controls.hidden = true; });
    audio.src = cfg.music.src;
  }
  function setPausedUI(p) {
    btnPlay.classList.toggle("paused", p);
    btnPlay.setAttribute("aria-label", p ? "Reproducir música" : "Pausar música");
  }
  function fadeIn() {
    var target = Math.max(0, Math.min(1, cfg.music.volume || 0.45));
    try { audio.volume = 0; } catch (e) {}
    var t0 = performance.now();
    (function step(t) {
      var k = Math.min(1, (t - t0) / 2200);
      try { audio.volume = target * k; } catch (e) {}
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function play() {
    if (!audioOK) return;
    var p;
    try { p = audio.play(); } catch (e) { setPausedUI(true); return; }
    controls.hidden = false;
    setPausedUI(false);
    if (p && p.then) p.then(fadeIn, function () { setPausedUI(true); });
    else fadeIn();
  }
  btnPlay.addEventListener("click", function () {
    if (audio.paused) { userPaused = false; play(); }
    else { userPaused = true; audio.pause(); setPausedUI(true); }
  });
  btnMute.addEventListener("click", function () {
    audio.muted = !audio.muted;
    btnMute.setAttribute("aria-pressed", String(audio.muted));
    btnMute.setAttribute("aria-label", audio.muted ? "Activar sonido" : "Silenciar música");
  });
  document.addEventListener("visibilitychange", function () {
    if (!audioOK) return;
    if (document.hidden) { resumeOnShow = !audio.paused; audio.pause(); }
    else if (resumeOnShow && !userPaused) { audio.play().catch(noop); }
  });

  /* ---------- Acciones ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]");
    if (!b) return;
    var a = b.getAttribute("data-action");
    if (a === "start") { play(); go(nextOf("intro")); }
    else if (a === "next") go(nextOf(current));
    else if (a === "replay") go(order[order.indexOf("intro") + 1] || order[0]);
    else if (a === "postcard") postcard(b);
  });

  // Matcha
  var sips = 0;
  var matcha = $("#matcha");
  matcha.addEventListener("click", function () {
    var r = matcha.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height * 0.3);
    matcha.classList.remove("shake"); void matcha.offsetWidth; matcha.classList.add("shake");
    var scene = sec("matcha");
    if (!matcha.classList.contains("mixed")) {
      matcha.classList.add("mixed");
      scene.classList.add("done");
      return;
    }
    var texts = cfg.text.matchaSips;
    sips = (sips % texts.length) + 1;
    matcha.style.setProperty("--level", sips === texts.length ? 0 : sips);
    var sip = $("#matcha-sip");
    sip.textContent = texts[sips - 1];
    sip.classList.remove("bump"); void sip.offsetWidth; sip.classList.add("bump");
  });

  // Deseo
  $("#wish-btn").addEventListener("click", function (e) {
    var r = e.currentTarget.getBoundingClientRect();
    FX.wish(r.left + r.width / 2, r.top);
    $("#wish-msg").textContent = cfg.text.wishSent;
  });

  // Sobre
  var env = $("#envelope");
  function openEnvelope() {
    if (env.classList.contains("open")) return;
    env.classList.add("open");
    var r = env.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, ["#e8c27a", "#f7c6d3", "#fff8ee"]);
    later(function () {
      sec("letter").classList.add("reading");
      var card = $("#letter-card");
      card.hidden = false;
      requestAnimationFrame(function () { card.classList.add("show"); });
      var paper = $(".letter-paper");
      paper.setAttribute("tabindex", "-1");
      paper.focus({ preventScroll: true });
    }, reduced ? 300 : 1100);
  }
  env.addEventListener("click", openEnvelope);
  env.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
  });

  // Destellos al tocar + plantar lirios
  var stage = $("#stage");
  document.addEventListener("pointermove", function (e) { FX.trail(e.clientX, e.clientY); }, { passive: true });
  stage.addEventListener("pointerdown", function (e) {
    FX.trail(e.clientX, e.clientY);
    if (current !== "finale" || e.target.closest("button, a")) return;
    var planted = $("#planted");
    if (planted.children.length >= 30) planted.removeChild(planted.firstChild);
    var d = document.createElement("div");
    d.className = "planted-lily is-open";
    d.style.left = e.clientX + "px";
    d.style.top = e.clientY + "px";
    d.innerHTML = lilySVG(Math.random() < 0.5 ? "white" : "pink");
    planted.appendChild(d);
  });

  /* ---------- Postal descargable ---------- */
  function petalPath(ctx, d, grad) { ctx.fillStyle = grad; ctx.fill(new Path2D(d)); }
  function drawLily(ctx, x, y, s, white) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 110);
    glow.addColorStop(0, "rgba(255,236,200,.85)"); glow.addColorStop(1, "rgba(255,213,154,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 2); ctx.fill();
    [0, 120, 240, 60, 180, 300].forEach(function (a, i) {
      ctx.save(); ctx.rotate(a * Math.PI / 180);
      var g = ctx.createLinearGradient(0, 0, 0, -92);
      if (white) { g.addColorStop(0, "#cfe3b8"); g.addColorStop(0.3, "#fbe6ee"); g.addColorStop(1, "#ffffff"); }
      else { g.addColorStop(0, "#d9487c"); g.addColorStop(0.45, "#f4a3bf"); g.addColorStop(0.85, "#fde3ec"); g.addColorStop(1, "#fff7f9"); }
      petalPath(ctx, i < 3 ? OUTER : INNER, g);
      ctx.restore();
    });
    ctx.strokeStyle = "#efe0b4"; ctx.lineWidth = 1.5; ctx.fillStyle = "#b5523b";
    for (var i = 0; i < 6; i++) {
      ctx.save(); ctx.rotate((-120 + i * 60) * Math.PI / 180);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -24, 0, -46); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -48, 2.6, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  function postcard(btn) {
    btn.disabled = true;
    var fonts = document.fonts ? Promise.all([
      document.fonts.load('120px "Parisienne"'),
      document.fonts.load('italic 500 50px "Cormorant Garamond"')
    ]).catch(noop) : Promise.resolve();
    fonts.then(function () {
      var W = 1080, H = 1350, c = document.createElement("canvas");
      c.width = W; c.height = H;
      var ctx = c.getContext("2d");
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#fff8ee"); bg.addColorStop(0.55, "#f8e0e8"); bg.addColorStop(1, "#f3c3d2");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      var rg = ctx.createRadialGradient(W / 2, 520, 0, W / 2, 520, 620);
      rg.addColorStop(0, "rgba(255,226,170,.55)"); rg.addColorStop(1, "rgba(255,226,170,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < 90; i++) {
        ctx.fillStyle = i % 3 ? "rgba(232,194,122,.8)" : "rgba(255,255,255,.9)";
        ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 0.6, 0, Math.PI * 2); ctx.fill();
      }
      drawLily(ctx, 330, 600, 1.7, true);
      drawLily(ctx, 750, 620, 1.7, true);
      drawLily(ctx, 540, 500, 2.5, false);
      ctx.textAlign = "center";
      ctx.fillStyle = "#c9557d";
      ctx.font = '130px "Parisienne", cursive';
      ctx.fillText("Happy Birthday,", W / 2, 960);
      ctx.fillText(cfg.name, W / 2, 1100);
      ctx.fillStyle = "#5a3446";
      ctx.font = 'italic 500 50px "Cormorant Garamond", serif';
      ctx.fillText("Feliz cumpleaños, " + cfg.fullName + ".", W / 2, 1210);
      ctx.strokeStyle = "rgba(232,194,122,.9)"; ctx.lineWidth = 3;
      ctx.strokeRect(36, 36, W - 72, H - 72);
      c.toBlob(function (blob) {
        btn.disabled = false;
        if (!blob) return;
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "amanda-cumpleanos.png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, "image/png");
    });
  }

  /* ---------- Inicio + bloqueo por fecha ---------- */
  FX.init($("#fx"));
  var b = cfg.birthday || {};
  var unlockAt = new Date(b.year, (b.month || 1) - 1, b.day || 1).getTime();
  var preview = /[?&]preview=1\b/.test(location.search);
  if (b.enabled && !preview && Date.now() < unlockAt) {
    go("gate");
    var cd = $("#countdown");
    var tick = function () {
      var ms = unlockAt - Date.now();
      if (ms <= 0) { clearInterval(iv); busy = false; go("intro"); return; }
      var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      cd.textContent = [h, m, s % 60].map(function (n) { return String(n).padStart(2, "0"); }).join(":");
    };
    var iv = setInterval(tick, 1000);
    tick();
  } else {
    go("intro");
  }
})();
