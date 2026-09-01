-- schema_final.sql - Roda no coleposte-db (fa0ab338-e271-4e77-bf0d-0faae80a30f7)
-- Esse é o banco que tem 2000 linhas e que teu wrangler.toml já aponta

-- 1) Vitrine principal que o site /api/produtos lê
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  preco TEXT NOT NULL,
  preco_numero REAL DEFAULT 0,
  imagem TEXT,
  link_afiliado TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  nicho TEXT DEFAULT 'geral',
  emoji TEXT,
  ativo INTEGER DEFAULT 1,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2) Pool que vem do Coleposte / WhatsApp
CREATE TABLE IF NOT EXISTS produtos_coleposte (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  preco TEXT NOT NULL,
  preco_numero REAL DEFAULT 0,
  url_produto TEXT NOT NULL,
  imagem_url TEXT,
  loja TEXT NOT NULL,
  nicho TEXT,
  emoji TEXT,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3) Tabela antiga do schema.sql original (mantemos pra compatibilidade)
CREATE TABLE IF NOT EXISTS produtos_pool (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  preco TEXT NOT NULL,
  preco_numero REAL,
  imagem TEXT,
  link_afiliado TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  nicho TEXT,
  emoji TEXT,
  ativo INTEGER DEFAULT 1,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indices pra performance do /api/produtos
CREATE INDEX IF NOT EXISTS idx_produtos_ativo_imagem ON produtos(ativo, imagem);
CREATE INDEX IF NOT EXISTS idx_produtos_preco ON produtos(preco_numero);
CREATE INDEX IF NOT EXISTS idx_coleposte_preco ON produtos_coleposte(preco_numero);

-- View de compatibilidade: se código antigo ainda buscar produtos_pool, ele vê o que tá em produtos
-- DROP VIEW IF EXISTS produtos_pool_view;
-- CREATE VIEW produtos_pool AS SELECT * FROM produtos;

