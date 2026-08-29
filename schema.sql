-- schema.sql
CREATE TABLE produtos_pool (
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
