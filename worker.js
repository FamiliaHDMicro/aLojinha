var INDEX_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>aLojinha - Ofertas Relâmpago</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0f1724] text-[#f5f7fa] min-h-screen"><header class="bg-[#2563eb] p-4 shadow-lg sticky top-0 z-50"><div class="max-w-6xl mx-auto flex justify-between"><h1 class="text-2xl font-bold">🛍️ aLojinha</h1><span class="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold animate-pulse">OFERTAS A CADA 4H</span></div></header><main class="max-w-6xl mx-auto p-4"><div id="loading" class="text-center py-20 text-xl text-gray-400">Buscando ofertas...</div><div id="vitrine" class="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6"></div><div id="vitrine-mobile" class="md:hidden flex overflow-x-auto gap-4"></div></main><script>async function carregarVitrine(){try{const res=await fetch('/api/produtos');const produtos=await res.json();if(!Array.isArray(produtos)||!produtos.length){document.getElementById('loading').innerHTML='<p class="text-white">Nenhuma oferta disponível no momento. O Robozim está trabalhando!</p>';return;}document.getElementById('loading').classList.add('hidden');const d=document.getElementById('vitrine'),m=document.getElementById('vitrine-mobile');d.classList.remove('hidden');produtos.forEach(p=>{const card='<div class="bg-[#1e293b] rounded-xl overflow-hidden border border-[#334155] flex flex-col hover:border-[#2563eb] transition"><img src="'+(p.imagem||'')+'" class="h-48 object-cover bg-gray-800" onerror="this.src=\\'https://via.placeholder.com/400x300?text=Sem+Imagem\\'"><div class="p-4 flex-1 flex flex-col"><h3 class="text-sm line-clamp-2 flex-1 text-gray-200">'+p.titulo+'</h3><p class="text-xl font-bold text-green-400 my-2">R$ '+(parseFloat(p.preco_numero||0)).toFixed(2)+'</p><a href="'+p.link_afiliado+'" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-center font-bold transition">COMPRAR</a></div></div>';d.innerHTML+=card;m.innerHTML+=card;});}catch(e){document.getElementById('loading').innerText='Erro ao carregar: '+e.message;}}carregarVitrine();</script></body></html>`;

var ADMIN_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin aLojinha</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0f1724] text-white p-4 font-sans"><h1 class="text-2xl font-bold mb-6 text-blue-400">👑 aLojinha Admin (REAL)</h1><div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div class="bg-[#1e293b] p-4 rounded border border-gray-700"><div class="text-gray-400 text-sm">No Pool (Aguardando):</div><div class="text-3xl font-bold text-yellow-400" id="pool">...</div></div><div class="bg-[#1e293b] p-4 rounded border border-gray-700"><div class="text-gray-400 text-sm">Na Vitrine (Ativos):</div><div class="text-3xl font-bold text-green-400" id="vitrine">...</div></div><div class="bg-[#1e293b] p-4 rounded border border-gray-700"><div class="text-gray-400 text-sm">Últimas 24h:</div><div class="text-3xl font-bold text-blue-400" id="dia">...</div></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="bg-[#1e293b] p-4 rounded border border-gray-700"><h2 class="font-bold mb-3 text-lg">Mover do Pool para Vitrine</h2><div class="space-y-3"><div><label class="text-sm text-gray-400">Quantidade a mover:</label><input id="qtd" type="number" value="20" class="w-full bg-[#0f1724] text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none"></div><div><label class="text-sm text-gray-400">Senha do Admin:</label><input id="senha" type="password" placeholder="Sua senha" class="w-full bg-[#0f1724] text-white p-2 rounded border border-gray-600 focus:border-blue-500 outline-none"></div><button onclick="mover()" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold transition">🚀 MOVER PRODUTOS</button><div id="msg" class="text-sm mt-2 font-bold"></div></div></div><div class="bg-[#1e293b] p-4 rounded border border-gray-700"><h2 class="font-bold mb-3 text-lg">Status do Sistema</h2><p class="text-sm text-gray-400 mb-2">O painel agora busca dados REAIS do banco D1. Sem números falsos.</p><button onclick="stats()" class="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white">🔄 Atualizar Números</button></div></div><script>async function stats(){try{const r=await fetch('/api/debug');const d=await r.json();document.getElementById('pool').innerText=d.pool||0;document.getElementById('vitrine').innerText=d.vitrine||0;document.getElementById('dia').innerText=d.dia24h||0;}catch(e){console.error(e);document.getElementById('pool').innerText='Erro';}}async function mover(){const qtd=document.getElementById('qtd').value;const senha=document.getElementById('senha').value;if(!senha){alert('Senha obrigatória');return;}document.getElementById('msg').innerText='⏳ Processando...';document.getElementById('msg').className='text-sm mt-2 font-bold text-yellow-400';try{const r=await fetch('/api/mover-pool',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+senha},body:JSON.stringify({qtd})});const d=await r.json();if(d.ok){document.getElementById('msg').innerText='✅ '+d.msg;document.getElementById('msg').className='text-sm mt-2 font-bold text-green-400';stats();}else{document.getElementById('msg').innerText='❌ '+d.error;document.getElementById('msg').className='text-sm mt-2 font-bold text-red-400';}}catch(e){document.getElementById('msg').innerText='❌ Erro de rede: '+e.message;document.getElementById('msg').className='text-sm mt-2 font-bold text-red-400';}}stats();setInterval(stats,10000);</script></body></html>`;

var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    
    if (!env.alojinha) {
      return new Response(JSON.stringify({ error: "Banco de dados 'alojinha' não configurado no Binding do Cloudflare!" }), { status: 500, headers });
    }
    const db = env.alojinha;

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin.html") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/api/debug") {
      try {
        const pool = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool WHERE ativo=1`).first();
        const vitrine = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool WHERE ativo=2`).first();
        const dia24h = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool WHERE ativo=1 AND criado_em >= datetime('now', '-1 day')`).first();
        return new Response(JSON.stringify({
          pool: pool?.c || 0,
          vitrine: vitrine?.c || 0,
          dia24h: dia24h?.c || 0
        }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/produtos_pool") {
      try {
        const bloco4h = Math.floor(Date.now() / (4 * 3600 * 1e3));
        const { results } = await db.prepare(
          `SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma, emoji
           FROM produtos_pool 
           WHERE ativo=2 AND imagem IS NOT NULL AND imagem!='' AND preco_numero BETWEEN 10 AND 500
           ORDER BY ((id + ?) % 1000)
           LIMIT 12`
        ).bind(bloco4h).all();
        return new Response(JSON.stringify(results || []), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/produtos_pool" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!body.titulo || !body.link_afiliado) {
          return new Response(JSON.stringify({ ok: false, error: "Faltam: titulo ou link_afiliado" }), { status: 400, headers });
        }
        
        await db.prepare(`CREATE TABLE IF NOT EXISTS produtos_pool (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL,
          preco TEXT NOT NULL,
          preco_numero REAL DEFAULT 0,
          imagem TEXT,
          link_afiliado TEXT NOT NULL UNIQUE,
          plataforma TEXT NOT NULL,
          nicho TEXT DEFAULT 'geral',
          emoji TEXT DEFAULT '🔥',
          ativo INTEGER DEFAULT 1,
          criado_em TEXT DEFAULT CURRENT_TIMESTAMP
        )`).run();

        const existe = await db.prepare(`SELECT id FROM produtos_pool WHERE link_afiliado=?`).bind(body.link_afiliado).first();
        if (existe) {
          return new Response(JSON.stringify({ ok: false, msg: "Já existe", id: existe.id }), { headers });
        }

        await db.prepare(
          `INSERT INTO produtos_pool (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, emoji, ativo)
           VALUES (?,?,?,?,?,?,?,?,1)`
        ).bind(
          body.titulo?.slice(0, 200) || "Achadinho",
          body.preco || "Consultar",
          body.preco_numero || 0,
          body.imagem || "",
          body.link_afiliado,
          body.plataforma || "Outra",
          body.nicho || "geral",
          body.emoji || "🔥"
        ).run();
        
        return new Response(JSON.stringify({ ok: true, link: body.link_afiliado }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/mover-pool" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      const senha = auth?.replace("Bearer ", "");
      
      // CORREÇÃO DE SEGURANÇA: Verifica estritamente a variável de ambiente.
      // Se não estiver configurada no Cloudflare, nega o acesso por segurança.
      if (!env.ADMIN_PASSWORD || senha !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ ok: false, error: "Senha incorreta ou não configurada no servidor" }), { status: 401, headers });
      }
      
      try {
        const body = await request.json();
        const qtd = parseInt(body.qtd) || 10;
        
        const { results } = await db.prepare(
          `SELECT id FROM produtos_pool WHERE ativo=1 ORDER BY criado_em DESC LIMIT ?`
        ).bind(qtd).all();
        
        let movidos = 0;
        for (const prod of results) {
          await db.prepare(`UPDATE produtos_pool SET ativo=2 WHERE id=?`).bind(prod.id).run();
          movidos++;
        }
        return new Response(JSON.stringify({ ok: true, msg: `Movidos ${movidos} produtos para a vitrine!` }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ message: "aLojinha API v3.1 (Segura)", status: "ok" }), { headers });
  }
};

export { worker_default as default };
