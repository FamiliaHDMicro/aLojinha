export default {
  async fetch(request, env) {
    const db = env.DB || env.alojinha;
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!db) return new Response(JSON.stringify({ error: "DB não vinculado" }), { status: 500, headers: cors });

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/') return new Response(JSON.stringify({ message: "aLojinha API v3.0 FINAL", status: "ok", tabelas: ["produtos_pool","vendas_pool"], share_less: "ON", ranking: "ON" }), { headers: {...cors, "Content-Type": "application/json" } });

    if ((path === '/api/produtos_pool' || path === '/api/produtos') && request.method === 'GET') {
      try {
        const { results } = await db.prepare(`SELECT p.*, COALESCE(v.cliques,0) as cliques FROM produtos_pool p LEFT JOIN vendas_pool v ON v.produto_id = p.id ORDER BY COALESCE(v.cliques,0) DESC, p.id DESC LIMIT 200`).all();
        return new Response(JSON.stringify(results), { headers: {...cors, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
      }
    }

    if ((path === '/api/produtos_pool' || path === '/api/add') && request.method === 'POST') {
      const b = await request.json();
      let link = b.link_afiliado || b.url_produto || ""; if(!link) return new Response("sem link",{status:400,headers:cors});
      try { let u=new URL(link); ['fbclid','gclid','utm_source','utm_medium','utm_campaign','spm','fb','from'].forEach(k=>u.searchParams.delete(k)); link=u.toString(); } catch {}
      const ex = await db.prepare("SELECT id FROM produtos_pool WHERE link_afiliado=?").bind(link).first();
      if(!ex){
        const r = await db.prepare("INSERT INTO produtos_pool (titulo,preco,imagem,link_afiliado,plataforma,nicho,emoji) VALUES (?,?,?,?,?,?,?)").bind((b.titulo||"").slice(0,200), b.preco||"", b.imagem||"", link, b.plataforma||"Outra", b.nicho||"geral", b.emoji||"🔥").run();
        await db.prepare("INSERT OR IGNORE INTO vendas_pool (produto_id) VALUES (?)").bind(r.meta.last_row_id).run();
      }
      return new Response(JSON.stringify({ ok: true, limpo: true }), { headers: cors });
    }

    if (path === '/api/click') {
      const id = url.searchParams.get('id');
      const dest = url.searchParams.get('url');
      if(id) await db.prepare("UPDATE vendas_pool SET cliques = cliques + 1 WHERE produto_id=?").bind(id).run();
      if(dest) return Response.redirect(dest, 302);
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }

    if (path === '/api/stats') {
      const total = await db.prepare("SELECT COUNT(*) as c FROM produtos_pool").first();
      const cliques = await db.prepare("SELECT SUM(cliques) as c FROM vendas_pool").first();
      return new Response(JSON.stringify({ total: total?.c||0, cliques: cliques?.c||0 }), { headers: cors });
    }

    return new Response("not found", { status: 404, headers: cors });
  }
}
