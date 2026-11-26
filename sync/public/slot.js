// 3-reel slot machine drum animation and live winner grid.
(function (global) {
  var LOOP = 12;
  var CSS =
    ".slot-wrap{width:min(100%,680px);margin:0 auto;text-align:center}" +
    ".slot-stars{display:flex;justify-content:center;gap:14px;margin-bottom:6px;color:#ffc928;font-size:1.35rem;text-shadow:0 0 12px rgba(255,201,40,.85)}" +
    ".slot-stars span:nth-child(3){font-size:1.75rem;translate:0 -3px}" +
    ".slot-stars span:nth-child(2),.slot-stars span:nth-child(4){font-size:1.55rem;translate:0 -1px}" +
    ".slot-frame{position:relative;padding:12px;border-radius:16px;background:linear-gradient(180deg,#b71c2b,#6e0814);border:3px solid #ffc928;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),0 18px 40px rgba(2,12,38,.7)}" +
    ".slot-reels{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:6px;border-radius:10px;background:#1a0a10;box-shadow:inset 0 4px 12px rgba(0,0,0,.85)}" +
    ".reel{position:relative;height:210px;overflow:hidden;border-radius:8px;background:linear-gradient(180deg,#48505c 0%,#c5cdd8 16%,#ffffff 48%,#d2dae4 82%,#3f4650 100%);box-shadow:inset 0 16px 18px rgba(0,0,0,.45),inset 0 -16px 18px rgba(0,0,0,.45),inset 0 0 0 2px #7c8594}" +
    ".reel.locked{box-shadow:inset 0 16px 18px rgba(0,0,0,.35),inset 0 -16px 18px rgba(0,0,0,.35),inset 0 0 0 3px #ffc928}" +
    ".reel-track{will-change:transform}" +
    ".reel-item{height:70px;display:flex;align-items:center;justify-content:center;padding:0 8px;font-family:var(--ui,Montserrat,sans-serif);font-weight:800;font-size:clamp(.82rem,1.4vw,1.05rem);line-height:1.15;color:#12254d;text-transform:uppercase;text-align:center;overflow-wrap:anywhere;border-bottom:1px solid rgba(10,30,70,.12)}" +
    ".reel.locked .reel-item.mid{color:#b71c1c;font-size:clamp(.9rem,1.55vw,1.18rem);text-shadow:0 1px 0 rgba(255,255,255,.8)}" +
    ".slot-line{position:absolute;left:12px;right:12px;top:calc(50% - 35px);height:70px;border-top:2px solid rgba(255,201,40,.85);border-bottom:2px solid rgba(255,201,40,.85);background:linear-gradient(90deg,rgba(255,201,40,.08),rgba(255,201,40,.18),rgba(255,201,40,.08));pointer-events:none;border-radius:4px}" +
    ".slot-live{margin-top:16px;text-align:center}" +
    ".slot-head{margin:0 0 10px;font-weight:700;font-size:.95rem;color:#ffc928;letter-spacing:.08em;text-transform:uppercase}" +
    ".slot-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,195px),1fr));gap:9px;text-align:left}" +
    ".slot-card{display:flex;align-items:baseline;gap:9px;padding:9px 12px;border-radius:11px;background:rgba(6,29,71,.78);border:1px solid rgba(255,201,40,.5);animation:slotPop .28s cubic-bezier(.2,1.5,.35,1) both}" +
    ".slot-card .no{font:700 .75rem var(--ui,sans-serif);color:#ffc928;font-variant-numeric:tabular-nums;flex:none}" +
    ".slot-card .nm{font:800 .98rem/1.2 var(--ui,sans-serif);color:#ffffff;text-transform:uppercase;overflow-wrap:anywhere}" +
    "@keyframes slotPop{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}" +
    "@media (max-width:560px){.reel{height:168px}.reel-item{height:56px}.slot-line{top:calc(50% - 28px);height:56px}}";

  function pad(n) { return String(n).padStart(3, "0"); }
  function injectCss() {
    if (document.getElementById("slot-css")) return;
    var s = document.createElement("style"); s.id = "slot-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  function ensure(el) {
    injectCss();
    if (el._slot) return el._slot;
    el.innerHTML =
      '<div class="slot-wrap">' +
      '<div class="slot-stars" aria-hidden="true"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>' +
      '<div class="slot-frame"><div class="slot-reels">' +
      '<div class="reel"><div class="reel-track"></div></div>'.repeat(3) +
      '</div><div class="slot-line" aria-hidden="true"></div></div>' +
      '<div class="slot-live" hidden><p class="slot-head"></p><div class="slot-grid"></div></div>' +
      "</div>";
    var reels = Array.prototype.slice.call(el.querySelectorAll(".reel")).map(function (r, idx) {
      var t = r.querySelector(".reel-track");
      for (var i = 0; i < LOOP + 3; i++) {
        var d = document.createElement("div"); d.className = "reel-item" + (i === 1 ? " mid" : "");
        t.appendChild(d);
      }
      return { el: r, track: t, y: idx * 70, speed: 1.05 + idx * 0.12, locked: true };
    });
    el._slot = { reels: reels, live: el.querySelector(".slot-live"), head: el.querySelector(".slot-head"), grid: el.querySelector(".slot-grid"), active: false };
    return el._slot;
  }
  function fillTrack(track, names, offset) {
    var src = names && names.length ? names : ["DOORPRIZE"];
    for (var i = 0; i < LOOP + 3; i++) track.children[i].textContent = src[(i % LOOP + offset) % src.length];
  }
  function lockReel(r, name, pool) {
    var src = pool && pool.length ? pool : [name];
    r.locked = true; r.el.classList.add("locked");
    r.track.children[0].textContent = src[Math.floor(Math.random() * src.length)];
    r.track.children[1].textContent = name;
    r.track.children[2].textContent = src[Math.floor(Math.random() * src.length)];
    r.track.style.transform = "translate3d(0,0,0)";
  }
  function setNames(el, names) {
    var st = ensure(el); if (st.active) return;
    st.reels.forEach(function (r, idx) {
      r.el.classList.remove("locked");
      fillTrack(r.track, names, idx * 3);
      r.track.style.transform = "translate3d(0,0,0)";
    });
  }
  function spin(el, opts) {
    var st = ensure(el), pool = opts.pool && opts.pool.length ? opts.pool : opts.winners;
    var winners = opts.winners || [], startNo = opts.startNo || 1, prize = opts.prize || "";
    st.active = true; st.live.hidden = false; st.grid.innerHTML = "";
    st.head.textContent = (prize ? prize + " · " : "") + winners.length + " Pemenang";
    st.reels.forEach(function (r, idx) {
      r.locked = false; r.el.classList.remove("locked"); r.y = 0;
      fillTrack(r.track, pool, idx * 4);
    });
    var n = winners.length, step = opts.reduced ? 50 : (n === 1 ? 450 : Math.max(240, Math.min(500, Math.round(4500 / n))));
    var baseDelay = opts.reduced ? 80 : (n === 1 ? 1200 : 520), events = [];
    if (n === 1) {
      [0, 1, 2].forEach(function (ri, idx) { events.push({ t: baseDelay + idx * step, reel: ri, name: winners[0], card: idx === 2 ? 0 : -1 }); });
    } else {
      for (var k = 0; k < n; k++) {
        var t = baseDelay + k * step, ri = k % 3;
        events.push({ t: t, reel: ri, name: winners[k], card: k });
        if (k + 3 < n) events.push({ t: t + Math.round(step * 1.45), unlock: ri });
      }
      if (n === 2) events.push({ t: baseDelay + step + 220, reel: 2, name: winners[1], card: -1 });
    }
    events.sort(function (a, b) { return a.t - b.t; });
    var t0 = performance.now(), prev = t0, ei = 0, lastT = events.length ? events[events.length - 1].t : 0;
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
        if (typeof ev.unlock === "number") {
          st.reels[ev.unlock].locked = false;
          st.reels[ev.unlock].el.classList.remove("locked");
          fillTrack(st.reels[ev.unlock].track, pool, ei);
        } else {
          lockReel(st.reels[ev.reel], ev.name, pool);
          if (opts.onTick) opts.onTick();
          if (ev.card >= 0) addCard(ev.card);
        }
      }
      var rowH = st.reels[0].track.children[0].offsetHeight || 70, loopH = LOOP * rowH;
      st.reels.forEach(function (r) {
        if (r.locked) return;
        r.y = (r.y + r.speed * dt) % loopH;
        r.track.style.transform = "translate3d(0," + (-r.y) + "px,0)";
      });
      if (elapsed < lastT + (opts.reduced ? 60 : 320)) requestAnimationFrame(frame);
      else { st.active = false; if (opts.onDone) opts.onDone(); }
    })(t0);
  }
  global.SlotMachine = { setNames: setNames, spin: spin };
})(window);
