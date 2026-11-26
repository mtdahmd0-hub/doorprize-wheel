// Doorprize sync server: one Durable Object holds the event state so the wheel computer and the
// admin computer see the same data. The server also draws the winner, so the preset queue never
// leaves the server except to signed-in panitia.
import { DurableObject } from "cloudflare:workers";

const DEFAULT_PRIZES = [
  ["Kursi lipat Montec (Azko)", 15],
  ["Voucher Belanja Eiger 200k", 10],
  ["Kipas angin portabel (Azko)", 10],
  ["Picas texas botol vacuum flask (Azko)", 10],
  ["Kompor Culinart (Azko)", 5],
  ["Soleil Sleeping Bag 250 (Azko)", 5],
  ["Blender", 3],
  ["Sleeplite kasur lipat (Azko)", 5],
  ["Oven", 5],
  ["Kris Air Fryer (Azko)", 3],
  ["Xiaomi Strika uap", 3],
  ["Grandprize 3 (Emasku 0.5 gr)", 1],
  ["Grand prize 2 (Emasku 1 gr)", 1],
  ["Grandprize 1 (Emasku 2gr)", 1],
].flatMap(([name, n]) => Array(n).fill(name));

const DEF = { names: ["A", "B", "C", "D", "E"], mode: "random", winners: [], remove: true, log: [], prizes: DEFAULT_PRIZES, anim: "wheel" };
const SESSION_MS = 12 * 3600e3;
const SPIN_GAP_MS = 8000; // longer than one spin animation

// Preset mode: next queued winner still on the wheel; otherwise random. (Same rule as the pages.)
export function pick(names, mode, queue, rand) {
  if (mode === "preset") {
    const low = names.map((x) => x.toLowerCase());
    while (queue.length) { const i = low.indexOf(queue.shift().toLowerCase()); if (i >= 0) return i; }
  }
  return Math.floor(rand() * names.length);
}

// Next prize category starting at `logLen` and how many consecutive draws share that prize.
export function nextBatch(prizes, logLen) {
  const prize = (prizes && prizes[logLen]) || "";
  if (!prize) return { prize: "", count: 1 };
  let count = 1;
  while (prizes[logLen + count] === prize) count++;
  return { prize, count };
}

// Draw `count` distinct winners from `names` (capped by available names); preset consumes queue first, remainder random.
export function pickBatch(names, mode, queue, count, rand) {
  const pool = names.slice(), out = [], n = Math.min(count, pool.length);
  for (let k = 0; k < n; k++) out.push(pool.splice(pick(pool, mode, queue, rand), 1)[0]);
  return out;
}

// Validate an admin patch at the trust boundary; returns null when anything is malformed.
export function clean(x) {
  if (!x || typeof x !== "object") return null;
  const list = (a) => Array.isArray(a) && a.length <= 5000 && a.every((v) => typeof v === "string" && v.length <= 120)
    ? a.map((v) => v.trim()).filter(Boolean) : null;
  const o = {};
  for (const k of ["names", "winners", "log", "prizes"]) if (k in x) { const l = list(x[k]); if (!l) return null; o[k] = l; }
  if ("mode" in x) { if (x.mode !== "random" && x.mode !== "preset") return null; o.mode = x.mode; }
  if ("anim" in x) { if (x.anim !== "wheel" && x.anim !== "slot") return null; o.anim = x.anim; }
  if ("remove" in x) { if (typeof x.remove !== "boolean") return null; o.remove = x.remove; }
  return o;
}

// What the wheel computer may see: everything except the preset winner queue.
export function publicView(s) {
  return { names: s.names, mode: s.mode, remove: s.remove, log: s.log, winners: [], prizes: Array.isArray(s.prizes) ? s.prizes : DEFAULT_PRIZES, anim: s.anim === "slot" ? "slot" : "wheel", v: s.v };
}

async function pbkdf2(password, salt) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, k, 256); // Workers cap: 100k
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sameSecret(a, b) {
  const e = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((v) => crypto.subtle.digest("SHA-256", e.encode(v))));
  return crypto.subtle.timingSafeEqual(x, y);
}

export class Room extends DurableObject {
  async state() {
    const s = Object.assign({}, DEF, { v: 0 }, await this.ctx.storage.get("s"));
    if (!Array.isArray(s.prizes)) s.prizes = DEFAULT_PRIZES.slice();
    if (s.anim !== "wheel" && s.anim !== "slot") s.anim = "wheel";
    return s;
  }

  // Admin password: the ADMIN_PASSWORD secret if one is set; otherwise the panitia create it on the
  // first visit to /admin and only a PBKDF2 hash is stored here.
  // ponytail: first visitor claims it; create it right after deploy. Reset by setting the secret.
  async needsSetup() { return !this.env.ADMIN_PASSWORD && !(await this.ctx.storage.get("pw")); }

  async setup(password) {
    if (!(await this.needsSetup())) return [409, { error: "Password admin sudah dibuat." }];
    if (typeof password !== "string" || password.length < 6 || password.length > 200) return [400, { error: "Password minimal 6 karakter." }];
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await this.ctx.storage.put("pw", { salt: [...salt], hash: await pbkdf2(password, salt) });
    return this.session();
  }

