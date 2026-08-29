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

      try {
        const { results } = await env.alojinha.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(results), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erro no D1: " + e.message }), { status: 500, headers });
      }
    }

    // 2. API: Salvar os 12 produtos na vitrine (Admin)
    if (url.pathname === "/api/admin/salvar_vitrine" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401, headers });
      }

      const produtos = await request.json();
      if (!Array.isArray(produtos) || produtos.length > 12) {
        return new Response(JSON.stringify({ error: "Máximo de 12 produtos" }), { status: 400, headers });
      }

      try {
        await env.alojinha.prepare("DELETE FROM microloja_vitrine").run();
        for (const p of produtos) {
          let linkFinal = p.link;
          if (p.plataforma === "shopee" && !linkFinal.includes("aff_id=")) {
            linkFinal += (linkFinal.includes("?") ? "&" : "?") + "aff_id=18338650355";
          } else if (p.plataforma === "amazon" && !linkFinal.includes("tag=")) {
            linkFinal += (linkFinal.includes("?") ? "&" : "?") + "tag=coloposte-20";
          }

          await env.alojinha.prepare(`
            INSERT INTO microloja_vitrine (id, titulo, preco, imagem, link_afiliado, plataforma, ativo)
            VALUES (?, ?, ?, ?, ?, ?, 1)
          `).bind(p.id, p.titulo, p.preco, p.imagem, linkFinal, p.plataforma).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erro ao salvar: " + e.message }), { status: 500, headers });
      }
    }

    // 3. API: Buscar produtos da vitrine (Pública)
    if (url.pathname === "/api/produtos" && request.method === "GET") {
      try {
        const { results } = await env.alojinha.prepare(`
          SELECT id, titulo, preco, imagem, link_afiliado, plataforma 
          FROM microloja_vitrine 
          WHERE ativo = 1 
          ORDER BY id 
          LIMIT 12
        `).all();
        return new Response(JSON.stringify(results), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Erro no D1: " + e.message }), { status: 500, headers });
      }
    }

    // 4. API: Mover produtos em lote (Admin)
    if (url.pathname === "/api/admin/mover-produtos" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response(JSON.stringify({ error: "Senha incorreta" }), { status: 401, headers });
      }

      const body = await request.json();
      const valorLimite = parseFloat(body.valorLimite) || 100;
      const lote = parseInt(body.lote) || 50;

      try {
        // Busca produtos do coleposte-db
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

        // Move cada produto
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

            // Apaga do coleposte-db
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

    // 5. Servir o HTML da Vitrine (Pública)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(VITRINE_HTML, { headers: { "Content-Type": "text/html" } });
    }

    // 6. Servir o HTML do Admin (Painel)
    if (url.pathname === "/admin" || url.pathname === "/admin.html") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("aLojinha API Rodando. Acesse / para a loja e /admin para o painel.", { 
      headers: { "Content-Type": "text/plain" } 
    });
  }
};

