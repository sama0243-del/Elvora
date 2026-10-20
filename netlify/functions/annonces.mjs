import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("annonces");
  const json = (d, s = 200) => new Response(JSON.stringify(d), {
    status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
  let list = (await store.get("list", { type: "json" })) || [];

  if (req.method === "GET") return json(list);

  const pass = req.headers.get("x-admin-password");
  if (!process.env.ADMIN_PASSWORD || pass !== process.env.ADMIN_PASSWORD)
    return json({ error: "Mot de passe incorrect" }, 401);

  if (req.method === "POST") {
    const b = await req.json();
    const title = String(b.title || "").trim().slice(0, 150);
    const text = String(b.text || "").trim().slice(0, 3000);
    if (!title || !text) return json({ error: "Titre et texte obligatoires" }, 400);
    const post = { id: Date.now().toString(36), title, text, date: new Date().toISOString() };
    list.unshift(post);
    await store.setJSON("list", list);
    return json(post, 201);
  }
  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    list = list.filter((p) => p.id !== id);
    await store.setJSON("list", list);
    return json({ ok: true });
  }
  return json({ error: "Méthode non autorisée" }, 405);
};

export const config = { path: "/api/annonces" };
