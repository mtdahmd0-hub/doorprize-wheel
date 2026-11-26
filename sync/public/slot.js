// 3-reel gala slot machine animation, chasing marquee bulbs, and live winner grid.
(function (global) {
  var LOOP = 12;
  var CSS =
    ".slot-wrap{position:relative;width:min(100%,720px);margin:0 auto;text-align:center}" +
    ".slot-crown{display:inline-flex;align-items:center;gap:10px;padding:6px 22px 8px;margin-bottom:-6px;border-radius:14px 14px 0 0;background:linear-gradient(180deg,#ffe58f,#ffc928 45%,#b97f14);color:#4a0610;font:900 .85rem/1 var(--ui,sans-serif);letter-spacing:.22em;text-transform:uppercase;box-shadow:0 -4px 20px rgba(255,201,40,.45);position:relative;z-index:2}" +
    ".slot-crown b{font-size:1.15rem;color:#8f0d1c;text-shadow:0 1px 0 rgba(255,255,255,.65)}" +
    ".slot-bezel{position:relative;padding:6px;border-radius:22px;background:linear-gradient(145deg,#fff1b8,#ffc928 28%,#9c660e 65%,#ffe28a);box-shadow:0 24px 60px rgba(2,12,38,.75),0 0 36px rgba(255,201,40,.22)}" +
    ".slot-frame{position:relative;padding:18px 16px;border-radius:17px;background:radial-gradient(120% 90% at 50% 0%,#c81e32,#6a0714 70%,#47030b);box-shadow:inset 0 2px 6px rgba(255,220,160,.35),inset 0 -6px 16px rgba(0,0,0,.65)}" +
    ".slot-bulbs{display:flex;justify-content:space-between;padding:0 10px;pointer-events:none}" +
    ".slot-bulbs.top{margin-bottom:10px}.slot-bulbs.bot{margin-top:10px}" +
    ".slot-bulb{width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffbe6,#ffd24d 55%,#9e6b10);box-shadow:0 0 6px rgba(255,215,90,.65);opacity:.45;transition:opacity .12s,transform .12s}" +
    ".slot-wrap.is-spinning .slot-bulb,.slot-wrap.is-won .slot-bulb{animation:bulbTwinkle .55s steps(2,end) infinite}" +
    ".slot-bulb:nth-child(even){animation-delay:.27s!important}" +
    ".slot-wrap.is-won .slot-bulb{animation-duration:.28s!important;box-shadow:0 0 12px #ffe680}" +
    ".slot-reels{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:8px;border-radius:12px;background:linear-gradient(180deg,#0f0509,#220a12);box-shadow:inset 0 6px 16px rgba(0,0,0,.9),0 0 0 2px rgba(255,201,40,.45)}" +
    ".reel{position:relative;height:216px;overflow:hidden;border-radius:9px;background:linear-gradient(180deg,#3d4450 0%,#bac3cf 15%,#ffffff 48%,#cfd7e2 84%,#353c47 100%);box-shadow:inset 0 20px 22px rgba(0,0,0,.52),inset 0 -20px 22px rgba(0,0,0,.52),inset 0 0 0 2px #8a94a6}" +
    ".reel::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 25%,rgba(255,255,255,.32) 48%,transparent 65%);opacity:.45}" +
    ".reel.spinning .reel-item{filter:blur(.55px)}" +
    ".reel.locked{box-shadow:inset 0 18px 20px rgba(0,0,0,.35),inset 0 -18px 20px rgba(0,0,0,.35),inset 0 0 0 3px #ffc928,0 0 20px rgba(255,201,40,.65)}" +
    ".reel.locked .reel-track{animation:reelBounce .28s cubic-bezier(.2,1.6,.4,1)}" +
    ".reel.locked::after{animation:reelSheen .45s ease-out}" +
    ".reel-track{will-change:transform}" +
    ".reel-item{height:72px;display:flex;align-items:center;justify-content:center;padding:0 10px;font-family:var(--ui,Montserrat,sans-serif);font-weight:800;font-size:clamp(.82rem,1.38vw,1.06rem);line-height:1.15;color:#12254d;text-transform:uppercase;text-align:center;overflow-wrap:anywhere;border-bottom:1px solid rgba(10,30,70,.12)}" +
    ".reel.locked .reel-item.mid{color:#9e0b1a;font-size:clamp(.92rem,1.55vw,1.2rem);text-shadow:0 1px 0 #fff,0 0 12px rgba(255,201,40,.45)}" +
    ".slot-line{position:absolute;left:14px;right:14px;top:calc(50% - 36px);height:72px;border-top:2px solid rgba(255,212,72,.92);border-bottom:2px solid rgba(255,212,72,.92);background:linear-gradient(90deg,rgba(255,201,40,.14),rgba(255,255,255,.1),rgba(255,201,40,.14));pointer-events:none;border-radius:6px;box-shadow:0 0 18px rgba(255,201,40,.25)}" +
    ".slot-line::before,.slot-line::after{content:'';position:absolute;top:50%;translate:0 -50%;border:9px solid transparent}" +
    ".slot-line::before{left:-4px;border-left:12px solid #ffc928}.slot-line::after{right:-4px;border-right:12px solid #ffc928}" +
    ".slot-sparks{position:absolute;inset:-10px;pointer-events:none;overflow:visible;z-index:4}" +
    ".slot-spark{position:absolute;left:50%;top:42%;width:10px;height:10px;border-radius:2px;animation:sparkFly .95s cubic-bezier(.15,.85,.3,1) forwards}" +
    ".slot-live{margin-top:18px;text-align:center}" +
    ".slot-head{display:inline-block;margin:0 0 12px;padding:6px 18px;border-radius:999px;background:rgba(6,29,71,.78);border:1px solid rgba(255,201,40,.6);font-weight:800;font-size:.92rem;color:#ffd95a;letter-spacing:.1em;text-transform:uppercase;box-shadow:0 6px 18px rgba(3,16,46,.4)}" +
    ".slot-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,205px),1fr));gap:10px;text-align:left}" +
    ".slot-card{display:flex;align-items:baseline;gap:10px;padding:10px 14px;border-radius:12px;background:linear-gradient(135deg,rgba(8,36,90,.92),rgba(13,53,119,.86));border:1px solid rgba(255,201,40,.58);border-left:4px solid #ffc928;box-shadow:0 8px 20px rgba(2,14,42,.45);animation:slotPop .34s cubic-bezier(.2,1.5,.35,1) both}" +
    ".slot-card .no{font:800 .76rem var(--ui,sans-serif);color:#ffc928;font-variant-numeric:tabular-nums;flex:none;letter-spacing:.05em}" +
    ".slot-card .nm{font:800 .98rem/1.2 var(--ui,sans-serif);color:#ffffff;text-transform:uppercase;overflow-wrap:anywhere}" +
    "@keyframes bulbTwinkle{0%{opacity:.35;transform:scale(.88)}100%{opacity:1;transform:scale(1.18)}}" +
    "@keyframes reelBounce{0%{transform:translateY(-8px)}55%{transform:translateY(5px)}100%{transform:translateY(0)}}" +
    "@keyframes reelSheen{from{opacity:.9;transform:translateY(-40%)}to{opacity:.45;transform:translateY(40%)}}" +
    "@keyframes slotPop{from{opacity:0;transform:scale(.76) translateY(-10px)}to{opacity:1;transform:scale(1) translateY(0)}}" +
    "@keyframes sparkFly{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0deg)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(.2) rotate(var(--rot))}}" +
    "@media (max-width:560px){.reel{height:168px}.reel-item{height:56px}.slot-line{top:calc(50% - 28px);height:56px}}";

  function pad(n) { return String(n).padStart(3, "0"); }
  function injectCss() {
    if (document.getElementById("slot-css")) return;
    var s = document.createElement("style"); s.id = "slot-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  function bulbsHtml(cls) {
    return '<div class="slot-bulbs ' + cls + '" aria-hidden="true">' + '<span class="slot-bulb"></span>'.repeat(14) + "</div>";
  }
  function ensure(el) {
    injectCss();
    if (el._slot) return el._slot;
    el.innerHTML =
      '<div class="slot-wrap">' +
      '<div class="slot-crown" aria-hidden="true"><b>★</b><span>DOORPRIZE</span><b>★</b></div>' +
      '<div class="slot-bezel"><div class="slot-frame">' +
      bulbsHtml("top") +
      '<div class="slot-reels">' + '<div class="reel"><div class="reel-track"></div></div>'.repeat(3) + "</div>" +
      '<div class="slot-line" aria-hidden="true"></div>' +
      bulbsHtml("bot") +
      '</div></div><div class="slot-sparks" aria-hidden="true"></div>' +
      '<div class="slot-live" hidden><p class="slot-head"></p><div class="slot-grid"></div></div>' +
      "</div>";
    var reels = Array.prototype.slice.call(el.querySelectorAll(".reel")).map(function (r, idx) {
      var t = r.querySelector(".reel-track");
      for (var i = 0; i < LOOP + 3; i++) {
        var d = document.createElement("div"); d.className = "reel-item" + (i === 1 ? " mid" : "");
        t.appendChild(d);
      }
      return { el: r, track: t, y: idx * 72, speed: 1.15 + idx * 0.14, locked: true };
    });
    el._slot = {
      wrap: el.querySelector(".slot-wrap"), reels: reels, sparks: el.querySelector(".slot-sparks"),
      live: el.querySelector(".slot-live"), head: el.querySelector(".slot-head"),
      grid: el.querySelector(".slot-grid"), active: false
    };
    return el._slot;
  }
  function fillTrack(track, names, offset) {
    var src = names && names.length ? names : ["DOORPRIZE"];
    for (var i = 0; i < LOOP + 3; i++) track.children[i].textContent = src[(i % LOOP + offset) % src.length];
  }
  function lockReel(r, name, pool) {
    var src = pool && pool.length ? pool : [name];
    r.locked = true; r.el.classList.remove("spinning"); r.el.classList.remove("locked");
    r.el.offsetWidth; r.el.classList.add("locked");
    r.track.children[0].textContent = src[Math.floor(Math.random() * src.length)];
    r.track.children[1].textContent = name;
    r.track.children[2].textContent = src[Math.floor(Math.random() * src.length)];
    r.track.style.transform = "translate3d(0,0,0)";
  }
  function burst(sparksEl) {
    var cols = ["#ffc928", "#7fdcff", "#ffffff", "#ff6b6b", "#ffd95a"];
    sparksEl.innerHTML = "";
    for (var i = 0; i < 24; i++) {
      var sp = document.createElement("span"), a = (i / 24) * Math.PI * 2 + Math.random() * 0.25, d = 120 + Math.random() * 190;
      sp.className = "slot-spark";
      sp.style.background = cols[i % cols.length];
      sp.style.setProperty("--tx", Math.round(Math.cos(a) * d) + "px");
      sp.style.setProperty("--ty", Math.round(Math.sin(a) * d - 40) + "px");
      sp.style.setProperty("--rot", Math.round((Math.random() - 0.5) * 540) + "deg");
      sparksEl.appendChild(sp);
    }
    setTimeout(function () { sparksEl.innerHTML = ""; }, 1050);
  }
  function setNames(el, names) {
    var st = ensure(el); if (st.active) return;
    st.wrap.classList.remove("is-spinning", "is-won");
    st.reels.forEach(function (r, idx) {
      r.el.classList.remove("locked", "spinning");
      fillTrack(r.track, names, idx * 3);
      r.track.style.transform = "translate3d(0,0,0)";
    });
  }
  function spin(el, opts) {
    var st = ensure(el), pool = opts.pool && opts.pool.length ? opts.pool : opts.winners;
    var winners = opts.winners || [], startNo = opts.startNo || 1, prize = opts.prize || "";
    st.active = true; st.live.hidden = false; st.grid.innerHTML = "";
    st.wrap.classList.remove("is-won"); st.wrap.classList.add("is-spinning");
    st.head.textContent = (prize ? prize + " · " : "") + winners.length + " Pemenang";
    st.reels.forEach(function (r, idx) {
      r.locked = false; r.el.classList.remove("locked"); r.el.classList.add("spinning"); r.y = 0;
      fillTrack(r.track, pool, idx * 4);
    });
    if (opts.onStart) opts.onStart();
    var n = winners.length, events = [];
    if (n === 1) {
      var d0 = opts.reduced ? 80 : 1600, gap = opts.reduced ? 50 : 650;
      [0, 1, 2].forEach(function (ri, idx) { events.push({ t: d0 + idx * gap, type: "lock", reel: ri, name: winners[0], step: idx }); });
      events.push({ t: d0 + 2 * gap + (opts.reduced ? 40 : 420), type: "card", idx: 0 });
    } else {
      var spinMs = opts.reduced ? 40 : (n <= 5 ? 850 : n <= 10 ? 620 : 460);
      var holdMs = opts.reduced ? 40 : (n <= 5 ? 580 : n <= 10 ? 440 : 340);
      var t = opts.reduced ? 80 : 1450;
      for (var k = 0; k < n; k++) {
        var ri = k % 3;
        events.push({ t: t, type: "lock", reel: ri, name: winners[k], step: k });
        events.push({ t: t + Math.round(holdMs * 0.55), type: "card", idx: k });
        if (k < n - 3) events.push({ t: t + holdMs, type: "unlock", reel: ri });
        t += holdMs + spinMs;
      }
      if (n === 2) events.push({ t: t - spinMs + 260, type: "lock", reel: 2, name: winners[1], step: 2 });
    }
    events.sort(function (a, b) { return a.t - b.t; });
    var t0 = performance.now(), prev = t0, ei = 0, lastT = events.length ? events[events.length - 1].t : 0, lastRoll = 0;
    function addCard(idx) {
      var c = document.createElement("div"); c.className = "slot-card";
      c.innerHTML = '<span class="no">No. ' + pad(startNo + idx) + '</span><span class="nm"></span>';
      c.querySelector(".nm").textContent = winners[idx];
      st.grid.appendChild(c);
    }
    (function frame(now) {
      var elapsed = now - t0, dt = Math.min(48, now - prev); prev = now;
      while (ei < events.length && elapsed >= events[ei].t) {
        var ev = events[ei++];
        if (ev.type === "unlock") {
          st.reels[ev.reel].locked = false;
          st.reels[ev.reel].el.classList.remove("locked");
          st.reels[ev.reel].el.classList.add("spinning");
          fillTrack(st.reels[ev.reel].track, pool, ei);
        } else if (ev.type === "lock") {
          lockReel(st.reels[ev.reel], ev.name, pool);
          if (opts.onTick) opts.onTick(ev.step);
        } else if (ev.type === "card") {
          addCard(ev.idx);
        }
      }
      var rowH = st.reels[0].track.children[0].offsetHeight || 72, loopH = LOOP * rowH, anySpin = false;
      st.reels.forEach(function (r) {
        if (r.locked) return;
        anySpin = true;
        r.y = (r.y + r.speed * dt) % loopH;
        r.track.style.transform = "translate3d(0," + (-r.y) + "px,0)";
      });
      if (anySpin && opts.onRoll && elapsed - lastRoll >= 78) { lastRoll = elapsed; opts.onRoll(); }
      if (elapsed < lastT + (opts.reduced ? 60 : 520)) requestAnimationFrame(frame);
      else {
        st.active = false;
        st.wrap.classList.remove("is-spinning"); st.wrap.classList.add("is-won");
        if (!opts.reduced) burst(st.sparks);
        if (opts.onDone) opts.onDone();
      }
    })(t0);
  }
  injectCss();
  global.SlotMachine = { setNames: setNames, spin: spin };
})(window);
