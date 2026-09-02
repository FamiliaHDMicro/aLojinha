export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    
    const db = env.alojinha;
    const url = new URL(request.url);
    
    // SEUS IDs - vem do wrangler.toml com aspas
    const TAG = env.AMAZON_TAG || "coloposte-20";
    const SHOPEE = env.SHOPEE_AFF_ID || "18338650355";
    const MAGALU_BASE = env.MAGALU_BASE || "https://www.magazinevoce.com.br/magazinehdmicroloja";

    function cleanLink(link, plat = "") {
      try {
        let u = new URL(link);
        // limpa tudo que não é seu
        ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid","spm","partner_id"].forEach(k=>u.searchParams.delete(k));
        if (u.hostname.includes("amazon") || plat.toLowerCase().includes("amazon")) {
          u.searchParams.set("tag", TAG); return u.toString();
        }
        if (u.hostname.includes("shopee") || plat.toLowerCase().includes("shopee")) {
          u.searchParams.set("aff_id", SHOPEE); return u.toString();
        }
        if (u.hostname.includes("magazineluiza") || u.hostname.includes("magalu") || u.hostname.includes("magazinevoce")) {
          // seu ID é magazinehdmicroloja
          return `${MAGALU_BASE}${u.pathname}`;
        }
        return u.toString();
      } catch { return link; }
    }

    await db.prepare(`CREATE TABLE IF NOT EXISTS produtos (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, preco TEXT, preco_numero REAL, imagem TEXT, link_afiliado TEXT, plataforma TEXT, nicho TEXT, ativo INTEGER DEFAULT 1, publicacao_futura INTEGER DEFAULT 0)`).run();
    await db.prepare(`CREATE TABLE IF NOT EXISTS produtos_pool (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, preco TEXT, preco_numero REAL, imagem TEXT, link_afiliado TEXT, plataforma TEXT, nicho TEXT, ativo INTEGER DEFAULT 1)`).run();

    if (url.pathname === "/" || url.pathname === "/index.html") return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html" } });
    if (url.pathname === "/admin.html") return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html" } });

    if (url.pathname === "/api/debug") {
      const vitrine = await db.prepare(`SELECT COUNT(*) as c, AVG(preco_numero) as media FROM produtos WHERE ativo=1`).first();
      const pool = await db.prepare(`SELECT COUNT(*) as c FROM produtos_pool`).first();
      const agend = await db.prepare(`SELECT COUNT(*) as c FROM produtos WHERE ativo=0`).first();
      return new Response(JSON.stringify({ vitrine: vitrine.c||0, pool: pool.c||0, agendados: agend.c||0, media: vitrine.media||0, tag: TAG, shopee: SHOPEE }), { headers: cors });
    }

    if (url.pathname === "/api/produtos") {
      const agora = Date.now();
      await db.prepare(`UPDATE produtos SET ativo=1 WHERE ativo=0 AND publicacao_futura <=?`).bind(agora).run();
      const { results } = await db.prepare(`SELECT * FROM produtos WHERE ativo=1 ORDER BY id DESC LIMIT 24`).all();
      return new Response(JSON.stringify(results||[]), { headers: cors });
    }

    if (url.pathname === "/api/pool") {
      const { results } = await db.prepare(`SELECT * FROM produtos_pool ORDER BY id DESC LIMIT 100`).all();
      return new Response(JSON.stringify(results||[]), { headers: cors });
    }

    if (url.pathname === "/api/produtos_pool" && request.method === "POST") {
      const b = await request.json();
      // bloqueia seus bloqueados
      if (b.link_afiliado?.includes("canalte.ch") || b.link_afiliado?.includes("terabyteshop") || b.link_afiliado?.includes("tidd.ly")) {
        return new Response(JSON.stringify({ ok: false, motivo: "bloqueado" }), { headers: cors });
      }
      const finalLink = cleanLink(b.link_afiliado || "", b.plataforma || "");
      const existe = await db.prepare(`SELECT id FROM produtos_pool WHERE link_afiliado=? OR link_afiliado=?`).bind(finalLink, b.link_afiliado).first();
      if (existe) return new Response(JSON.stringify({ ok: false, motivo: "duplicado" }), { headers: cors });
      await db.prepare(`INSERT INTO produtos_pool (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho) VALUES (?,?,?,?,?,?,?)`).bind(b.titulo?.slice(0,150)||"Achadinho", b.preco||"Consultar", b.preco_numero||0, b.imagem||"", finalLink, b.plataforma||"Outra", b.nicho||"geral").run();
      return new Response(JSON.stringify({ ok: true, link: finalLink }), { headers: cors });
    }

    if (url.pathname === "/api/admin/mover-produtos" && request.method === "POST") {
      if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_PASSWORD}`) return new Response(JSON.stringify({ error: "senha" }), { status: 401, headers: cors });
      const body = await request.json();
      const { results } = await db.prepare(`SELECT * FROM produtos_pool WHERE preco_numero < ? LIMIT ?`).bind(parseFloat(body.valorLimite)||10000, parseInt(body.lote)||50).all();
      let mov=0; for (const p of results||[]) { const fl=cleanLink(p.link_afiliado,p.plataforma); await db.prepare(`INSERT INTO produtos (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, ativo) VALUES (?,?,?,?,?,?,?,1)`).bind(p.titulo,p.preco,p.preco_numero,p.imagem,fl,p.plataforma,p.nicho).run(); await db.prepare(`DELETE FROM produtos_pool WHERE id=?`).bind(p.id).run(); mov++; }
      return new Response(JSON.stringify({ success: true, movidos: mov }), { headers: cors });
    }

    if (url.pathname === "/api/admin/agendar" && request.method === "POST") {
      if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_PASSWORD}`) return new Response(JSON.stringify({ error: "senha" }), { status: 401, headers: cors });
      const body = await request.json(); const ts = new Date(body.dataFutura).getTime();
      let mov=0; for (const id of body.ids) { const p=await db.prepare(`SELECT * FROM produtos_pool WHERE id=?`).bind(id).first(); if(!p) continue; const fl=cleanLink(p.link_afiliado,p.plataforma); await db.prepare(`INSERT INTO produtos (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, ativo, publicacao_futura) VALUES (?,?,?,?,?,?,?,0,?)`).bind(p.titulo,p.preco,p.preco_numero,p.imagem,fl,p.plataforma,p.nicho,ts).run(); await db.prepare(`DELETE FROM produtos_pool WHERE id=?`).bind(id).run(); mov++; }
      return new Response(JSON.stringify({ success: true, agendados: mov }), { headers: cors });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }
}

