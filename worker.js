// aLojinha API v3.1 FINAL - com sync AliExpress automático
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // SEU SYNC AUTOMÁTICO
    if (url.pathname === "/api/sync_aliexpress") {
      const alvo = "https://www.magazinevoce.com.br/magazinehdmicroloja/lojista/aliexpress/?page=1&sortOrientation=desc&sortType=soldQuantity";
      const res = await fetch(alvo, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();

      // Pega os cards da página
      const regex = /href="(\/magazinehdmicroloja\/p\/[^"]+)"[\s\S]{0,500}src="(https:\/\/[^"]+\.(?:webp|jpg|png))"[\s\S]{0,800}>([^<]{10,120})<\/h3|h2/gi;
      let match, added = 0;

      while ((match = regex.exec(html))!== null && added < 50) {
        let link = "https://www.magazinevoce.com.br" + match[1];
        let img = match[2];
        let titulo = match[3]?.trim().slice(0,200) || "Produto AliExpress Mais Vendido";
        let precoMatch = html.slice(match.index, match.index+1500).match(/R\$\s*[\d\.,]+/);
        let preco = precoMatch? precoMatch[0] : "Consultar";

        // Evita duplicado
        let existe = await env.DB.prepare("SELECT id FROM produtos_pool WHERE link_afiliado =?").bind(link).first();
        if (existe) continue;

        await env.DB.prepare(
          "INSERT INTO produtos_pool (titulo, preco, imagem, link_afiliado, plataforma, nicho, emoji, ativo) VALUES (?,?,?,?,?,?,?, 1)"
        ).bind(titulo, preco, img, link, "Magalu/AliExpress", "geral", "✈️").run();
        added++;
      }
      return new Response(JSON.stringify({ ok: true, added, fonte: alvo }), { headers: { "Content-Type": "application/json" } });
    }

    //... seu código v3.0 normal de / e /api/produtos_pool continua aqui
    if (url.pathname === "/") {
      return new Response(JSON.stringify({ message: "aLojinha API v3.1 FINAL", status: "ok", tabelas: ["produtos_pool","vendas_pool"], share_less: "ON", ranking: "ON", sync: "AliExpress AUTO" }), { headers: { "Content-Type": "application/json" } });
    }
    // mantém seu GET e POST do produtos_pool igual
    return fetch(request);
  },

  // Roda sozinho a cada 6 horas
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fetch("https://alojinha.hdmicro-cliente.workers.dev/api/sync_aliexpress"));
  }
}
