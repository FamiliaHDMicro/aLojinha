// ============================================
// worker.js CORRIGIDO - aLojinha
// binding: alojinha -> coleposte-db (fa0ab338...)
// ============================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>aLojinha - Ofertas Relâmpago</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            ml: { bg: '#0f1724', card: '#1e293b', primary: '#2563eb', primaryHover: '#3b82f6', success: '#10b981', text: '#f5f7fa', textMuted: '#94a3b8', border: '#334155' }
          }
        }
      }
    }
  </script>
  <style>
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-in { animation: slideIn 0.4s ease-out; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-ml-bg text-ml-text min-h-screen font-sans">
  <header class="bg-ml-primary p-4 shadow-lg sticky top-0 z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <h1 class="text-2xl font-bold flex items-center gap-2 text-white">🛍 aLojinha</h1>
      <span class="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold animate-pulse">OFERTAS A CADA 4H</span>
    </div>
  </header>
  <main class="max-w-6xl mx-auto p-4">
    <div id="loading" class="text-center py-20 text-ml-textMuted text-lg">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ml-primary mx-auto mb-4"></div>
      Buscando as melhores ofertas...
    </div>
    <div id="vitrine" class="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
    <div id="vitrine-mobile" class="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide"></div>
  </main>
  <footer class="bg-ml-card text-ml-textMuted text-center p-6 mt-8 border-t border-ml-border">
    <p class="text-sm">© 2026 aLojinha • Ofertas atualizadas automaticamente a cada 4 horas</p>
    <p class="text-xs mt-1">Feito com 💙 por Luis & Qwen</p>
  </footer>
  <script>
    const API_URL = window.location.origin;
    async function carregarVitrine() {
      try {
        const res = await fetch(API_URL + '/api/produtos');
        const data = await res.json();
        const produtos = Array.isArray(data) ? data : (data.produtos || []);
        document.getElementById('loading').classList.add('hidden');
        const containerDesktop = document.getElementById('vitrine');
        const containerMobile = document.getElementById('vitrine-mobile');
        if (!produtos || produtos.length === 0) {
          const msg = data.debug ? 'Debug: ' + JSON.stringify(data.debug) : 'Nenhuma oferta agora. Use o /admin.html > MOVER PRODUTOS';
          containerDesktop.innerHTML = '<p class="col-span-full text-center py-10 text-ml-textMuted">'+msg+'</p>';
          containerDesktop.classList.remove('hidden');
          return;
        }
        containerDesktop.classList.remove('hidden');
        produtos.forEach(p => {
          let badgeClass = "bg-gray-700";
          let lojaNome = p.plataforma || "Loja";
          if(lojaNome.includes('shopee')) badgeClass = "bg-orange-500";
          else if(lojaNome.includes('amazon')) badgeClass = "bg-yellow-500 text-black";
          else if(lojaNome.includes('magalu')) badgeClass = "bg-blue-500";
          else if(lojaNome.includes('mercado')) badgeClass = "bg-yellow-400 text-black";
          const cardHTML = '<div class="bg-ml-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col snap-center min-w-[85vw] md:min-w-0 border border-ml-border animate-slide-in"><div class="relative"><span class="absolute top-2 left-2 ' + badgeClass + ' text-white text-xs font-bold px-2 py-1 rounded shadow">' + lojaNome + '</span><img src="' + (p.imagem || 'https://via.placeholder.com/400x300?text=Sem+Imagem') + '" alt="' + (p.titulo||'').replace(/"/g,'') + '" class="w-full h-48 object-cover bg-gray-800" onerror="this.src=\\'https://via.placeholder.com/400x300?text=Sem+Imagem\\'"></div><div class="p-4 flex-1 flex flex-col"><h3 class="font-semibold text-ml-text line-clamp-2 mb-2 flex-1 text-sm leading-relaxed">' + p.titulo + '</h3><p class="text-2xl font-bold text-ml-success mb-4">R$ ' + (parseFloat(p.preco_numero || p.preco) || 0).toFixed(2).replace('.', ',') + '</p><a href="' + p.link_afiliado + '" target="_blank" rel="noopener noreferrer" class="w-full bg-ml-primary hover:bg-ml-primaryHover text-white font-bold py-3 px-4 rounded-lg text-center transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">COMPRAR AGORA 🛒</a></div></div>';
          containerDesktop.innerHTML += cardHTML;
          containerMobile.innerHTML += cardHTML;
        });
      } catch (error) {
        console.error("Erro:", error);
        document.getElementById('loading').innerText = "Erro ao carregar ofertas: " + error.message;
      }
    }
    carregarVitrine();
  </script>
</body>
</html>`;

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>aLojinha - Painel</title><script src="https://cdn.tailwindcss.com"></script>
  <style>.animate-slide-in{animation:slideIn .4s ease-out}@keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style>
</head>
<body class="bg-[#0f1724] text-[#f5f7fa] min-h-screen font-sans">
  <header class="bg-[#2563eb] p-4 shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <h1 class="text-xl font-bold">🛍 aLojinha - Painel</h1>
      <div class="flex gap-2"><span class="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold">ADMIN</span><button onclick="window.open('/','_blank')" class="text-xs bg-white/20 px-3 py-1.5 rounded-full">Ver Site 🌐</button></div>
    </div>
  </header>
  <main class="max-w-7xl mx-auto p-4 space-y-6">
    <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#1e293b] rounded-xl p-5 border border-[#334155]"><div class="text-sm text-[#94a3b8]">Vitrine</div><div class="text-3xl font-bold text-[#10b981]" id="totalVitrine">-</div></div>
      <div class="bg-[#1e293b] rounded-xl p-5 border border-[#334155]"><div class="text-sm text-[#94a3b8]">Pool (coleposte)</div><div class="text-3xl font-bold text-[#f59e0b]" id="totalPool">-</div></div>
      <div class="bg-[#1e293b] rounded-xl p-5 border border-[#334155]"><div class="text-sm">Status</div><div class="text-xl font-bold text-[#10b981]">Ativo</div><div class="text-xs" id="ultimaCaptura">-</div></div>
      <div class="bg-[#1e293b] rounded-xl p-5 border border-[#334155]"><div class="text-sm">Rodízio</div><div class="text-xl font-bold" id="blocoAtual">--</div><div class="text-xs" id="proximaTroca">--</div></div>
    </section>
    <section class="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
      <h2 class="font-bold text-yellow-400 mb-4">🚀 Transferir do Pool para Vitrine</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label class="text-sm">Valor Máximo R$</label><input type="number" id="valorLimite" value="100" class="bg-[#0f1724] border border-[#334155] rounded-lg p-3 text-white w-full"></div>
        <div><label class="text-sm">Lote</label><input type="number" id="loteSize" value="50" class="bg-[#0f1724] border border-[#334155] rounded-lg p-3 text-white w-full"></div>
        <div class="flex items-end"><button onclick="moverProdutos()" class="w-full bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold py-3 rounded-lg">MOVER PRODUTOS</button></div>
      </div>
      <div id="resultadoMover" class="bg-[#0f1724] p-4 rounded-lg hidden border mt-4"><p id="msgMover"></p></div>
    </section>
  </main>
  <script>
    const API_URL = location.origin;
    function atualizarRodizio(){
      const agora=new Date(); const bloco4h=Math.floor(agora.getTime()/(4*3600*1000));
      const proximo=(bloco4h+1)*4*3600*1000; const rest=proximo-agora.getTime();
      const h=Math.floor(rest/3600000), m=Math.floor((rest%3600000)/60000), s=Math.floor((rest%60000)/1000);
      document.getElementById('blocoAtual').innerText='Bloco '+(bloco4h%6);
      document.getElementById('proximaTroca').innerText=h+'h '+m+'m '+s+'s';
    }
    async function moverProdutos(){
      const senha=prompt("Senha admin:"); if(!senha) return;
      const valorLimite=document.getElementById('valorLimite').value||100;
      const lote=document.getElementById('loteSize').value||50;
      if(!confirm('Mover até R$ '+valorLimite+' lote '+lote+'?')) return;
      try{
        const res=await fetch(API_URL+'/api/admin/mover-produtos',{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+senha},body:JSON.stringify({valorLimite,lote})});
        const data=await res.json();
        document.getElementById('resultadoMover').classList.remove('hidden');
        document.getElementById('msgMover').innerText=data.mensagem||data.error||JSON.stringify(data);
        carregarStats();
      }catch(e){alert(e.message)}
    }
    async function carregarStats(){
      try{
        const res=await fetch(API_URL+'/api/debug'); const d=await res.json();
        document.getElementById('totalVitrine').innerText=d.vitrine ?? 0;
        document.getElementById('totalPool').innerText=d.pool ?? 0;
        document.getElementById('ultimaCaptura').innerText=new Date().toLocaleTimeString();
      }catch(e){}
    }
    setInterval(atualizarRodizio,1000); atualizarRodizio(); carregarStats();
  </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers });

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (url.pathname === "/admin.html") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // DEBUG - mostra contagem real
    if (url.pathname === "/api/debug") {
      try {
        const vitrine = await env.alojinha.prepare(`SELECT COUNT(*) as c FROM produtos`).first();
        const pool = await env.alojinha.prepare(`SELECT COUNT(*) as c FROM produtos_coleposte`).first();
        const vitrineAtivos = await env.alojinha.prepare(`SELECT COUNT(*) as c FROM produtos WHERE ativo=1 AND imagem IS NOT NULL AND imagem != ''`).first();
        return new Response(JSON.stringify({ vitrine: vitrine?.c ?? 0, pool: pool?.c ?? 0, vitrineAtivos: vitrineAtivos?.c ?? 0 }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/salva-produto" && request.method === "POST") {
      try {
        const body = await request.json();
        const { titulo, preco, preco_numero, url_produto, descricao, loja, nicho, canal_origem, imagem_url } = body;
        if (!titulo || !url_produto) return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400, headers });
        let plataforma = (loja || "Outra").toLowerCase();
        if (plataforma.includes("magazine")) plataforma = "magalu";
        if (plataforma.includes("mercado")) plataforma = "mercadolivre";
        let linkFinal = url_produto;
        if (plataforma === "shopee" && !linkFinal.includes("aff_id=")) linkFinal += (linkFinal.includes("?") ? "&" : "?") + "aff_id=18338650355";
        else if (plataforma === "amazon" && !linkFinal.includes("tag=")) linkFinal += (linkFinal.includes("?") ? "&" : "?") + "tag=coloposte-20";
        await env.alojinha.prepare(`INSERT INTO produtos (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, ativo, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`).bind(titulo.slice(0, 200), preco || "Consultar", preco_numero || 0, imagem_url || null, linkFinal, plataforma, nicho || "geral").run();
        return new Response(JSON.stringify({ success: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/produtos" && request.method === "GET") {
      try {
        const agora = new Date();
        const bloco4h = Math.floor(agora.getTime() / (4 * 60 * 60 * 1000));
        const faixas = [{ min: 20, max: 50 }, { min: 50, max: 100 }, { min: 10, max: 200 }];
        let resultados = [];
        let debugInfo = {};
        // tenta faixa por faixa
        for (const faixa of faixas) {
          const { results } = await env.alojinha.prepare(`SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma FROM produtos WHERE ativo = 1 AND imagem IS NOT NULL AND imagem != '' AND preco_numero >= ? AND preco_numero <= ? ORDER BY ((id + ?) % 1000) LIMIT 12`).bind(faixa.min, faixa.max, bloco4h).all();
          if (results && results.length >= 4) { resultados = results; debugInfo.faixaUsada = faixa; break; }
          if (results && results.length > resultados.length) resultados = results;
        }
        // FALLBACK: se ainda vazio, pega qualquer produto ativo
        if (!resultados || resultados.length === 0) {
          const { results } = await env.alojinha.prepare(`SELECT id, titulo, preco, preco_numero, imagem, link_afiliado, plataforma FROM produtos WHERE ativo=1 AND imagem IS NOT NULL AND imagem != '' ORDER BY id DESC LIMIT 12`).all();
          resultados = results || [];
          debugInfo.fallback = "sem faixa, pegando ultimos ativos";
        }
        // se ainda vazio, informa debug
        if (resultados.length === 0) {
          const c = await env.alojinha.prepare(`SELECT COUNT(*) as total, COUNT(CASE WHEN ativo=1 THEN 1 END) as ativos, COUNT(CASE WHEN imagem IS NOT NULL AND imagem != '' THEN 1 END) as comImagem FROM produtos`).first();
          return new Response(JSON.stringify({ produtos: [], debug: { ...debugInfo, contagem: c, msg: "vitrine vazia, use /admin.html para mover do pool" } }), { headers });
        }
        return new Response(JSON.stringify(resultados), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers });
      }
    }

    if (url.pathname === "/api/admin/mover-produtos" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401, headers });
      try {
        const body = await request.json();
        const valorLimite = parseFloat(body.valorLimite) || 100;
        const lote = parseInt(body.lote) || 50;
        const { results: origem } = await env.alojinha.prepare(`SELECT id, titulo, preco, preco_numero, url_produto, imagem_url, loja, nicho, emoji FROM produtos_coleposte WHERE preco_numero < ? AND imagem_url IS NOT NULL AND imagem_url != '' AND url_produto IS NOT NULL AND url_produto != '' AND loja IN ('Shopee','Amazon','Magazine Luiza','Mercado Livre') LIMIT ?`).bind(valorLimite, lote).all();
        let movidos = 0;
        for (const prod of origem) {
          try {
            let linkFinal = prod.url_produto;
            if (prod.loja === 'Shopee' && !linkFinal.includes('aff_id=')) linkFinal += (linkFinal.includes('?') ? '&' : '?') + 'aff_id=18338650355';
            else if (prod.loja === 'Amazon' && !linkFinal.includes('tag=')) linkFinal += (linkFinal.includes('?') ? '&' : '?') + 'tag=coloposte-20';
            let plataforma = prod.loja.toLowerCase().replace('magazine luiza', 'magalu').replace('mercado livre', 'mercadolivre');
            await env.alojinha.prepare(`INSERT INTO produtos (titulo, preco, preco_numero, imagem, link_afiliado, plataforma, nicho, emoji, ativo, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`).bind(prod.titulo, prod.preco, prod.preco_numero, prod.imagem_url, linkFinal, plataforma, prod.nicho || 'geral', prod.emoji || '').run();
            await env.alojinha.prepare(`DELETE FROM produtos_coleposte WHERE id = ?`).bind(prod.id).run();
            movidos++;
          } catch {}
        }
        return new Response(JSON.stringify({ success: true, movidos, mensagem: `Movidos ${movidos} produtos do pool pra vitrine` }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ message: "aLojinha API Rodando", endpoints: ["/", "/admin.html", "/api/produtos", "/api/debug", "/api/salva-produto", "/api/admin/mover-produtos"] }), { headers });
  }
};