  async checkPassword(password) {
    if (this.env.ADMIN_PASSWORD) return sameSecret(password, this.env.ADMIN_PASSWORD);
    const pw = await this.ctx.storage.get("pw");
    return !!pw && (await sameSecret(await pbkdf2(password, new Uint8Array(pw.salt)), pw.hash));
  }

  async login(password) {
    if (await this.needsSetup()) return [428, { setup: true, error: "Password admin belum dibuat." }];
    const now = Date.now();
    let f = (await this.ctx.storage.get("fail")) || { n: 0, t: 0 };
    if (f.n >= 5 && now - f.t < 60e3) return [429, { error: "Terlalu banyak percobaan. Tunggu 1 menit." }];
    if (typeof password !== "string" || !(await this.checkPassword(password))) {
      f = { n: (now - f.t < 60e3 ? f.n : 0) + 1, t: now };
      await this.ctx.storage.put("fail", f);
      return [401, { error: "Password salah." }];
    }
    this.ctx.storage.delete("fail");
    return this.session();
  }

  async session() {
    const now = Date.now(), sess = (await this.ctx.storage.get("sess")) || {};
    for (const k in sess) if (sess[k] < now) delete sess[k];
    const token = crypto.randomUUID();
    sess[token] = now + SESSION_MS;
    await this.ctx.storage.put("sess", sess);
    return [200, { token }];
  }

  async ok(token) {
    const sess = (await this.ctx.storage.get("sess")) || {};
    return typeof token === "string" && sess[token] > Date.now();
  }

  async getState(token, v) {
    if (!(await this.ok(token))) return [401, { error: "Sesi habis. Masuk lagi." }];
    const s = await this.state();
    return [200, v === s.v ? { same: true } : s];
  }

  async update(token, patch) {
    if (!(await this.ok(token))) return [401, { error: "Sesi habis. Masuk lagi." }];
    const c = clean(patch);
    if (!c) return [400, { error: "Data tidak valid." }];
    const s = Object.assign(await this.state(), c);
    s.v++;
    await this.ctx.storage.put("s", s);
    return [200, s];
  }

  // ---- wheel page: open, no password (panitia's choice). It sees the public view only, so the
  // preset queue never leaves the server, and spins are spaced out so the button can't be hammered.
  // ponytail: anyone with the URL can spin; upgrade path is the earlier link-key gate if that becomes a problem.
  async wheelState(v) {
    const s = await this.state();
    return [200, v === s.v ? { same: true } : publicView(s)];
  }

  async wheelSpin() {
    const now = Date.now(), last = (await this.ctx.storage.get("lastSpin")) || 0;
    if (now - last < SPIN_GAP_MS) return [429, { error: "Tunggu sebentar, roda baru saja diputar." }];
    const [st, r] = await this.draw();
    if (st !== 200) return [st, r];
    await this.ctx.storage.put("lastSpin", now);
    return [200, { name: r.name, names: r.names, prize: r.prize, before: r.before, state: publicView(r.state) }];
  }

  // Draw, record and (optionally) remove the winner(s) in one write.
  async spin(token) {
    if (!(await this.ok(token))) return [401, { error: "Sesi habis. Masuk lagi." }];
    return this.draw();
  }

  async draw() {
    const s = await this.state();
    if (!s.names.length) return [409, { error: "Roda kosong." }];
    const before = s.names.slice(), q = s.winners.slice();
    const { prize, count } = nextBatch(s.prizes, s.log.length);
    const winners = pickBatch(before, s.mode, q, count, Math.random);
    s.winners = q;
    s.log.push(...winners);
    if (s.remove) {
      for (const name of winners) {
        const j = s.names.indexOf(name);
        if (j >= 0) s.names.splice(j, 1);
      }
    }
    s.v++;
    await this.ctx.storage.put("s", s);
    return [200, { name: winners[0], names: winners, prize, before, state: s }];
  }
}

const json = ([status, body]) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    const room = env.ROOM.getByName("event");
    if (p === "/api/ping") return json([200, { cloud: true, setup: await room.needsSetup() }]);
    const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
    const body = req.method === "GET" ? null : await req.json().catch(() => ({}));
    if (p === "/api/login" && req.method === "POST") return json(await room.login(body.password));
    if (p === "/api/setup" && req.method === "POST") return json(await room.setup(body.password));
    if (p === "/api/state" && req.method === "GET") return json(await room.getState(token, Number(url.searchParams.get("v"))));
    if (p === "/api/state" && req.method === "PUT") return json(await room.update(token, body));
    if (p === "/api/spin" && req.method === "POST") return json(await room.spin(token));
    if (p === "/api/wheel/state" && req.method === "GET") return json(await room.wheelState(Number(url.searchParams.get("v"))));
    if (p === "/api/wheel/spin" && req.method === "POST") return json(await room.wheelSpin());
    return json([404, { error: "Tidak ditemukan." }]);
  },
};
