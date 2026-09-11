-- Patch 3: adiciona a data de vencimento (validade) no cadastro do produto
-- Rode este script no SQL Editor do Supabase (New query → colar → Run)
-- do projeto que você já tem criado. Não precisa recriar nada.

alter table products add column if not exists expiration_date date;

comment on column products.expiration_date is 'Data de vencimento (validade) do produto';

-- Fim do patch 3.
