-- Patch 2: adiciona suporte a foto do produto
-- Rode este script no SQL Editor do Supabase (New query → colar → Run)
-- do projeto que você já tem criado. Não precisa recriar nada.

-- 1) Nova coluna na tabela de produtos
alter table products add column if not exists photo_url text;

comment on column products.photo_url is 'Foto do produto (Supabase Storage, bucket product-photos)';

-- 2) Bucket de armazenamento para as fotos
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- 3) Quem pode ver / enviar / trocar / remover fotos
drop policy if exists "Leitura pública das fotos de produtos" on storage.objects;
create policy "Leitura pública das fotos de produtos"
on storage.objects for select
using (bucket_id = 'product-photos');

drop policy if exists "Usuário autenticado envia fotos de produtos" on storage.objects;
create policy "Usuário autenticado envia fotos de produtos"
on storage.objects for insert
with check (bucket_id = 'product-photos' and auth.role() = 'authenticated');

drop policy if exists "Usuário autenticado atualiza fotos de produtos" on storage.objects;
create policy "Usuário autenticado atualiza fotos de produtos"
on storage.objects for update
using (bucket_id = 'product-photos' and auth.role() = 'authenticated');

drop policy if exists "Usuário autenticado remove fotos de produtos" on storage.objects;
create policy "Usuário autenticado remove fotos de produtos"
on storage.objects for delete
using (bucket_id = 'product-photos' and auth.role() = 'authenticated');

-- Fim do patch 2.
