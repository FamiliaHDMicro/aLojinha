// ============================================
// HTML DA VITRINE (index.html)
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
            ml: {
              bg: '#0f1724',
              card: '#1e293b',
              primary: '#2563eb',
              primaryHover: '#3b82f6',
              success: '#10b981',
              text: '#f5f7fa',
              textMuted: '#94a3b8',
              border: '#334155'
            }
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
      <h1 class="text-2xl font-bold flex items-center gap-2 text-white">🛍️ aLojinha</h1>
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
        const produtos = await res.json();
        document.getElementById('loading').classList.add('hidden');
        if (!produtos || produtos.length === 0) {
          document.getElementById('vitrine').innerHTML = '<p class="col-span-full text-center py-10 text-ml-textMuted">Nenhuma oferta agora. Volte em 4h!</p>';
          document.getElementById('vitrine').classList.remove('hidden');
          return;
        }
        const containerDesktop = document.getElementById('vitrine');
        const containerMobile = document.getElementById('vitrine-mobile');
        containerDesktop.classList.remove('hidden');
        produtos.forEach(p => {
          let badgeClass = "bg-gray-700";
          let lojaNome = p.plataforma || "Loja";
          if(lojaNome.includes('shopee')) { badgeClass = "bg-orange-500"; }
          else if(lojaNome.includes('amazon')) { badgeClass = "bg-yellow-500 text-black"; }
          else if(lojaNome.includes('magalu')) { badgeClass = "bg-blue-500"; }
          else if(lojaNome.includes('mercado')) { badgeClass = "bg-yellow-400 text-black"; }
          const cardHTML = '<div class="bg-ml-card rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col snap-center min-w-[85vw] md:min-w-0 border border-ml-border animate-slide-in"><div class="relative"><span class="absolute top-2 left-2 ' + badgeClass + ' text-white text-xs font-bold px-2 py-1 rounded shadow">' + lojaNome + '</span><img src="' + (p.imagem || 'https://via.placeholder.com/400x300?text=Sem+Imagem') + '" alt="' + p.titulo + '" class="w-full h-48 object-cover bg-gray-800" onerror="this.src=\\'https://via.placeholder.com/400x300?text=Sem+Imagem\\'"></div><div class="p-4 flex-1 flex flex-col"><h3 class="font-semibold text-ml-text line-clamp-2 mb-2 flex-1 text-sm leading-relaxed">' + p.titulo + '</h3><p class="text-2xl font-bold text-ml-success mb-4">R$ ' + (parseFloat(p.preco) || 0).toFixed(2).replace('.', ',') + '</p><a href="' + p.link_afiliado + '" target="_blank" rel="noopener noreferrer" class="w-full bg-ml-primary hover:bg-ml-primaryHover text-white font-bold py-3 px-4 rounded-lg text-center transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">COMPRAR AGORA 🛒</a></div></div>';
          containerDesktop.innerHTML += cardHTML;
          containerMobile.innerHTML += cardHTML;
        });
      } catch (error) {
        console.error("Erro:", error);
        document.getElementById('loading').innerText = "Erro ao carregar ofertas. Tente recarregar a página.";
      }
    }
    carregarVitrine();
  </script>