// ==========================================
// HTML DA VITRINE (aLojinha)
// ==========================================
const VITRINE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>aLojinha - Ofertas Relâmpago</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen">
  <header class="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <h1 class="text-2xl font-bold flex items-center gap-2">🛍️ aLojinha</h1>
      <span class="text-xs bg-yellow-400 text-blue-900 px-2 py-1 rounded font-bold animate-pulse">OFERTAS A CADA 4H</span>
    </div>
  </header>
  <main class="max-w-6xl mx-auto p-4">
    <div id="loading" class="text-center py-20 text-gray-500">Carregando ofertas...</div>
    <div id="vitrine" class="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
    <div id="vitrine-mobile" class="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-hide"></div>
  </main>
  <footer class="bg-gray-900 text-gray-400 text-center p-6 mt-8 text-sm">
    <p>© 2026 aLojinha. Todos os direitos reservados.</p>
  </footer>
  <script>
    const API_URL = window.location.origin;
    async function carregarVitrine() {
      try {
        const res = await fetch(\`\${API_URL}/api/produtos\`);
        const produtos = await res.json();
        document.getElementById('loading').classList.add('hidden');
        if (produtos.length === 0) {
          document.getElementById('vitrine').innerHTML = '<p class="col-span-full text-center py-10">Nenhuma oferta agora. Volte em 4h!</p>';
          return;
        }
        const containerDesktop = document.getElementById('vitrine');
        const containerMobile = document.getElementById('vitrine-mobile');
        containerDesktop.classList.remove('hidden');
        produtos.forEach(p => {
          const badge = p.plataforma === 'shopee' 
            ? '<span class="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">Shopee</span>'
            : '<span class="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">Amazon</span>';
          const cardHTML = \`
            <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col snap-center min-w-[85vw] md:min-w-0">
              <div class="relative">
                \${badge}
                <img src="\${p.imagem}" alt="\${p.titulo}" class="w-full h-48 object-cover bg-gray-200">
              </div>
              <div class="p-4 flex-1 flex flex-col">
                <h3 class="font-semibold text-gray-800 line-clamp-2 mb-2 flex-1">\${p.titulo}</h3>
                <p class="text-2xl font-bold text-green-600 mb-4">R$ \${parseFloat(p.preco).toFixed(2)}</p>
                <a href="\${p.link_afiliado}" target="_blank" rel="noopener noreferrer" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors flex items-center justify-center gap-2">COMPRAR AGORA 🛒</a>
              </div>
            </div>
          \`;
          containerDesktop.innerHTML += cardHTML;
          containerMobile.innerHTML += cardHTML;
        });
      } catch (error) {
        console.error("Erro:", error);
        document.getElementById('loading').innerText = "Erro ao carregar.";
      }
    }
    carregarVitrine();
  <\/script>
</body>
</html>`;

// ==========================================
// HTML DO PAINEL ADMIN
// ==========================================
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Painel Admin - aLojinha</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
</head>
<body class="bg-gray-900 text-white min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-yellow-400">🛠️ Painel de Controle - aLojinha</h1>
    
    <div class="bg-gray-800 p-4 rounded-lg mb-6 flex items-center gap-4">
      <label class="font-bold text-yellow-400">🔒 Senha:</label>
      <input type="password" id="adminSenha" placeholder="Digite a senha do admin" class="bg-gray-700 p-2 rounded text-white flex-1 border border-gray-600 focus:border-yellow-400 outline-none">
    </div>

    <!-- Transferência de Produtos -->
    <div class="bg-gray-800 p-6 rounded-lg mb-6 border-2 border-yellow-500">
      <h2 class="text-2xl font-bold mb-4 text-yellow-400">🔄 Transferir Produtos</h2>
      <p class="text-gray-400 mb-4">Mova produtos do coleposte-db para aLojinha (apenas com imagem)</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-bold mb-2">Valor Máximo (R$)</label>
          <input type="number" id="valorLimite" placeholder="100" class="bg-gray-700 p-2 rounded text-white w-full" value="100">
        </div>
        <div>
          <label class="block text-sm font-bold mb-2">Lote (quantidade)</label>
          <input type="number" id="loteSize" placeholder="50" class="bg-gray-700 p-2 rounded text-white w-full" value="50">
        </div>
        <div class="flex items-end">
          <button onclick="moverProdutos()" id="btnMover" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
            🚀 MOVER PRODUTOS
          </button>
        </div>
      </div>

      <div id="resultadoMover" class="bg-gray-900 p-4 rounded hidden">
        <p class="text-green-400 font-bold" id="msgMover"></p>
      </div>
    </div>

    <div class="bg-gray-800 p-6 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <input type="number" id="minPrice" placeholder="Preço Mínimo" class="bg-gray-700 p-2 rounded text-white">
      <input type="number" id="maxPrice" placeholder="Preço Máximo" class="bg-gray-700 p-2 rounded text-white">
      <input type="text" id="seller" placeholder="Seller" class="bg-gray-700 p-2 rounded text-white">
      <select id="platform" class="bg-gray-700 p-2 rounded text-white">
        <option value="">Todas</option>
        <option value="shopee">Shopee</option>
        <option value="amazon">Amazon</option>
      </select>
      <button onclick="buscarProdutos()" class="md:col-span-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"> Buscar no D1</button>
    </div>

    <div class="bg-gray-800 p-6 rounded-lg">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Selecione até 12 produtos</h2>
        <span id="contador" class="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">0 / 12</span>
      </div>
      
      <div id="listaProdutos" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
        <p class="text-gray-400 col-span-3 text-center py-8">Use os filtros acima para buscar.</p>
      </div>

      <button onclick="salvarVitrine()" class="mt-6 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded text-lg">✅ PUBLICAR NA VITRINE</button>
    </div>
  </div>

  <script>
    const API_URL = window.location.origin;
    let selecionados = [];

    async function buscarProdutos() {
      const min = document.getElementById('minPrice').value || 0;
      const max = document.getElementById('maxPrice').value || 99999;
      const seller = document.getElementById('seller').value;
      const platform = document.getElementById('platform').value;

      const url = \`\${API_URL}/api/admin/produtos?min=\${min}&max=\${max}&seller=\${seller}&platform=\${platform}\`;
      try {
        const res = await fetch(url);
        const produtos = await res.json();
        const container = document.getElementById('listaProdutos');
        container.innerHTML = '';

        produtos.forEach(p => {
          const div = document.createElement('div');
          div.className = "bg-gray-700 p-4 rounded flex items-start gap-3 border border-gray-600 hover:border-yellow-400 transition";
          div.innerHTML = \`
            <input type="checkbox" class="mt-1 w-5 h-5 accent-yellow-500" value="\${p.id}" onchange="toggleProduto(this, '\${p.id}', '\${p.titulo}', '\${p.preco}', '\${p.imagem}', '\${p.link}', '\${p.plataforma}')">
            <div class="flex-1">
              <img src="\${p.imagem}" class="w-full h-32 object-cover rounded mb-2 bg-gray-600">
              <h3 class="font-bold text-sm mb-1 line-clamp-2">\${p.titulo}</h3>
              <p class="text-yellow-400 font-bold">R$ \${parseFloat(p.preco).toFixed(2)}</p>
              <p class="text-xs text-gray-400 mt-1">\${p.plataforma.toUpperCase()} | \${p.seller}</p>
            </div>
          \`;
          container.appendChild(div);
        });
      } catch (e) {
        alert("Erro ao buscar: " + e.message);
      }
    }

    function toggleProduto(checkbox, id, titulo, preco, imagem, link, plataforma) {
      if (checkbox.checked) {
        if (selecionados.length >= 12) {
          alert("Máximo de 12 produtos!");
          checkbox.checked = false;
          return;
        }
        selecionados.push({ id, titulo, preco, imagem, link, plataforma });
      } else {
        selecionados = selecionados.filter(p => p.id !== id);
      }
      document.getElementById('contador').innerText = \`\${selecionados.length} / 12\`;
    }

    async function salvarVitrine() {
      const senha = document.getElementById('adminSenha').value;
      if (!senha) { alert("Digite a senha!"); return; }
      if (selecionados.length === 0) { alert("Selecione produtos!"); return; }

      try {
        const res = await fetch(\`\${API_URL}/api/admin/salvar_vitrine\`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${senha}\` },
          body: JSON.stringify(selecionados)
        });
        const data = await res.json();
        if (data.success) {
          alert("✅ Vitrine atualizada com sucesso!");
          selecionados = [];
          document.getElementById('contador').innerText = "0 / 12";
          document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        } else {
          alert("Erro: " + data.error);
        }
      } catch (e) {
        alert("Erro ao salvar: " + e.message);
      }
    }

    async function moverProdutos() {
      const senha = document.getElementById('adminSenha').value;
      if (!senha) { alert("Digite a senha!"); return; }

      const valorLimite = document.getElementById('valorLimite').value || 100;
      const lote = document.getElementById('loteSize').value || 50;

      if (!confirm(\`Mover produtos até R$ \${valorLimite} (lote de \${lote})?\`)) return;

      const btn = document.getElementById('btnMover');
      btn.disabled = true;
      btn.innerText = "⏳ Movendo...";

      try {
        const res = await fetch(\`\${API_URL}/api/admin/mover-produtos\`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${senha}\` 
          },
          body: JSON.stringify({ valorLimite, lote })
        });

        const data = await res.json();
        
        const resultadoDiv = document.getElementById('resultadoMover');
        const msgDiv = document.getElementById('msgMover');
        
        resultadoDiv.classList.remove('hidden');
        msgDiv.innerText = data.mensagem;
        
        if (data.erros > 0) {
          msgDiv.innerHTML += \`<br><span class="text-red-400">️ \${data.erros} erros na transferência</span>\`;
        }

      } catch (e) {
        alert("Erro ao mover: " + e.message);
      } finally {
        btn.disabled = false;
        btn.innerText = "🚀 MOVER PRODUTOS";
      }
    }
  <\/script>
</body>
</html>`;
