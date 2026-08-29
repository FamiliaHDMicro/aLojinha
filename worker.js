// Endpoint: Mover produtos em lote
if (url.pathname === "/api/admin/mover-produtos" && request.method === "POST") {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
    return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401, headers });
  }

  const body = await request.json();
  const valorLimite = parseFloat(body.valorLimite) || 100;
  const lote = parseInt(body.lote) || 50;

  try {
    // 1. Busca produtos do coleposte-db (limite de preço + tem imagem + não é ML)
    const { results: produtosOrigem } = await env.coleposte.prepare(`
      SELECT id, titulo, preco, url_produto, imagem_url, loja, nicho, emoji
      FROM produtos
      WHERE CAST(REPLACE(REPLACE(preco, 'R$', ''), ',', '.') AS REAL) < ?
        AND imagem_url IS NOT NULL 
        AND imagem_url != ''
        AND url_produto IS NOT NULL
        AND url_produto != ''
        AND loja IN ('Shopee', 'Amazon', 'Magazine Luiza')
      LIMIT ?
    `).bind(valorLimite, lote).all();

    if (produtosOrigem.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        movidos: 0, 
        mensagem: "Nenhum produto encontrado para mover" 
      }), { headers });
    }

    // 2. Move cada produto
    let movidos = 0;
    let erros = 0;

    for (const prod of produtosOrigem) {
      try {
        // Converte preço texto para número
        const precoTexto = prod.preco.replace('R$', '').replace('.', '').replace(',', '.').trim();
        const precoNumero = parseFloat(precoTexto);

        // Monta link com ID de afiliado
        let linkFinal = prod.url_produto;
        if (prod.loja === 'Shopee' && !linkFinal.includes('aff_id=')) {
          linkFinal += (linkFinal.includes('?') ? '&' : '?') + 'aff_id=18338650355';
        } else if (prod.loja === 'Amazon' && !linkFinal.includes('tag=')) {
          linkFinal += (linkFinal.includes('?') ? '&' : '?') + 'tag=coloposte-20';
        }
        // Magalu: você precisa adicionar seu ID depois

        // Normaliza nome da plataforma
        let plataforma = prod.loja.toLowerCase();
        if (plataforma === 'magazine luiza') plataforma = 'magalu';

        // Insere no alojinha
        await env.alojinha.prepare(`
          INSERT INTO produtos_pool 
          (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, emoji, ativo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
          prod.titulo,
          prod.preco,
          precoNumero,
          prod.imagem_url,
          linkFinal,
          plataforma,
          prod.nicho || 'geral',
          prod.emoji || ''
        ).run();

        // Apaga do coleposte-db (mover de verdade!)
        await env.coleposte.prepare(`
          DELETE FROM produtos WHERE id = ?
        `).bind(prod.id).run();

        movidos++;
      } catch (err) {
        console.error("Erro ao mover produto:", err);
        erros++;
      }
    }

    // Conta quantos ainda restam
    const { total: restam } = await env.coleposte.prepare(`
      SELECT COUNT(*) as total FROM produtos
      WHERE CAST(REPLACE(REPLACE(preco, 'R$', ''), ',', '.') AS REAL) < ?
        AND imagem_url IS NOT NULL 
        AND imagem_url != ''
        AND loja IN ('Shopee', 'Amazon', 'Magazine Luiza')
    `).bind(valorLimite).first();

    return new Response(JSON.stringify({
      success: true,
      movidos,
      erros,
      restam: restam || 0,
      mensagem: `Movidos ${movidos} produtos. Restam ${restam || 0}.`
    }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Erro: " + e.message }), { status: 500, headers });
  }
}
