// Doorprize sync server: one Durable Object holds the event state so the wheel computer and the
// admin computer see the same data. The server also draws the winner, so the preset queue never
// leaves the server except to signed-in panitia.
import { DurableObject } from "cloudflare:workers";

const DEF = { names: ["A", "B", "C", "D", "E"], mode: "random", winners: [], remove: true, log: [] };
const SESSION_MS = 12 * 3600e3;

// Preset mode: next queued winner still on the wheel; otherwise random. (Same rule as the pages.)
export function pick(names, mode, queue, rand) {
  if (mode === "preset") {
    const low = names.map((x) => x.toLowerCase());
    while (queue.length) { const i = low.indexOf(queue.shift().toLowerCase()); if (i >= 0) return i; }
  }
  return Math.floor(rand() * names.length);
}

// Validate an admin patch at the trust boundary; returns null when anything is malformed.
export function clean(x) {
  if (!x || typeof x !== "object") return null;
  const list = (a) => Array.isArray(a) && a.length <= 5000 && a.every((v) => typeof v === "string" && v.length <= 120)
    ? a.map((v) => v.trim()).filter(Boolean) : null;
  const o = {};
  for (const k of ["names", "winners", "log"]) if (k in x) { const l = list(x[k]); if (!l) return null; o[k] = l; }
  if ("mode" in x) { if (x.mode !== "random" && x.mode !== "preset") return null; o.mode = x.mode; }
  if ("remove" in x) { if (typeof x.remove !== "boolean") return null; o.remove = x.remove; }
  return o;
}

async function sameSecret(a, b) {
  const e = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((v) => crypto.subtle.digest("SHA-256", e.encode(v))));
  return crypto.subtle.timingSafeEqual(x, y);
}

export class Room extends DurableObject {
  async state() { return Object.assign({}, DEF, { v: 0 }, await this.ctx.storage.get("s")); }

  async login(password) {
    if (!this.env.ADMIN_PASSWORD) return [500, { error: "ADMIN_PASSWORD belum diatur di server." }];
    const now = Date.now();
    let f = (await this.ctx.storage.get("fail")) || { n: 0, t: 0 };
    if (f.n >= 5 && now - f.t < 60e3) return [429, { error: "Terlalu banyak percobaan. Tunggu 1 menit." }];
    if (typeof password !== "string" || !(await sameSecret(password, this.env.ADMIN_PASSWORD))) {
      f = { n: (now - f.t < 60e3 ? f.n : 0) + 1, t: now };
      await this.ctx.storage.put("fail", f);
      return [401, { error: "Password salah." }];
    }
    const sess = (await this.ctx.storage.get("sess")) || {};
    for (const k in sess) if (sess[k] < now) delete sess[k];
    const token = crypto.randomUUID();
    sess[token] = now + SESSION_MS;
    this.ctx.storage.delete("fail");
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

  // Draw, record and (optionally) remove the winner in one write.
  async spin(token) {
    if (!(await this.ok(token))) return [401, { error: "Sesi habis. Masuk lagi." }];
    const s = await this.state();
    if (!s.names.length) return [409, { error: "Roda kosong." }];
    const before = s.names.slice(), q = s.winners.slice();
    const name = before[pick(before, s.mode, q, Math.random)];
    s.winners = q;
    s.log.push(name);
    if (s.remove) { const j = s.names.indexOf(name); if (j >= 0) s.names.splice(j, 1); }
    s.v++;
    await this.ctx.storage.put("s", s);
    return [200, { name, before, state: s }];
  }
}

const json = ([status, body]) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (!p.startsWith("/api/")) return env.ASSETS.fetch(req);
    if (p === "/api/ping") return json([200, { cloud: true }]);
    const room = env.ROOM.getByName("event");
    const token = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
    const body = req.method === "GET" ? null : await req.json().catch(() => ({}));
    if (p === "/api/login" && req.method === "POST") return json(await room.login(body.password));
    if (p === "/api/state" && req.method === "GET") return json(await room.getState(token, Number(url.searchParams.get("v"))));
    if (p === "/api/state" && req.method === "PUT") return json(await room.update(token, body));
    if (p === "/api/spin" && req.method === "POST") return json(await room.spin(token));
    return json([404, { error: "Tidak ditemukan." }]);
  },
};
