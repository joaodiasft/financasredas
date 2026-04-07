/**
 * Testes de fumaça das APIs (servidor precisa estar no ar).
 * Uso: node scripts/system-test.mjs [BASE_URL]
 * Ex.: npm run build && npx next start -p 3010
 *      node scripts/system-test.mjs http://127.0.0.1:3010
 */

const BASE = process.argv[2] || process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.TEST_EMAIL || "claudiney@redasmil.com";
const PASS = process.env.TEST_PASSWORD || "credas2026";

let passed = 0;
let failed = 0;

function extractSessionCookie(res) {
  if (typeof res.headers.getSetCookie === "function") {
    for (const c of res.headers.getSetCookie()) {
      if (c.startsWith("session=")) return c.split(";")[0];
    }
  }
  const single = res.headers.get("set-cookie");
  if (single) {
    const first = single.split(";")[0].trim();
    if (first.startsWith("session=")) return first;
  }
  return null;
}

async function req(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers = { ...opts.headers };
  if (opts.cookie) headers.Cookie = opts.cookie;
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: {
      ...headers,
      ...(opts.json !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    redirect: opts.redirect ?? "follow",
  });
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }
  return { res, data };
}

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  OK  ${name}`);
  } else {
    failed++;
    console.error(`  FALHA ${name} ${detail}`);
  }
}

async function main() {
  console.log(`Base: ${BASE}\n`);

  let r = await req("/api/dashboard");
  ok("GET /api/dashboard sem sessão → 401", r.res.status === 401);

  r = await req("/api/login", { method: "POST", json: { email: EMAIL, password: "errado" } });
  ok("POST /api/login senha errada → 401", r.res.status === 401);

  r = await req("/api/login", { method: "POST", json: { email: EMAIL, password: PASS } });
  const cookie = extractSessionCookie(r.res);
  ok("POST /api/login ok + cookie session", r.res.ok && !!cookie, JSON.stringify(r.data));

  if (!cookie) {
    console.error("\nSem cookie de sessão — abortando o restante.\n");
    process.exit(1);
  }

  const auth = { cookie };

  r = await req("/api/dashboard", auth);
  ok("GET /api/dashboard", r.res.ok && r.data && typeof r.data === "object");

  r = await req("/api/me", auth);
  ok(
    "GET /api/me",
    r.res.ok && r.data?.email && Object.prototype.hasOwnProperty.call(r.data, "name"),
    JSON.stringify(r.data),
  );

  r = await req("/api/groups", auth);
  ok(
    "GET /api/groups",
    r.res.ok && Array.isArray(r.data?.items) && Array.isArray(r.data?.chart),
    r.res.status + " " + (r.data?.error || ""),
  );

  r = await req("/api/transactions", auth);
  ok("GET /api/transactions", r.res.ok && Array.isArray(r.data?.items));

  r = await req("/api/transactions?type=inflow", auth);
  ok("GET /api/transactions?type=inflow", r.res.ok);

  r = await req("/api/payables", auth);
  ok("GET /api/payables", r.res.ok && Array.isArray(r.data?.items));

  r = await req("/api/reports", auth);
  ok("GET /api/reports", r.res.ok && r.data);

  r = await req("/api/categories", auth);
  ok("GET /api/categories", r.res.ok && Array.isArray(r.data?.items));

  r = await req("/api/categories?kind=inflow", auth);
  ok("GET /api/categories?kind=inflow", r.res.ok);

  r = await req("/api/students", auth);
  ok("GET /api/students", r.res.ok && Array.isArray(r.data?.items));

  r = await req("/api/fixed-bills", auth);
  ok("GET /api/fixed-bills", r.res.ok && Array.isArray(r.data?.items));

  r = await req("/api/import/history", auth);
  ok(
    "GET /api/import/history",
    r.res.ok && Array.isArray(r.data?.files) && r.data?.verification?.database,
    JSON.stringify(r.data?.error || ""),
  );

  const tag = `e2e-${Date.now()}`;
  r = await req("/api/transactions", {
    method: "POST",
    cookie,
    json: {
      date: "2026-04-03",
      description: `Teste API ${tag}`,
      category: "Mensalidade",
      amount: 1.5,
      type: "inflow",
      status: "paid",
      turmas: ["Exatas EX 1"],
    },
  });
  const txId = r.data?.item?.id;
  ok("POST /api/transactions", r.res.ok && !!txId, JSON.stringify(r.data));

  if (txId) {
    r = await req(`/api/transactions/${txId}`, {
      method: "PATCH",
      cookie,
      json: { description: `Teste API ${tag} (patch)` },
    });
    ok("PATCH /api/transactions/:id", r.res.ok);

    r = await req(`/api/transactions/${txId}`, { method: "DELETE", cookie });
    ok("DELETE /api/transactions/:id", r.res.ok && r.data?.ok === true);
  }

  const csv = `2026-04-03,Import ${tag},Mensalidade,2.5,inflow,paid,Sicoob Redação`;
  r = await req("/api/import", { method: "POST", cookie, json: { csv } });
  ok(
    "POST /api/import (JSON csv)",
    r.res.ok && (r.data?.imported ?? 0) >= 1,
    JSON.stringify(r.data),
  );
  const importIds = (r.data?.items || []).map((x) => x.id).filter(Boolean);
  for (const id of importIds) {
    await req(`/api/transactions/${id}`, { method: "DELETE", cookie });
  }

  r = await req("/api/students", {
    method: "POST",
    cookie,
    json: { name: `Aluno ${tag}`, turma1: "Exatas EX 1", active: true },
  });
  const stId = r.data?.item?.id;
  ok("POST /api/students", r.res.ok && !!stId);

  if (stId) {
    r = await req(`/api/students/${stId}`, { method: "PATCH", cookie, json: { notes: "e2e" } });
    ok("PATCH /api/students/:id", r.res.ok);

    r = await req(`/api/students/${stId}`, { method: "DELETE", cookie });
    ok("DELETE /api/students/:id", r.res.ok && r.data?.ok === true);
  }

  r = await req("/api/groups", {
    method: "POST",
    cookie,
    json: { name: `Turma ${tag}` },
  });
  const grpId = r.data?.item?.id;
  ok("POST /api/groups", r.res.ok && !!grpId);

  if (grpId) {
    r = await req(`/api/groups/${grpId}`, { method: "PATCH", cookie, json: { studentCount: 1 } });
    ok("PATCH /api/groups/:id", r.res.ok);

    r = await req(`/api/groups/${grpId}`, { method: "DELETE", cookie });
    ok("DELETE /api/groups/:id", r.res.ok && r.data?.ok === true);
  }

  r = await req("/api/fixed-bills", {
    method: "POST",
    cookie,
    json: {
      description: `Fixa ${tag}`,
      category: "Aluguel",
      amount: 9.99,
      dueDay: 10,
      active: true,
    },
  });
  const fbId = r.data?.item?.id;
  ok("POST /api/fixed-bills", r.res.ok && !!fbId);

  if (fbId) {
    r = await req(`/api/fixed-bills/${fbId}/generate`, {
      method: "POST",
      cookie,
      json: { month: "2030-06" },
    });
    ok(
      "POST /api/fixed-bills/:id/generate",
      r.res.ok && (r.data?.item || r.data?.alreadyExists === true),
    );
    const genTx = r.data?.item;
    if (genTx?.id && !r.data?.alreadyExists) {
      await req(`/api/transactions/${genTx.id}`, { method: "DELETE", cookie });
    }
    await req(`/api/fixed-bills/${fbId}`, { method: "DELETE", cookie });
  }

  r = await req("/api/logout", { method: "POST", cookie });
  ok("POST /api/logout", r.res.ok);

  const logoutCookie = extractSessionCookie(r.res);
  const cleared = r.res.headers.get("set-cookie");
  ok("logout limpa sessão (Set-Cookie)", r.res.ok && (!!cleared || logoutCookie === null));

  r = await req("/api/dashboard");
  ok("GET /api/dashboard após logout → 401", r.res.status === 401);

  r = await req("/login", { redirect: "manual" });
  ok("GET /login (sem redirect)", r.res.status === 200 || r.res.status === 304);

  r = await req("/", { redirect: "manual" });
  ok("GET / sem sessão redireciona", r.res.status === 307 || r.res.status === 302);

  console.log(`\nResultado: ${passed} ok, ${failed} falha(s)\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
