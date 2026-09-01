export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // ============================================
    // ROTA 1: Robozim salva produto (POST)
    // ============================================
    if (url.pathname === "/api/salva-produto" && request.method === "POST") {
      try {
        const body = await request.json();
        const { titulo, preco, preco_numero, url_produto, descricao, loja, nicho, canal_origem, imagem_url } = body;

        if (!titulo || !url_produto) {
          return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400, headers });
        }

        let plataforma = (loja || "Outra").toLowerCase();
        if (plataforma.includes("magazine")) plataforma = "magalu";
        if (plataforma.includes("mercado")) plataforma = "mercadolivre";

        let linkFinal = url_produto;
        if (plataforma === "shopee" && !linkFinal.includes("aff_id=")) {
          linkFinal += (linkFinal.includes("?") ? "&" : "?") + "aff_id=18338650355";
        } else if (plataforma === "amazon" && !linkFinal.includes("tag=")) {
          linkFinal += (linkFinal.includes("?") ? "&" : "?") + "tag=coloposte-20";
        }

        await env.alojinha.prepare(`
          INSERT INTO produtos 
          (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, ativo, criado_em)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `).bind(
          titulo.slice(0, 200),
          preco || "Consultar",
          preco_numero || 0,
          imagem_url || null,
          linkFinal,
          plataforma,
          nicho || "geral"
        ).run();

        return new Response(JSON.stringify({ success: true, titulo: titulo.slice(0, 50) }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erro ao salvar: " + e.message }), { status: 500, headers });
      }
    }

    // ============================================
    // ROTA 2: Vitrine pública com rodízio de 4h + fallback de faixas
    // ============================================
    if (url.pathname === "/api/produtos" && request.method === "GET") {
      try {
        const agora = new Date();
        const bloco4h = Math.floor(agora.getTime() / (4 * 60 * 60 * 1000));

        const faixas = [
          { min: 20, max: 50 },
          { min: 50, max: 100 },
          { min: 10, max: 200 }
        ];

        let resultados = [];

        for (const faixa of faixas) {
          const query = `
            SELECT id, titulo, preco, imagem, link_afiliado, plataforma 
            FROM produtos 
            WHERE ativo = 1 
              AND imagem IS NOT NULL 
              AND imagem != ''
              AND preco_numero >= ? 
              AND preco_numero <= ?
            ORDER BY (id + ${bloco4h}) % 1000
            LIMIT 12
          `;
          
          const { results } = await env.alojinha.prepare(query).bind(faixa.min, faixa.max).all();
          
          if (results && results.length >= 4) {
            resultados = results;
            break;
          }
        }

        return new Response(JSON.stringify(resultados), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erro: " + e.message }), { status: 500, headers });
      }
    }

    // ============================================
    // ROTA 3: Admin - Mover produtos em lote
    // ============================================
    if (url.pathname === "/api/admin/mover-produtos" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401, headers });
      }

      try {
        const body = await request.json();
        const valorLimite = parseFloat(body.valorLimite) || 100;
        const lote = parseInt(body.lote) || 50;

        const { results: produtosOrigem } = await env.alojinha.prepare(`
          SELECT id, titulo, preco, preco_numero, url_produto, imagem_url, loja, nicho, emoji
          FROM produtos_coleposte
          WHERE preco_numero < ?
            AND imagem_url IS NOT NULL AND imagem_url != ''
            AND url_produto IS NOT NULL AND url_produto != ''
            AND loja IN ('Shopee', 'Amazon', 'Magazine Luiza', 'Mercado Livre')
          LIMIT ?
        `).bind(valorLimite, lote).all();

        let movidos = 0;
        for (const prod of produtosOrigem) {
          try {
            let linkFinal = prod.url_produto;
            if (prod.loja === 'Shopee' && !linkFinal.includes('aff_id=')) {
              linkFinal += (linkFinal.includes('?') ? '&' : '?') + 'aff_id=18338650355';
            } else if (prod.loja === 'Amazon' && !linkFinal.includes('tag=')) {
              linkFinal += (linkFinal.includes('?') ? '&' : '?') + 'tag=coloposte-20';
            }

            let plataforma = prod.loja.toLowerCase().replace('magazine luiza', 'magalu');

            await env.alojinha.prepare(`
              INSERT INTO produtos 
              (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, emoji, ativo)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `).bind(
              prod.titulo, prod.preco, prod.preco_numero, 
              prod.imagem_url, linkFinal, plataforma, 
              prod.nicho || 'geral', prod.emoji || ''
            ).run();

            await env.alojinha.prepare(`DELETE FROM produtos_coleposte WHERE id = ?`).bind(prod.id).run();
            movidos++;
          } catch (err) {
            console.error("Erro ao mover:", err);
            continue;
          }
        }

        return new Response(JSON.stringify({ success: true, movidos, mensagem: `Movidos ${movidos} produtos.` }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erro: " + e.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ 
      message: "aLojinha API Rodando",
      endpoints: ["/api/produtos", "/api/salva-produto", "/api/admin/mover-produtos"]
    }), { headers });
  }
};
