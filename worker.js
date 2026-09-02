// worker.js v3 - FINAL - coloposte-20 + Shopee 18338650355 + Magalu magazinehdmicroloja
// binding = alojinha

const AMAZON_TAG = "coloposte-20";
const SHOPEE_ID = "18338650355";
const MAGALU_BASE = "https://www.magazinevoce.com.br/magazinehdmicroloja";

function limparEConverter(linkOriginal, platHint="") {
  try {
    let url = new URL(linkOriginal);
    const lixo = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','igshid','spm','from','source','ref','fb_action_ids'];
    lixo.forEach(k => url.searchParams.delete(k));
    for (const k of [...url.searchParams.keys()]) if(k.startsWith('utm_') || k.startsWith('fb_')) url.searchParams.delete(k);

    let host = url.hostname.toLowerCase();
    let plat = platHint.toLowerCase();

    // AMAZON
    if (host.includes('amazon') || plat.includes('amazon')) {
      url.searchParams.set('tag', AMAZON_TAG);
      return url.toString();
    }
    // SHOPEE
    if (host.includes('shopee') || plat.includes('shopee')) {
      url.searchParams.delete('aff_id');
      url.searchParams.set('aff_id', SHOPEE_ID);
      url.searchParams.delete('affiliate_id');
      return url.toString();
    }
    // MAGALU / MAGAZINE
    if (host.includes('magalu') || host.includes('magazineluiza') || host.includes('magazinevoce') || plat.includes('magalu') || plat.includes('magazine')) {
      return `${MAGALU_BASE}${url.pathname}${url.search}`;
    }
    return url.toString();
  } catch { return linkOriginal; }
}

