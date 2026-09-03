var INDEX_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>aLojinha - Ofertas Relâmpago</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0f1724] text-[#f5f7fa] min-h-screen"><header class="bg-[#2563eb] p-4 shadow-lg sticky top-0 z-50"><div class="max-w-6xl mx-auto flex justify-between"><h1 class="text-2xl font-bold">🛍️ aLojinha</h1><span class="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold animate-pulse">OFERTAS A CADA 4H</span></div></header><main class="max-w-6xl mx-auto p-4"><div id="loading" class="text-center py-20 text-xl text-gray-400">Buscando ofertas...</div><div id="vitrine" class="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6"></div><div id="vitrine-mobile" class="md:hidden flex overflow-x-auto gap-4"></div></main><script>async function carregarVitrine(){try{const res=await fetch('https://alojinha-db.hdmicro-cliente.workers.dev/api/produtos');const produtos=await res.json();if(!Array.isArray(produtos)||!produtos.length){document.getElementById('loading').innerHTML='<p class="text-white">Nenhuma oferta disponível no momento. O Robozim está trabalhando!</p>';return;}document.getElementById('loading').classList.add('hidden');const d=document.getElementById('vitrine'),m=document.getElementById('vitrine-mobile');d.classList.remove('hidden');produtos.forEach(p=>{const card='<div class="bg-[#1e293b] rounded-xl overflow-hidden border border-[#334155] flex flex-col hover:border-[#2563eb] transition"><img src="'+(p.imagem||'')+'" class="h-48 object-cover bg-gray-800" onerror="this.src=\\'https://via.placeholder.com/400x300?text=Sem+Imagem\\'"><div class="p-4 flex-1 flex flex-col"><h3 class="text-sm line-clamp-2 flex-1 text-gray-200">'+p.titulo+'</h3><p class="text-xl font-bold text-green-400 my-2">R$ '+(parseFloat(p.preco_numero||0)).toFixed(2)+'</p><a href="'+p.link_afiliado+'" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-center font-bold transition">COMPRAR</a></div></div>';d.innerHTML+=card;m.innerHTML+=card;});}catch(e){document.getElementById('loading').innerText='Erro ao carregar: '+e.message;}}carregarVitrine();</script></body></html>`;

var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };
    
    if (request.method === "OPTIONS") return new Response(null, { headers });
    
    // AQUI ESTÁ A CORREÇÃO: usa env.DB
    if (!env.DB) return new Response(JSON.stringify({ error: "Banco DB não configurado" }), { status: 500, headers });
    const db = env.DB;

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/api/debug") {
      try {
        const pool = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool WHERE ativo=1`).first();
        const vitrine = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool WHERE ativo=2`).first();
        return new Response(JSON.stringify({ pool: pool?.c || 0, vitrine: vitrine?.c || 0 }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/produtos" && request.method === "GET") {
      try {
        const horas4ms = 4 * 60 * 60 * 1000;
        const bloco = Math.floor(Date.now() / horas4ms);
        const result = await db.prepare(`
          SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma, emoji
          FROM produtos_pool WHERE ativo = 2 
          ORDER BY ((id + ?) % 1000) ASC LIMIT 12
        `).bind(bloco).all();
        return new Response(JSON.stringify(result.results || []), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/produtos_pool" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!body.titulo || !body.link_afiliado) return new Response(JSON.stringify({ ok: false, error: "Faltam dados" }), { status: 400, headers });
        
        await db.prepare(`CREATE TABLE IF NOT EXISTS produtos_pool (
          id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, preco TEXT NOT NULL,
          preco_numero REAL DEFAULT 0, imagem TEXT, link_afiliado TEXT NOT NULL UNIQUE,
          plataforma TEXT NOT NULL, nicho TEXT DEFAULT 'geral', emoji TEXT DEFAULT '🔥',
          ativo INTEGER DEFAULT 1, criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )`).run();

        const existe = await db.prepare(`SELECT id FROM produtos_pool WHERE link_afiliado=?`).bind(body.link_afiliado).first();
        if (existe) return new Response(JSON.stringify({ ok: false, msg: "Já existe" }), { headers });

        await db.prepare(`INSERT INTO produtos_pool (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, emoji, ativo) VALUES (?,?,?,?,?,?,?,?,1)`).bind(
          body.titulo?.slice(0, 200) || "Achadinho", body.preco || "Consultar", body.preco_numero || 0,
          body.imagem || "", body.link_afiliado, body.plataforma || "Outra", body.nicho || "geral", body.emoji || "🔥"
        ).run();
        
        return new Response(JSON.stringify({ ok: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ message: "API OK" }), { headers });
  }
};
export { worker_default as default };
