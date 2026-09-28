// 东京行程抽签：保存每一局的选择和打分，其余请求照常返回静态页面。
// 记录存在 KV 命名空间 PLAYS 里，key 形如 play:2026-10-01T12:00:00.000Z-ab12cd34

const MAX_BODY = 20000;
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function clean(v, depth = 0) {
  // 只保留普通 JSON 数据，字符串截断，防止塞进超大内容
  if (depth > 6) return null;
  if (typeof v === "string") return v.slice(0, 600);
  if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 60).map((x) => clean(x, depth + 1));
  if (typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v).slice(0, 40)) o[k.slice(0, 40)] = clean(v[k], depth + 1);
    return o;
  }
  return null;
}

async function readBody(req) {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new Error("too_big");
  return JSON.parse(text);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/")) {
      if (!env.PLAYS) return json({ ok: false, error: "还没有绑定 KV（PLAYS）" }, 503);

      // 新的一局
      if (url.pathname === "/api/play" && req.method === "POST") {
        let d;
        try { d = clean(await readBody(req)); } catch { return json({ ok: false, error: "bad_request" }, 400); }
        const at = new Date().toISOString();
        const id = at + "-" + crypto.randomUUID().slice(0, 8);
        await env.PLAYS.put("play:" + id, JSON.stringify({ ...d, at }));
        return json({ ok: true, id });
      }

      // 给这一局打分 / 留言
      if (url.pathname === "/api/feedback" && req.method === "POST") {
        let d;
        try { d = clean(await readBody(req)); } catch { return json({ ok: false, error: "bad_request" }, 400); }
        if (!d || typeof d.id !== "string" || !/^[0-9TZ:.\-a-f]{20,60}$/.test(d.id)) return json({ ok: false, error: "bad_id" }, 400);
        const key = "play:" + d.id;
        const old = await env.PLAYS.get(key, "json");
        if (!old) return json({ ok: false, error: "not_found" }, 404);
        old.feedback = { rating: d.rating ?? null, comment: d.comment ?? "", at: new Date().toISOString() };
        await env.PLAYS.put(key, JSON.stringify(old));
        return json({ ok: true });
      }

      // 公开的汇总：只给计数，不返回留言
      if (url.pathname === "/api/stats" && req.method === "GET") {
        const list = await env.PLAYS.list({ prefix: "play:", limit: 300 });
        const recs = await Promise.all(list.keys.map((k) => env.PLAYS.get(k.name, "json")));
        const count = (field) => {
          const m = {};
          for (const r of recs) {
            const v = r && r.answers ? r.answers[field] : undefined;
            for (const x of Array.isArray(v) ? v : v ? [v] : []) m[x] = (m[x] || 0) + 1;
          }
          return m;
        };
        const ratings = recs.map((r) => r && r.feedback && r.feedback.rating).filter((x) => typeof x === "number");
        return json({
          ok: true,
          plays: recs.filter(Boolean).length,
          pace: count("pace"), tier: count("tier"), food: count("food"), shop: count("shop"),
          monday: count("monday"), night: count("night"),
          rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
          rated: ratings.length,
        });
      }

      return json({ ok: false, error: "not_found" }, 404);
    }

    return env.ASSETS.fetch(req);
  },
};
