export default {
  async fetch(request, env) {
    const db = env.DB || env.alojinha;
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!db) return new Response(JSON.stringify({ error: "Vincule D1 como DB" }), { status: 500, headers: cors });

    // Cria as 2 tabelas
    await db.prepare(`CREATE TABLE IF NOT EXISTS produtos_pool (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, preco TEXT, imagem TEXT, link_afiliado TEXT UNIQUE, plataforma TEXT, nicho TEXT, emoji TEXT, ativo INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS vendas_pool (id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER UNIQUE, cliques INTEGER DEFAULT 0, vendas INTEGER DEFAULT 0, comissao REAL DEFAULT 0)`).run();

    const url = new URL(request.url);
    if (url.pathname === '/') return new Response(JSON.stringify({ message: "aLojinha API v2.2 FINAL", status: "ok", tabelas: ["produtos_pool","vendas_pool"], share_less: "ON", ranking: "ON" }), { headers: { ...cors, "Content-Type": "application/json" } });

    // LISTAR com índice de vendas
    if (url.pathname.includes('produtos_pool') && request.method === 'GET') {
      const { results } = await db.prepare(`SELECT p.*, COALESCE(v.cliques,0) as cliques, COALESCE(v.vendas,0) as vendas, COALESCE(v.comissao,0) as comissao FROM produtos_pool p LEFT JOIN vendas_pool v ON v.produto_id = p.id ORDER BY v.vendas DESC, v.cliques DESC, p.created_at DESC LIMIT 200`).all();
      return new Response(JSON.stringify(results), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // CAPTURAR (Shopee + ColePoste) - já entra limpo
    if (request.method === 'POST') {
      const b = await request.json();
      const link = b.link_afiliado || b.url_produto || ""; if (!link) return new Response("sem link", { status: 400, headers: cors });
      const ex = await db.prepare("SELECT id FROM produtos_pool WHERE link_afiliado=?").bind(link).first();
      if (!ex) {
        const r = await db.prepare("INSERT INTO produtos_pool (titulo,preco,imagem,link_afiliado,plataforma,nicho,emoji) VALUES (?,?,?,?,?,?,?)").bind((b.titulo||"").slice(0,200), b.preco||"", b.imagem||b.imagem_url||"", link, b.plataforma||"Outra", b.nicho||"geral", b.emoji||"🔥").run();
        await db.prepare("INSERT OR IGNORE INTO vendas_pool (produto_id) VALUES (?)").bind(r.meta.last_row_id).run();
      }
      return new Response(JSON.stringify({ ok: true, share_less: "limpo" }), { headers: cors });
    }

    // CLICK pra índice de "mais saem"
    if (url.pathname === '/api/click') {
      const id = url.searchParams.get('id');
      await db.prepare("UPDATE vendas_pool SET cliques = cliques + 1 WHERE produto_id = ?").bind(id).run();
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }

    return new Response("not found", { status: 404, headers: cors });
  }
}
