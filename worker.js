// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

    // 1. API: Buscar produtos brutos do D1 (para o Admin)
    if (url.pathname === "/api/admin/produtos" && request.method === "GET") {
      const min = url.searchParams.get("min") || 0;
      const max = url.searchParams.get("max") || 99999;
      const seller = url.searchParams.get("seller") || "";
      const platform = url.searchParams.get("platform") || "";

      let query = `SELECT id, titulo, preco, imagem, link, seller, plataforma FROM produtos WHERE preco BETWEEN ? AND ?`;
      let params = [min, max];

      if (seller) { query += ` AND seller LIKE ?`; params.push(`%${seller}%`); }
      if (platform) { query += ` AND plataforma = ?`; params.push(platform); }
      query += ` LIMIT 50`;

      const { results } = await env.DB.prepare(query).bind(...params).all();
      return new Response(JSON.stringify(results), { headers });
    }

    // 2. API: Salvar os 12 produtos na vitrine (Admin)
    if (url.pathname === "/api/admin/salvar_vitrine" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      // ✅ USA A SENHA DO CLOUDFLARE
      if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401, headers });
      }

      const produtos = await request.json();
      if (!Array.isArray(produtos) || produtos.length > 12) {
        return new Response(JSON.stringify({ error: "Máximo de 12 produtos" }), { status: 400, headers });
      }

      await env.DB.prepare("DELETE FROM microloja_vitrine").run();

      for (const p of produtos) {
        let linkFinal = p.link;
        if (p.plataforma === "shopee" && !linkFinal.includes("aff_id=")) {
          linkFinal += (linkFinal.includes("?") ? "&" : "?") + "aff_id=18338650355";
        } else if (p.plataforma === "amazon" && !linkFinal.includes("tag=")) {
          linkFinal += (linkFinal.includes("?") ? "&" : "?") + "tag=coloposte-20";
        }

        await env.DB.prepare(`
          INSERT INTO microloja_vitrine (id, titulo, preco, imagem, link_afiliado, plataforma, ativo)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).bind(p.id, p.titulo, p.preco, p.imagem, linkFinal, p.plataforma).run();
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 3. API: Buscar produtos da vitrine (Pública)
    if (url.pathname === "/api/produtos" && request.method === "GET") {
      const { results } = await env.DB.prepare(`
        SELECT id, titulo, preco, imagem, link_afiliado, plataforma 
        FROM microloja_vitrine 
        WHERE ativo = 1 
        ORDER BY id 
        LIMIT 12
      `).all();
      return new Response(JSON.stringify(results), { headers });
    }

    // 4. Servir o HTML da Vitrine (index.html)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(VITRINE_HTML, { headers: { "Content-Type": "text/html" } });
    }

    // 5. Servir o HTML do Admin (admin.html)
    if (url.pathname === "/admin" || url.pathname === "/admin.html") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("aLojinha API Rodando. Acesse / para a loja e /admin para o painel.", { 
      headers: { "Content-Type": "text/plain" } 
    });
  }
};

// Cole o conteúdo do index.html aqui embaixo (entre as crases)
const VITRINE_HTML = `<!DOCTYPE html>... (cole o index.html aqui)`;

// Cole o conteúdo do admin.html aqui embaixo (entre as crases)
const ADMIN_HTML = `<!DOCTYPE html>... (cole o admin.html aqui)`;