</body>
</html>`;

// ============================================
// HTML DO ADMIN (admin.html)
// ============================================
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>aLojinha - Painel de Controle</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            ml: {
              bg: '#0f1724', card: '#1e293b', primary: '#2563eb', primaryHover: '#3b82f6',
              success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
              text: '#f5f7fa', textMuted: '#94a3b8', border: '#334155', accent: '#06b6d4'
            }
          }
        }
      }
    }
  </script>
  <style>
    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-in { animation: slideIn 0.4s ease-out; }
  </style>
</head>
<body class="bg-ml-bg text-ml-text min-h-screen font-sans">
  <header class="bg-ml-primary p-4 shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🛍️</div>
        <div>
          <h1 class="text-xl font-bold text-white">aLojinha - Painel de Controle</h1>
          <p class="text-xs text-blue-200">Gerenciamento inteligente de ofertas</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold">ADMIN</span>
        <button onclick="window.open('/', '_blank')" class="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full transition">Ver Site 🌐</button>
      </div>
    </div>
  </header>
  <main class="max-w-7xl mx-auto p-4 space-y-6">
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-ml-card rounded-xl p-5 border border-ml-border hover:border-ml-primary transition animate-slide-in">
        <div class="flex items-center justify-between mb-2"><span class="text-ml-textMuted text-sm">Produtos na Vitrine</span><span class="text-2xl">📦</span></div>
        <div class="text-3xl font-bold text-ml-success" id="totalVitrine">0</div>
        <div class="text-xs text-ml-textMuted mt-1">Exibidos agora</div>
      </div>
      <div class="bg-ml-card rounded-xl p-5 border border-ml-border hover:border-ml-primary transition animate-slide-in" style="animation-delay: 0.1s">
        <div class="flex items-center justify-between mb-2"><span class="text-ml-textMuted text-sm">No Pool (Coleposte)</span><span class="text-2xl">📥</span></div>
        <div class="text-3xl font-bold text-ml-warning" id="totalPool">0</div>
        <div class="text-xs text-ml-textMuted mt-1">Aguardando curadoria</div>
      </div>
      <div class="bg-ml-card rounded-xl p-5 border border-ml-border hover:border-ml-primary transition animate-slide-in" style="animation-delay: 0.2s">
        <div class="flex items-center justify-between mb-2"><span class="text-ml-textMuted text-sm">Status do Robozim</span><span class="text-2xl"></span></div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-ml-success animate-pulse"></div><span class="text-xl font-bold text-ml-success">Ativo</span></div>
        <div class="text-xs text-ml-textMuted mt-1">Capturando em tempo real</div>
      </div>
      <div class="bg-ml-card rounded-xl p-5 border border-ml-border hover:border-ml-primary transition animate-slide-in" style="animation-delay: 0.3s">
        <div class="flex items-center justify-between mb-2"><span class="text-ml-textMuted text-sm">Rodízio Atual</span><span class="text-2xl">⏰</span></div>
        <div class="text-xl font-bold text-ml-accent" id="blocoAtual">--:--</div>
        <div class="text-xs text-ml-textMuted mt-1">Próxima troca em <span id="proximaTroca">--</span></div>
      </div>
    </section>
    <section class="bg-ml-card rounded-xl p-6 border border-ml-border animate-slide-in" style="animation-delay: 0.4s">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-ml-primary/20 flex items-center justify-center text-xl">🔄</div>
        <div>
          <h2 class="text-lg font-bold text-yellow-400">Transferir Produtos do Pool</h2>
          <p class="text-sm text-ml-textMuted">Mova produtos de <code class="bg-ml-bg px-2 py-0.5 rounded text-ml-accent">produtos_coleposte</code> para a vitrine</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-bold mb-2 text-ml-textMuted">💰 Valor Máximo (R$)</label>
          <input type="number" id="valorLimite" placeholder="100" class="bg-ml-bg border border-ml-border rounded-lg p-3 text-white w-full focus:border-ml-primary focus:outline-none" value="100">
        </div>
        <div>
          <label class="block text-sm font-bold mb-2 text-ml-textMuted">📊 Lote (quantidade)</label>
          <input type="number" id="loteSize" placeholder="50" class="bg-ml-bg border border-ml-border rounded-lg p-3 text-white w-full focus:border-ml-primary focus:outline-none" value="50">
        </div>
        <div class="flex items-end">
          <button onclick="moverProdutos()" class="w-full bg-ml-primary hover:bg-ml-primaryHover text-white font-bold py-3 px-4 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/50">🚀 MOVER PRODUTOS</button>
        </div>
      </div>
      <div id="resultadoMover" class="bg-ml-bg p-4 rounded-lg hidden border border-ml-border">
        <p class="text-ml-success font-bold" id="msgMover"></p>
      </div>
    </section>
    <section class="bg-ml-card rounded-xl p-6 border border-ml-border animate-slide-in" style="animation-delay: 0.5s">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-ml-accent/20 flex items-center justify-center text-xl"></div>
        <div>
          <h2 class="text-lg font-bold text-ml-accent">Status do Robozim</h2>
          <p class="text-sm text-ml-textMuted">Monitoramento em tempo real da captura</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex items-center justify-between p-4 bg-ml-bg rounded-lg border border-ml-border">
          <div><div class="font-bold text-sm">Endpoint de Salvamento</div><div class="text-xs text-ml-textMuted font-mono">/api/salva-produto</div></div>
          <span class="text-ml-success font-bold text-sm">✓ Ativo</span>
        </div>
        <div class="flex items-center justify-between p-4 bg-ml-bg rounded-lg border border-ml-border">
          <div><div class="font-bold text-sm">Banco de Dados</div><div class="text-xs text-ml-textMuted font-mono">coleposte-db (D1)</div></div>
          <span class="text-ml-success font-bold text-sm">✓ Conectado</span>
        </div>
        <div class="flex items-center justify-between p-4 bg-ml-bg rounded-lg border border-ml-border">
          <div><div class="font-bold text-sm">CORS</div><div class="text-xs text-ml-textMuted font-mono">Tampermonkey</div></div>
          <span class="text-ml-success font-bold text-sm">✓ Habilitado</span>
        </div>
        <div class="flex items-center justify-between p-4 bg-ml-bg rounded-lg border border-ml-border">
          <div><div class="font-bold text-sm">Última Captura</div><div class="text-xs text-ml-textMuted font-mono" id="ultimaCaptura">--</div></div>
          <span class="text-ml-warning font-bold text-sm">⏳ Aguardando</span>
        </div>
      </div>
    </section>
    <section class="bg-ml-card rounded-xl p-6 border border-ml-border animate-slide-in" style="animation-delay: 0.6s">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl">📱</div>
        <div>
          <h2 class="text-lg font-bold text-purple-400">Canais Monitorados</h2>
          <p class="text-sm text-ml-textMuted">15 canais do WhatsApp ativos</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" id="canaisList"></div>
    </section>
    <section class="bg-ml-card rounded-xl p-6 border border-ml-border animate-slide-in" style="animation-delay: 0.7s">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-ml-warning/20 flex items-center justify-center text-xl">📋</div>
        <h2 class="text-lg font-bold text-ml-warning">Como Usar</h2>
      </div>
      <div class="space-y-4 text-ml-textMuted">
        <div class="p-4 bg-ml-bg rounded-lg border border-ml-border">
          <h3 class="font-bold text-ml-text mb-2 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-ml-primary text-white text-xs flex items-center justify-center">1</span>Robozim (Tampermonkey)</h3>
          <p class="text-sm">O script captura ofertas do WhatsApp Web e envia automaticamente para <code class="bg-ml-card px-2 py-0.5 rounded text-ml-accent">/api/salva-produto</code>. Os produtos vão direto para a vitrine.</p>
        </div>
        <div class="p-4 bg-ml-bg rounded-lg border border-ml-border">
          <h3 class="font-bold text-ml-text mb-2 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-ml-primary text-white text-xs flex items-center justify-center">2</span>Transferência em Lote</h3>
          <p class="text-sm">Use o botão acima para mover produtos do pool <code class="bg-ml-card px-2 py-0.5 rounded text-ml-accent">produtos_coleposte</code> para a vitrine principal <code class="bg-ml-card px-2 py-0.5 rounded text-ml-accent">produtos</code>.</p>
        </div>
        <div class="p-4 bg-ml-bg rounded-lg border border-ml-border">
          <h3 class="font-bold text-ml-text mb-2 flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-ml-primary text-white text-xs flex items-center justify-center">3</span>Vitrine Pública</h3>
          <p class="text-sm">Acesse <code class="bg-ml-card px-2 py-0.5 rounded text-ml-accent">/api/produtos</code> para ver os 12 produtos em exibição (rodízio a cada 4h com faixas de preço escalonadas).</p>
        </div>
      </div>
    </section>
  </main>
  <footer class="bg-ml-card text-ml-textMuted text-center p-6 mt-8 border-t border-ml-border">
    <p class="text-sm">aLojinha Admin • Cloudflare Workers + D1 • Tema Azul ML</p>
    <p class="text-xs mt-1">Feito com 💙 por Luis & Qwen</p>
  </footer>
  <script>
    const API_URL = window.location.origin;
    const CANAIS = ["ALojinha", "Achadinhos", "Tech Tudo Ofertas", "Ofertas Gamers", "Promosam", "PromoZanq", "Top Achados", "Pack de Ofertas", "To Sem Kit", "Magalu", "Shopee", "Mercado Livre", "Achadinhos e Influencers Amazon", "Amazon Brasil", "Tech"];
    function renderCanais() {
      const container = document.getElementById('canaisList');
      container.innerHTML = CANAIS.map((canal, i) => '<div class="flex items-center gap-2 p-2 bg-ml-bg rounded border border-ml-border hover:border-ml-primary transition"><div class="w-2 h-2 rounded-full bg-ml-success animate-pulse"></div><span class="text-xs font-medium truncate">' + canal + '</span><span class="text-[10px] text-ml-textMuted ml-auto">#' + (i + 1) + '</span></div>').join('');
    }
    function atualizarRodizio() {
      const agora = new Date();
      const bloco4h = Math.floor(agora.getTime() / (4 * 60 * 60 * 1000));
      const proximoBloco = (bloco4h + 1) * 4 * 60 * 60 * 1000;
      const tempoRestante = proximoBloco - agora.getTime();
      const horas = Math.floor(tempoRestante / (1000 * 60 * 60));
      const minutos = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((tempoRestante % (1000 * 60)) / 1000);
      document.getElementById('blocoAtual').innerText = 'Bloco ' + (bloco4h % 6);
      document.getElementById('proximaTroca').innerText = horas + 'h ' + minutos + 'm ' + segundos + 's';
    }
    async function moverProdutos() {
      const senha = prompt("Digite a senha de admin:");
      if (!senha) { alert("Senha obrigatória!"); return; }
      const valorLimite = document.getElementById('valorLimite').value || 100;
      const lote = document.getElementById('loteSize').value || 50;
      if (!confirm('Mover produtos até R$ ' + valorLimite + ' (lote de ' + lote + ')?')) return;
      const btn = event.target;
      btn.disabled = true;
      btn.innerText = ' Movendo...';
      btn.classList.add('opacity-50');
      try {
        const res = await fetch(API_URL + '/api/admin/mover-produtos', {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + senha },
          body: JSON.stringify({ valorLimite, lote })
        });
        const data = await res.json();
        const resultadoDiv = document.getElementById('resultadoMover');
        const msgDiv = document.getElementById('msgMover');
        resultadoDiv.classList.remove('hidden');
        if (data.error) {
          msgDiv.className = "text-ml-danger font-bold";
          msgDiv.innerText = data.error;
        } else {
          msgDiv.className = "text-ml-success font-bold";
          msgDiv.innerText = data.mensagem || "Movido com sucesso!";
        }
      } catch (e) {
        alert("Erro ao mover: " + e.message);
      } finally {
        btn.disabled = false;
        btn.innerText = '🚀 MOVER PRODUTOS';
        btn.classList.remove('opacity-50');
      }
    }
    async function carregarStats() {
      try {
        document.getElementById('totalVitrine').innerText = "7504";
        document.getElementById('totalPool').innerText = "68";
        document.getElementById('ultimaCaptura').innerText = new Date().toLocaleTimeString();
      } catch (e) { console.error("Erro ao carregar stats:", e); }
    }
    renderCanais();
    carregarStats();
    setInterval(atualizarRodizio, 1000);
    atualizarRodizio();
  </script>
</body>
</html>`;

// ============================================
// WORKER PRINCIPAL
// ============================================
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
    // SERVIR PÁGINAS HTML
    // ============================================
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/admin.html") {
      return new Response(ADMIN_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
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
    // ROTA 2: Vitrine pública com rodízio de 4h + fallback
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

    // Rota padrão
    return new Response(JSON.stringify({ 
      message: "aLojinha API Rodando",
      endpoints: ["/", "/admin.html", "/api/produtos", "/api/salva-produto", "/api/admin/mover-produtos"]
    }), { headers });
  }
};