const INDEX_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>aLojinha - Ofertas Relâmpago</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0f1724] text-[#f5f7fa] min-h-screen"><header class="bg-[#2563eb] p-4 shadow-lg sticky top-0 z-50"><div class="max-w-6xl mx-auto flex justify-between"><h1 class="text-2xl font-bold">🛍 aLojinha</h1><span class="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold animate-pulse">OFERTAS A CADA 4H</span></div></header><main class="max-w-6xl mx-auto p-4"><div id="loading" class="text-center py-20">Buscando ofertas...</div><div id="vitrine" class="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6"></div><div id="vitrine-mobile" class="md:hidden flex overflow-x-auto gap-4"></div></main><script>async function carregarVitrine(){try{const res=await fetch('/api/produtos');const data=await res.json();const produtos=Array.isArray(data)?data:(data.produtos||[]);document.getElementById('loading').classList.add('hidden');const d=document.getElementById('vitrine'),m=document.getElementById('vitrine-mobile');if(!produtos.length){d.innerHTML='<p class="col-span-full text-center py-10">Vitrine vazia. Vá em /admin.html e clique em MOVER<br><small>'+JSON.stringify(data.debug||data)+'</small></p>';d.classList.remove('hidden');return;}d.classList.remove('hidden');produtos.forEach(p=>{const card='<div class="bg-[#1e293b] rounded-xl overflow-hidden border border-[#334155] flex flex-col"><img src="'+(p.imagem||'')+'" class="h-48 object-cover bg-gray-800" onerror="this.src=\'https://via.placeholder.com/400x300\'"><div class="p-4 flex-1 flex flex-col"><h3 class="text-sm line-clamp-2 flex-1">'+p.titulo+'</h3><p class="text-xl font-bold text-green-400 my-2">R$ '+(parseFloat(p.preco_numero||p.preco)||0).toFixed(2)+'</p><a href="'+p.link_afiliado+'" target="_blank" class="bg-blue-600 text-white py-2 rounded text-center font-bold">COMPRAR</a></div></div>';d.innerHTML+=card;m.innerHTML+=card;});}catch(e){document.getElementById('loading').innerText='Erro: '+e.message;}}carregarVitrine();</script></body></html>`;
const ADMIN_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#0f1724] text-white p-4"><h1 class="text-2xl font-bold mb-4">🛍 aLojinha Admin</h1><div class="grid grid-cols-3 gap-4 mb-6"><div class="bg-[#1e293b] p-4 rounded">Vitrine: <b id="v">-</b></div><div class="bg-[#1e293b] p-4 rounded">Pool: <b id="p">-</b></div><div class="bg-[#1e293b] p-4 rounded">Pool antigo: <b id="pp">-</b></div></div><div class="bg-[#1e293b] p-4 rounded mb-4"><h2 class="font-bold mb-2">Mover do pool</h2><input id="lim" type="number" value="100" class="text-black p-2 rounded"> <input id="lote" type="number" value="50" class="text-black p-2 rounded"><button onclick="mover()" class="bg-blue-600 px-4 py-2 rounded font-bold">MOVER</button><div id="msg" class="mt-2 text-sm"></div></div><script>async function stats(){const r=await fetch('/api/debug');const d=await r.json();document.getElementById('v').innerText=d.vitrine;document.getElementById('p').innerText=d.pool;document.getElementById('pp').innerText=d.poolAntigo||0;}async function mover(){const s=prompt('senha admin');const lim=document.getElementById('lim').value;const lote=document.getElementById('lote').value;const r=await fetch('/api/admin/mover-produtos',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s},body:JSON.stringify({valorLimite:lim,lote})});const d=await r.json();document.getElementById('msg').innerText=d.mensagem||d.error;stats();}stats();</script></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Content-Type": "application/json" };
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (url.pathname === "/" || url.pathname === "/index.html") return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (url.pathname === "/admin.html") return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });

    const db = env.alojinha;

    if (url.pathname === "/api/debug") {
      try {
        const vitrine = await db.prepare(`SELECT COUNT(*) as c FROM produtos`).first().catch(()=>({c:0}));
        const pool = await db.prepare(`SELECT COUNT(*) as c FROM produtos_coleposte`).first().catch(()=>({c:0}));
        const poolAntigo = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool`).first().catch(()=>({c:0}));
        return new Response(JSON.stringify({ vitrine: vitrine.c, pool: pool.c, poolAntigo: poolAntigo.c, amazon_tag: AMAZON_TAG, shopee_id: SHOPEE_ID }), { headers });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }

    if (url.pathname === "/api/produtos") {
      try {
        const bloco4h = Math.floor(Date.now() / (4*3600*1000));
        let resultados = [];
        try {
          const { results } = await db.prepare(`SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma FROM produtos WHERE ativo=1 AND imagem IS NOT NULL AND imagem!='' AND preco_numero BETWEEN 20 AND 200 ORDER BY ((id + ?) % 1000) LIMIT 12`).bind(bloco4h).all();
          if (results?.length) resultados = results;
        } catch {}
        if (!resultados.length) {
          try {
            const { results } = await db.prepare(`SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma FROM produtos WHERE ativo=1 AND imagem IS NOT NULL AND imagem!='' ORDER BY id DESC LIMIT 12`).all();
            if (results?.length) resultados = results;
          } catch {}
        }
        if (!resultados.length) {
          try {
            const { results } = await db.prepare(`SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma FROM produtos_pool WHERE ativo=1 AND imagem IS NOT NULL AND imagem!='' ORDER BY id DESC LIMIT 12`).all();
            if (results?.length) resultados = results;
          } catch {}
        }
        if (!resultados.length) {
          const vitrine = await db.prepare(`SELECT COUNT(*) as c FROM produtos`).first().catch(()=>({c:0}));
          const pool = await db.prepare(`SELECT COUNT(*) as c FROM produtos_coleposte`).first().catch(()=>({c:0}));
          return new Response(JSON.stringify({ produtos: [], debug: { vitrine: vitrine.c, pool: pool.c, msg: "vitrine vazia" } }), { headers });
        }
        return new Response(JSON.stringify(resultados), { headers });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }

    // ENDPOINT QUE O TAMPERMONKEY USA - AGORA EXISTE
    if (url.pathname === "/api/produtos_pool" && request.method === "POST") {
      try {
        const b = await request.json();
        await db.prepare(`CREATE TABLE IF NOT EXISTS produtos_pool (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, preco TEXT NOT NULL, preco_numero REAL, imagem TEXT, link_afiliado TEXT NOT NULL, plataforma TEXT NOT NULL, nicho TEXT, emoji TEXT, ativo INTEGER DEFAULT 1, criado_em TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
        const rawLink = b.link_afiliado || b.url_produto || b.link || "";
        const finalLink = limparEConverter(rawLink, b.plataforma || "");
        const existe = await db.prepare(`SELECT id FROM produtos_pool WHERE link_afiliado=?`).bind(finalLink).first();
        if (existe) return new Response(JSON.stringify({ ok: false, msg: "já existe", id: existe.id }), { headers });
        await db.prepare(`INSERT INTO produtos_pool (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, emoji, ativo) VALUES (?,?,?,?,?,?,?,?,1)`).bind(b.titulo?.slice(0,200) || "Achadinho", b.preco || "Consultar", b.preco_numero || 0, b.imagem || b.imagem_url || "", finalLink, b.plataforma || "Outra", b.nicho || "geral", b.emoji || "🔥").run();
        return new Response(JSON.stringify({ ok: true, link: finalLink }), { headers });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
    }

    if (url.pathname === "/api/salva-produto" && request.method === "POST") {
      try {
        const b = await request.json();
        if (!b.titulo || !b.url_produto) return new Response(JSON.stringify({ error: "incompleto" }), { status: 400, headers });
        const finalLink = limparEConverter(b.url_produto, b.loja || "");
        await db.prepare(`CREATE TABLE IF NOT EXISTS produtos_coleposte (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, preco TEXT, preco_numero REAL, url_produto TEXT, imagem_url TEXT, loja TEXT, nicho TEXT)`).run();
        await db.prepare(`INSERT INTO produtos_coleposte (titulo, preco, preco_numero, url_produto, imagem_url, loja, nicho) VALUES (?,?,?,?,?,?,?)`).bind(b.titulo.slice(0,200), b.preco || "Consultar", b.preco_numero || 0, finalLink, b.imagem_url || "", b.loja || "Outra", b.nicho || "geral").run();
        return new Response(JSON.stringify({ success: true, link: finalLink }), { headers });
      } catch(e){ return new Response(JSON.stringify({error:e.message}),{status:500,headers}); }
    }

    if (url.pathname === "/api/admin/mover-produtos" && request.method === "POST") {
      const auth=request.headers.get("Authorization");
      if(auth!==`Bearer ${env.ADMIN_PASSWORD}`) return new Response(JSON.stringify({error:"senha incorreta"}),{status:401,headers});
      try{
        const body=await request.json(); const limite=parseFloat(body.valorLimite)||100; const lote=parseInt(body.lote)||50;
        const { results } = await db.prepare(`SELECT id, titulo, preco, preco_numero, url_produto, imagem_url, loja, nicho FROM produtos_coleposte WHERE preco_numero < ? AND imagem_url IS NOT NULL AND imagem_url!='' LIMIT ?`).bind(limite,lote).all();
        let mov=0; for(const prod of results){ const finalLink = limparEConverter(prod.url_produto, prod.loja); let plat=prod.loja.toLowerCase().replace('magazine luiza','magalu').replace('mercado livre','mercadolivre'); await db.prepare(`INSERT INTO produtos (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, ativo) VALUES (?,?,?,?,?,?,?,1)`).bind(prod.titulo,prod.preco,prod.preco_numero,prod.imagem_url,finalLink,plat,prod.nicho||'geral').run(); await db.prepare(`DELETE FROM produtos_coleposte WHERE id=?`).bind(prod.id).run(); mov++; }
        return new Response(JSON.stringify({success:true,movidos:mov,mensagem:`Movidos ${mov} produtos com ${AMAZON_TAG}`}),{headers});
      }catch(e){ return new Response(JSON.stringify({error:e.message}),{status:500,headers}); }
    }

    return new Response(JSON.stringify({message:"aLojinha API Rodando", tag: AMAZON_TAG, shopee: SHOPEE_ID}),{headers});
  }
};
