🛍️ aLojinha — Ofertas Relâmpago a cada 4h

    Vitrine inteligente de afiliados que captura ofertas do WhatsApp, organiza em pool e exibe em rodízio automático. Feito com 💙 por Luis & Qwen

<p align="center"> <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" /> <img src="https://img.shields.io/badge/D1-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" /> <img src="https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" /> <img src="https://img.shields.io/badge/Status-Online-10b981?style=for-the-badge" /> </p> <p align="center"> <a href="https://alojinha.hdmicro-cliente.workers.dev"><b>🔴 DEMO AO VIVO</b></a> • <a href="https://alojinha.hdmicro-cliente.workers.dev/admin.html">Painel Admin</a> • <a href="https://alojinha.hdmicro-cliente.workers.dev/api/produtos">API /produtos</a> </p>
✨ O que é?

A aLojinha não é só mais uma página de afiliados. É um ecossistema completo:

    Robozim (Tampermonkey) varre 15 canais de ofertas no WhatsApp Web
    Joga tudo no pool produtos_coleposte (D1)
    O Admin faz curadoria e move os melhores pra vitrine produtos
    O site exibe em rodízio de 4h com faixas de preço escalonadas (R$20-50, R$50-100, R$10-200)

Resultado: site sempre fresco, sem produto repetido e sem precisar postar manual.
🎯 Funcionalidades
Feature	Como funciona
Rodízio 4h	Math.floor(Date.now() / 4h) muda o bloco e o ORDER BY ((id + bloco) % 1000) embaralha sem repetir
Faixas Inteligentes	Tenta primeiro R$20-50, se não tiver 4 produtos tenta R$50-100, depois R$10-200, fallback pros últimos ativos
Vitrine Responsiva	Desktop grid 4 colunas, mobile carrossel com snap
Badges por Loja	Shopee laranja, Amazon amarela, Magalu azul, Mercado Livre amarelo
Admin Completo	Stats reais, mover em lote por valor máximo, status do robozim
API Blindada	CORS liberado pro Tampermonkey, auth Bearer pra admin, fallback pra produtos_pool
🏗️ Arquitetura
mermaid

graph LR
    WA[WhatsApp 15 canais] -->|Tampermonkey| API[/api/salva-produto]
    API --> POOL[(produtos_coleposte - 2000)]
    POOL -->|/admin.html MOVER| VITRINE[(produtos - vitrine)]
    VITRINE -->|/api/produtos| SITE[alojinha.hdmicro-cliente.workers.dev]
    SITE -->|Afiliado| SHOPEE & AMAZON & MAGALU

Bancos:

    fa0ab338-e271-4e77-bf0d-0faae80a30f7 = coleposte-db (OFICIAL, tem os 2000)
    aca85cb1-0ff7-4c31-91a9-9c82db9ac3cb = alojinha (reserva, hoje vazio)

    ⚠️ O bug que te pegou: o Worker tava lendo produtos_pool (schema.sql antigo) mas o banco bom tem produtos + produtos_coleposte. O fix foi unificar o schema e o worker fazer fallback.

🛠️ Stack

    Cloudflare Workers - serverless, edge
    D1 SQLite - banco serverless
    TailwindCSS via CDN - UI azul ML (#0f1724, #2563eb)
    Tampermonkey - robozim no WhatsApp Web
    Wrangler - deploy

📁 Estrutura

/
├── worker.js           # Worker principal (HTML + API)
├── wrangler.toml       # binding = "alojinha" -> coleposte-db
├── schema.sql          # schema antigo (produtos_pool)
├── schema_final.sql    # schema completo (produtos + pool + pool antigo)
└── README.md

🚀 Instalação em 2 minutos
bash

git clone https://github.com/FamiliaHDMicro/aLojinha
cd aLojinha
npm i -g wrangler
wrangler login

Cria o D1 se não tiver:
bash

wrangler d1 create coleposte-db

Aplica o schema completo:
bash

wrangler d1 execute coleposte-db --file=./schema_final.sql

🔐 Configuração

wrangler.toml:
toml

name = "alojinha"
main = "worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "alojinha"
database_name = "coleposte-db"
database_id = "fa0ab338-e271-4e77-bf0d-0faae80a30f7"

# NUNCA deixe senha no toml
# use secret:
# wrangler secret put ADMIN_PASSWORD

Segredos:
bash

wrangler secret put ADMIN_PASSWORD
# digite: alojinha2026 (e depois troca!)

🎮 Como usar

1. Ver se tá tudo ok:

GET /api/debug
-> {"vitrine": 0, "pool": 2000, "poolAntigo": 0}

2. Mover do pool pra vitrine:
Abre /admin.html > Valor Máximo 100 > Lote 50 > MOVER > digita senha

Ou via curl:
bash

curl -X POST https://alojinha.hdmicro-cliente.workers.dev/api/admin/mover-produtos \
 -H "Authorization: Bearer SUA_SENHA" \
 -H "Content-Type: application/json" \
 -d '{"valorLimite":100,"lote":50}'

3. O robozim salva sozinho:

POST /api/salva-produto
Body: { titulo, preco, preco_numero, url_produto, imagem_url, loja, nicho }

📚 API Reference
Rota	Método	Auth	O que faz
/	GET	-	Vitrine pública
/admin.html	GET	-	Painel
/api/produtos	GET	-	12 produtos em rodízio
/api/debug	GET	-	Contagem vitrine/pool
/api/salva-produto	POST	-	Robozim insere
/api/admin/mover-produtos	POST	Bearer	Move pool -> vitrine
🤖 Robozim (Tampermonkey)

O script lê o WhatsApp Web, pega título, preço, imagem e link, e faz fetch pra /api/salva-produto.

Canais monitorados (15): ALojinha, Achadinhos, Tech Tudo Ofertas, Ofertas Gamers, Promosam, PromoZanq, Top Achados, Pack de Ofertas, To Sem Kit, Magalu, Shopee, Mercado Livre, Achadinhos Amazon, Amazon Brasil, Tech.
📦 Deploy
bash

wrangler deploy
# vai pra https://alojinha.hdmicro-cliente.workers.dev

Ativa os logs pra não cair no mesmo bug de novo:
Dashboard > Workers > alojinha > Configurações > Observability > Logs do Workers > Ativar
🐛 Troubleshooting que já resolvemos

Site preto / Nenhuma oferta:

    produtos vazio mas produtos_coleposte cheio -> roda o mover no admin
    Binding apontando pro banco reserva aca85cb1 -> troca no Dashboard > Bindings pra fa0ab338

no such table: produtos:

    Rodou SELECT COUNT(*) FROM produtos no banco alojinha (que só tem produtos_pool) -> normal, cada banco tem tabela diferente

🗺️ Roadmap

    Stats reais no admin (hoje já fixado no v2)
    Webhook pro Telegram @aLojinha_bot quando mover lote
    Filtro por nicho na vitrine
    PWA + cache de imagens

👨‍💻 Feito por

Luis (HDMicro) + Qwen + agora Met

Se esse README te salvou, deixa uma ⭐ no repo!

© 2026 aLojinha • Ofertas atualizadas a cada 4 horas