const INDEX_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>aLojinha - Ofertas Relâmpago</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-[#0f1724] text-white min-h-screen"><header class="bg-blue-600 p-4 sticky top-0 z-50"><div class="max-w-6xl mx-auto flex justify-between"><h1 class="font-bold text-xl">🛍 aLojinha</h1><span class="bg-yellow-400 text-blue-900 text-xs px-3 py-1 rounded-full font-bold">OFERTAS</span></div></header><main class="max-w-6xl mx-auto p-4"><div id="loading" class="text-center py-20">Carregando ofertas...</div><div id="vitrine" class="grid md:grid-cols-4 gap-4"></div></main><script>async function load(){const r=await fetch('/api/produtos');const p=await r.json();document.getElementById('loading').style.display='none';const v=document.getElementById('vitrine');if(!p.length){v.innerHTML='<div class=col-span-full text-center bg-[#1e293b] p-10 rounded>Sem produtos ainda. Vai em /admin.html e clica em MOVER</div>';return;}v.innerHTML=p.map(x=>'<div class=bg-[#1e293b] rounded overflow-hidden border border-gray-700><img src="'+(x.imagem||'https://via.placeholder.com/300')+'" class="h-48 w-full object-cover"><div class=p-3><span class="text- bg-blue-900 px-2 py-1 rounded">'+(x.plataforma||'')+'</span><h3 class="text-sm mt-2 line-clamp-2">'+x.titulo+'</h3><p class="text-green-400 font-bold mt-2">R$ '+(x.preco_numero||x.preco)+'</p><a href="'+x.link_afiliado+'" target=_blank class="bg-blue-600 block text-center py-2 rounded mt-2 font-bold">COMPRAR</a></div></div>').join('');}load();<\/script></body></html>`;

const ADMIN_HTML = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin aLojinha</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-[#0f1724] text-white p-4"><h1 class="text-2xl font-bold mb-4">🛍 Admin - Só aLojinha (sem coleposte)</h1><div id="stats" class="grid grid-cols-3 gap-4 mb-4"></div><div class="grid md:grid-cols-2 gap-4"><div class="bg-[#1e293b] p-4 rounded"><h2 class="font-bold">Mover Agora pra Vitrine</h2><div class="flex gap-2 mt-2"><input id="lim" value="10000" class="text-black p-2 rounded w-24"><input id="lote" value="50" class="text-black p-2 rounded w-24"><button onclick="mover()" class="bg-blue-600 px-4 py-2 rounded">MOVER</button></div><div id="msg" class="text-sm mt-2 text-yellow-300"></div></div><div class="bg-[#1e293b] p-4 rounded"><h2 class="font-bold">Agendar Futuro (sem cron)</h2><input type="datetime-local" id="dataF" class="text-black p-2 rounded w-full mt-2"><button onclick="agendar()" class="bg-purple-600 w-full mt-2 py-2 rounded font-bold">AGENDAR SELECIONADOS</button><p class="text-xs text-gray-400 mt-1">Libera sozinho quando alguém acessa a loja</p></div></div><div class="bg-[#1e293b] p-4 rounded mt-4"><div class="flex justify-between"><h2 class="font-bold">Pool (produtos capturados)</h2><button onclick="carregar()" class="bg-gray-700 px-3 py-1 rounded text-sm">Recarregar</button></div><div id="pool" class="mt-3 max-h- overflow-auto"></div></div><script>async function stats(){const r=await fetch('/api/debug');const d=await r.json();document.getElementById('stats').innerHTML='<div class=bg-[#1e293b] p-3 rounded>Vitrine: <b>'+d.vitrine+'</b></div><div class=bg-[#1e293b] p-3 rounded>Pool: <b>'+d.pool+'</b></div><div class=bg-[#1e293b] p-3 rounded>Agendados: <b>'+d.agendados+'</b><br>Media R$ '+(d.media||0).toFixed(2)+'<br><span class=text-xs>'+d.tag+'</span></div>';}async function carregar(){const r=await fetch('/api/pool');const l=await r.json();document.getElementById('pool').innerHTML=l.map(p=>'<label class="flex gap-2 py-2 border-b border-gray-700 text-sm"><input type=checkbox class=sel value='+p.id+'><span class=w-20>'+p.preco+'</span><span class=flex-1 truncate>'+p.titulo+'</span><span class="text-xs bg-gray-700 px-2 rounded">'+p.plataforma+'</span></label>').join('');}async function mover(){const s=prompt('senha admin');const r=await fetch('/api/admin/mover-produtos',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s},body:JSON.stringify({valorLimite:document.getElementById('lim').value,lote:document.getElementById('lote').value})});const d=await r.json();document.getElementById('msg').innerText=d.movidos?d.movidos+' movidos!':'Erro: '+d.error;stats();carregar();}async function agendar(){const s=prompt('senha admin');const ids=[...document.querySelectorAll('.sel:checked')].map(e=>e.value);const dataF=document.getElementById('dataF').value;if(!ids.length||!dataF){alert('Seleciona produtos e data!');return;}const r=await fetch('/api/admin/agendar',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s},body:JSON.stringify({ids,dataFutura:dataF})});const d=await r.json();alert(d.agendados+' agendados');stats();carregar();}stats();carregar();<\/script></body></html>`;
