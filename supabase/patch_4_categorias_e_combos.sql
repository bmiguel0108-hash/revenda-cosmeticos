-- Patch 4: categorias de produto e combos (kits com desconto)
-- Rode este script no SQL Editor do Supabase (New query → colar → Run)
-- do projeto que você já tem criado. Não precisa recriar nada.

-- 1) Categorias
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_categories (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

alter table categories enable row level security;
alter table product_categories enable row level security;

drop policy if exists "Usuário autenticado tem acesso total" on categories;
create policy "Usuário autenticado tem acesso total" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Usuário autenticado tem acesso total" on product_categories;
create policy "Usuário autenticado tem acesso total" on product_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into categories (name, sort_order)
select v.name, v.sort_order
from (values
  ('Maquiagem', 1),
  ('Perfumaria', 2),
  ('Kit/Combo', 3),
  ('Cabelos', 4),
  ('Cuidados para Pele', 5),
  ('Corpo e Banho', 6)
) as v(name, sort_order)
where not exists (select 1 from categories c where c.name = v.name);

-- 2) Combos
create table if not exists combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_price numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references combos(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null default 1 check (quantity > 0)
);

alter table combos enable row level security;
alter table combo_items enable row level security;

drop policy if exists "Usuário autenticado tem acesso total" on combos;
create policy "Usuário autenticado tem acesso total" on combos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Usuário autenticado tem acesso total" on combo_items;
create policy "Usuário autenticado tem acesso total" on combo_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3) Marca, nos itens de venda, quando o item veio de um combo
alter table sale_items add column if not exists combo_id uuid references combos(id) on delete set null;
alter table sale_items add column if not exists combo_name text;

-- Fim do patch 4.
