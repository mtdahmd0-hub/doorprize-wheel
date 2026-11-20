// Smoke test for the sync API.  From sync/: run `npx wrangler dev` first, then:  node check-api.mjs [baseUrl]
// Uses ADMIN_PASSWORD from .dev.vars. Resets the event state on the target, so never point it at the live event.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const BASE = process.argv[2] || "http://localhost:8787";
const PW = /ADMIN_PASSWORD=(.*)/.exec(readFileSync(".dev.vars", "utf8"))[1].trim();
const call = async (path, opt = {}, token) => {
  const r = await fetch(BASE + "/api/" + path, { ...opt, headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) } });
  return [r.status, await r.json()];
};

const [, ping] = await call("ping");
assert.equal(ping.cloud, true);
assert.equal((await call("state"))[0], 401, "state needs a session");
if (ping.setup) { // no ADMIN_PASSWORD secret: first visit creates the password
  assert.equal((await call("login", { method: "POST", body: JSON.stringify({ password: PW }) }))[0], 428, "login asks for setup");
  assert.equal((await call("setup", { method: "POST", body: JSON.stringify({ password: "123" }) }))[0], 400, "short password rejected");
  assert.equal((await call("setup", { method: "POST", body: JSON.stringify({ password: PW }) }))[0], 200);
}
assert.equal((await call("setup", { method: "POST", body: JSON.stringify({ password: "orang-lain" }) }))[0], 409, "password cannot be re-claimed");
assert.equal((await call("login", { method: "POST", body: JSON.stringify({ password: "salah" }) }))[0], 401);
const [st, { token }] = await call("login", { method: "POST", body: JSON.stringify({ password: PW }) });
assert.equal(st, 200);

assert.equal((await call("state", { method: "PUT", body: JSON.stringify({ mode: "curang" }) }, token))[0], 400, "bad mode rejected");
const [, s1] = await call("state", { method: "PUT", body: JSON.stringify({ names: ["Ani", "Budi", "Cici"], mode: "preset", winners: ["zz", "budi"], remove: true, log: [] }) }, token);
assert.deepEqual(s1.names, ["Ani", "Budi", "Cici"]);

const [, sp] = await call("spin", { method: "POST" }, token);
assert.equal(sp.name, "Budi", "preset queue skips unknown names, matches case-insensitively");
assert.deepEqual(sp.before, ["Ani", "Budi", "Cici"]);
assert.deepEqual(sp.state.names, ["Ani", "Cici"], "winner removed");
assert.deepEqual(sp.state.log, ["Budi"]);
assert.deepEqual(sp.state.winners, [], "queue consumed");

assert.deepEqual((await call("state?v=" + sp.state.v, {}, token))[1], { same: true }, "poll short-circuits");
const [, sp2] = await call("spin", { method: "POST" }, token);
assert.ok(["Ani", "Cici"].includes(sp2.name), "empty queue falls back to random");
// wheel page: open, no password; queue hidden; spins spaced out
await call("state", { method: "PUT", body: JSON.stringify({ names: ["Ani", "Budi"], mode: "preset", winners: ["Ani"], log: [] }) }, token);
const [wst, ws] = await call("wheel/state");
assert.equal(wst, 200, "wheel state needs no password");
assert.deepEqual(ws.winners, [], "preset queue hidden from the wheel");
assert.deepEqual(ws.names, ["Ani", "Budi"]);
const [, wsp] = await call("wheel/spin", { method: "POST" });
assert.equal(wsp.name, "Ani", "wheel spin follows the queue");
assert.deepEqual(wsp.state.winners, []);
assert.equal((await call("wheel/spin", { method: "POST" }))[0], 429, "back-to-back spin blocked");
console.log("check-api: all assertions passed");
