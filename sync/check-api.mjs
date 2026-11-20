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

assert.deepEqual((await call("ping"))[1], { cloud: true });
assert.equal((await call("state"))[0], 401, "state needs a session");
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
console.log("check-api: all assertions passed");
