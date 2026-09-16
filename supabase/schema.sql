-- =====================================================================
-- SISTEMA DE REVENDA DE COSMÉTICOS — Schema do banco de dados
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar de uma vez só, do início ao fim.
-- =====================================================================

-- Extensão para gerar IDs únicos (uuid)
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. FORMAS DE PAGAMENTO (substitui a aba "Configurações" > formas de pagamento)
-- =====================================================================
create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  fee_rate numeric(6,4) not null default 0 check (fee_rate >= 0 and fee_rate < 1),
  -- multiplicador = 1 / (1 - taxa), recalculado sozinho sempre que a taxa muda
  multiplier numeric(8,4) generated always as (round(1 / (1 - fee_rate), 4)) stored,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table payment_methods is 'Formas de pagamento e a taxa que cada uma cobra (Pix, Tap Ton, Link, Maquininha, Parcelado na Confiança, etc.)';

-- =====================================================================
-- 2. MARCAS (fonte única — resolve a divergência entre abas da planilha antiga)
-- =====================================================================
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 3. CLIENTES
-- =====================================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 4. PRODUTOS (catálogo + estoque + precificação)
-- =====================================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_id uuid references brands(id),
  cost numeric(10,2) not null default 0,
  cycle int,
  target_price numeric(10,2) not null default 0, -- "Venda Revista": o preço-alvo
  profit numeric(10,2) generated always as (target_price - cost) stored,
  margin numeric(6,4) generated always as (
    case when target_price = 0 then 0 else round((target_price - cost) / target_price, 4) end
  ) stored,
  stock_quantity int not null default 0,
  ready_for_delivery boolean not null default false, -- usado futuramente no catálogo público
  photo_url text, -- foto do produto (Supabase Storage, bucket product-photos)
  expiration_date date, -- data de vencimento (validade) do produto
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column products.ready_for_delivery is 'Indica se o produto já está pronto em mãos (para entrega imediata) — usado na futura página pública de pedidos';

-- =====================================================================
-- 5. MOVIMENTAÇÕES DE ESTOQUE (histórico de entradas e saídas)
-- =====================================================================
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null, -- positivo = entrada, negativo = saída
  type text not null check (type in ('entrada', 'venda', 'cancelamento_venda', 'ajuste')),
  reference_sale_id uuid, -- preenchido quando o movimento vem de uma venda (referência é criada mais abaixo, depois que a tabela sales existir)
  movement_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- Sempre que um movimento é inserido, atualiza o saldo em products.stock_quantity
create or replace function fn_apply_stock_movement() returns trigger as $$
begin
  update products set stock_quantity = stock_quantity + new.quantity, updated_at = now()
  where id = new.product_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_apply_stock_movement
after insert on stock_movements
for each row execute function fn_apply_stock_movement();

-- =====================================================================
-- 6. VENDAS
-- =====================================================================
create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_number int generated always as identity unique,
  sale_date date not null default current_date,
  customer_id uuid references customers(id),
  payment_method_id uuid not null references payment_methods(id),
  base_value numeric(10,2) not null default 0,   -- soma do preço-alvo dos itens
  total_cost numeric(10,2) not null default 0,   -- soma do custo dos itens
  final_value numeric(10,2) not null default 0,  -- base_value x multiplicador da forma de pagamento
  down_payment numeric(10,2) not null default 0, -- entrada
  installments_count int not null default 1,
  status text not null default 'recebendo' check (status in ('pago', 'recebendo', 'cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recalcula o valor final (repasse de taxa) sempre que o valor base ou a forma de pagamento mudam
create or replace function fn_recalc_sale_final_value() returns trigger as $$
declare
  v_multiplier numeric(8,4);
begin
  select multiplier into v_multiplier from payment_methods where id = new.payment_method_id;
  new.final_value := round(new.base_value * coalesce(v_multiplier, 1), 2);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_recalc_sale_final_value
before insert or update of base_value, payment_method_id on sales
for each row execute function fn_recalc_sale_final_value();

-- Quando uma venda é cancelada, devolve ao estoque tudo que tinha sido baixado
create or replace function fn_handle_sale_cancellation() returns trigger as $$
begin
  if new.status = 'cancelado' and old.status <> 'cancelado' then
    insert into stock_movements (product_id, quantity, type, reference_sale_id, note)
    select product_id, quantity, 'cancelamento_venda', new.id, 'Devolução por cancelamento da venda #' || new.sale_number
    from sale_items where sale_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_handle_sale_cancellation
after update of status on sales
for each row execute function fn_handle_sale_cancellation();

-- Agora que a tabela sales existe, liga a referência de stock_movements a ela
alter table stock_movements add constraint fk_stock_movements_sale foreign key (reference_sale_id) references sales(id);

-- =====================================================================
-- 7. ITENS DA VENDA (produtos escolhidos do catálogo, com quantidade)
-- =====================================================================
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null default 1 check (quantity > 0),
  unit_cost numeric(10,2) not null default 0,   -- custo do produto no momento da venda
  unit_price numeric(10,2) not null default 0,  -- preço-alvo do produto no momento da venda
  created_at timestamptz not null default now()
);

-- Recalcula base_value/total_cost da venda e baixa o estoque quando um item é adicionado/alterado/removido
create or replace function fn_sync_sale_items() returns trigger as $$
declare
  v_sale_id uuid;
begin
  v_sale_id := coalesce(new.sale_id, old.sale_id);

  update sales set
    base_value = (select coalesce(sum(quantity * unit_price), 0) from sale_items where sale_id = v_sale_id),
    total_cost = (select coalesce(sum(quantity * unit_cost), 0) from sale_items where sale_id = v_sale_id)
  where id = v_sale_id;

  if tg_op = 'INSERT' then
    insert into stock_movements (product_id, quantity, type, reference_sale_id)
    values (new.product_id, -new.quantity, 'venda', v_sale_id);
  elsif tg_op = 'UPDATE' then
    if new.product_id = old.product_id then
      if new.quantity <> old.quantity then
        insert into stock_movements (product_id, quantity, type, reference_sale_id, note)
        values (new.product_id, old.quantity - new.quantity, 'ajuste', v_sale_id, 'Ajuste de quantidade no item da venda');
      end if;
    else
      insert into stock_movements (product_id, quantity, type, reference_sale_id, note)
      values (old.product_id, old.quantity, 'ajuste', v_sale_id, 'Ajuste: produto do item trocado');
      insert into stock_movements (product_id, quantity, type, reference_sale_id, note)
      values (new.product_id, -new.quantity, 'ajuste', v_sale_id, 'Ajuste: produto do item trocado');
    end if;
  elsif tg_op = 'DELETE' then
    insert into stock_movements (product_id, quantity, type, reference_sale_id, note)
    values (old.product_id, old.quantity, 'ajuste', v_sale_id, 'Item removido da venda');
  end if;

  return null;
end;
$$ language plpgsql;

create trigger trg_sync_sale_items
after insert or update or delete on sale_items
for each row execute function fn_sync_sale_items();

-- =====================================================================
-- 8. RECEBIMENTOS (histórico de pagamentos recebidos de cada venda)
-- =====================================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(10,2) not null check (amount > 0),
  payment_method_id uuid references payment_methods(id),
  installment_label text, -- "Entrada", "1", "2", "3"...
  has_receipt boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- Atualiza o status da venda (Pago/Recebendo) sempre que um recebimento muda
create or replace function fn_sync_sale_status() returns trigger as $$
declare
  v_sale_id uuid;
  v_final_value numeric(10,2);
  v_total_received numeric(10,2);
  v_current_status text;
begin
  v_sale_id := coalesce(new.sale_id, old.sale_id);

  select final_value, status into v_final_value, v_current_status from sales where id = v_sale_id;

  if v_current_status <> 'cancelado' then
    select coalesce(sum(amount), 0) into v_total_received from payments where sale_id = v_sale_id;

    update sales set
      status = case when v_final_value - v_total_received <= 0 then 'pago' else 'recebendo' end,
      updated_at = now()
    where id = v_sale_id;
  end if;

  return null;
end;
$$ language plpgsql;

create trigger trg_sync_sale_status
after insert or update or delete on payments
for each row execute function fn_sync_sale_status();

-- =====================================================================
-- 9. VISÃO CONSOLIDADA DE VENDAS (usada nas telas "Vendas" e "Contas a Receber")
--    Calcula tudo que a aba "Contas a Receber" da planilha calculava,
--    na hora, sem precisar manter uma tabela separada sincronizada.
-- =====================================================================
create view vw_sales as
select
  s.id,
  s.sale_number,
  s.sale_date,
  s.customer_id,
  c.name as customer_name,
  c.phone as customer_phone,
  s.payment_method_id,
  pm.name as payment_method_name,
  s.base_value,
  s.total_cost,
  s.final_value,
  s.down_payment,
  s.installments_count,
  case when s.installments_count > 0
    then round((s.final_value - s.down_payment) / s.installments_count, 2)
    else 0
  end as installment_value,
  coalesce(p.total_received, 0) as total_received,
  s.final_value - coalesce(p.total_received, 0) as balance_due,
  s.final_value - s.total_cost as profit,
  p.last_payment_date,
  coalesce(p.last_payment_date, s.sale_date) + interval '30 days' as next_due_date,
  case
    when s.status = 'cancelado' then 0
    when s.final_value - coalesce(p.total_received, 0) <= 0 then 0
    when (coalesce(p.last_payment_date, s.sale_date) + interval '30 days')::date < current_date
      then current_date - (coalesce(p.last_payment_date, s.sale_date) + interval '30 days')::date
    else 0
  end as days_overdue,
  case
    when s.status = 'cancelado' then 'cancelado'
    when s.final_value - coalesce(p.total_received, 0) <= 0 then 'pago'
    when (coalesce(p.last_payment_date, s.sale_date) + interval '30 days')::date < current_date then 'atrasado'
    else 'recebendo'
  end as display_status,
  s.notes,
  s.created_at,
  s.updated_at
from sales s
left join customers c on c.id = s.customer_id
left join payment_methods pm on pm.id = s.payment_method_id
left join (
  select sale_id, sum(amount) as total_received, max(payment_date) as last_payment_date
  from payments
  group by sale_id
) p on p.sale_id = s.id;

-- Segurança: essa visão precisa respeitar as mesmas regras de acesso das tabelas
-- que ela consulta (RLS), e nunca ficar visível para quem não está logado.
alter view vw_sales set (security_invoker = on);
revoke all on vw_sales from anon, public;
grant select on vw_sales to authenticated;

-- =====================================================================
-- 10. VISÃO DE PREÇOS POR FORMA DE PAGAMENTO (matriz do catálogo)
-- =====================================================================
create view vw_product_prices as
select
  pr.id as product_id,
  pm.id as payment_method_id,
  pm.name as payment_method_name,
  round(pr.target_price * pm.multiplier, 2) as price
from products pr
cross join payment_methods pm
where pm.active = true;

alter view vw_product_prices set (security_invoker = on);
revoke all on vw_product_prices from anon, public;
grant select on vw_product_prices to authenticated;

-- =====================================================================
-- 11. DADOS INICIAIS (as formas de pagamento e marcas que você já usa)
-- =====================================================================
insert into payment_methods (name, fee_rate, sort_order) values
  ('Pix', 0, 1),
  ('Dinheiro', 0, 2),
  ('Tap Ton à vista', 0.0399, 3),
  ('Tap Ton 2x', 0.0699, 4),
  ('Tap Ton 3x', 0.0899, 5),
  ('Tap Ton 4x', 0.1099, 6),
  ('Link à vista', 0.0399, 7),
  ('Link 2x', 0.0699, 8),
  ('Link 3x', 0.0899, 9),
  ('Link 4x', 0.1099, 10),
  ('Maquininha à vista', 0.0399, 11),
  ('Maquininha 2x', 0.0799, 12),
  ('Maquininha 3x', 0.1029, 13),
  ('Maquininha 4x', 0.1259, 14),
  ('Parcelado na Confiança', 0, 15);

insert into brands (name) values
  ('O Boticário'),
  ('Eudora'),
  ('O.U.i Paris'),
  ('Avon'),
  ('Natura');

-- =====================================================================
-- 12. SEGURANÇA (RLS) — só você, autenticada, acessa os dados
-- =====================================================================
alter table payment_methods enable row level security;
alter table brands enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table stock_movements enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;

create policy "Usuário autenticado tem acesso total" on payment_methods for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on brands for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on stock_movements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on sales for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on sale_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =====================================================================
-- 13. FOTOS DOS PRODUTOS (Supabase Storage)
-- =====================================================================
-- Bucket público: qualquer pessoa com o link vê a foto (necessário para a
-- futura página pública de catálogo), mas só um usuário autenticado pode
-- enviar, trocar ou remover uma foto.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "Leitura pública das fotos de produtos"
on storage.objects for select
using (bucket_id = 'product-photos');

create policy "Usuário autenticado envia fotos de produtos"
on storage.objects for insert
with check (bucket_id = 'product-photos' and auth.role() = 'authenticated');

create policy "Usuário autenticado atualiza fotos de produtos"
on storage.objects for update
using (bucket_id = 'product-photos' and auth.role() = 'authenticated');

create policy "Usuário autenticado remove fotos de produtos"
on storage.objects for delete
using (bucket_id = 'product-photos' and auth.role() = 'authenticated');

-- =====================================================================
-- 14. CATEGORIAS (um produto pode ter mais de uma)
-- =====================================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_categories (
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

alter table categories enable row level security;
alter table product_categories enable row level security;

create policy "Usuário autenticado tem acesso total" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on product_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into categories (name, sort_order) values
  ('Maquiagem', 1),
  ('Perfumaria', 2),
  ('Kit/Combo', 3),
  ('Cabelos', 4),
  ('Cuidados para Pele', 5),
  ('Corpo e Banho', 6);

-- =====================================================================
-- 15. COMBOS (2 ou mais produtos do catálogo vendidos juntos, com desconto)
-- =====================================================================
create table combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_price numeric(10,2) not null default 0, -- preço de venda do combo (definido por você)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references combos(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity int not null default 1 check (quantity > 0)
);

alter table combos enable row level security;
alter table combo_items enable row level security;

create policy "Usuário autenticado tem acesso total" on combos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Usuário autenticado tem acesso total" on combo_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Quando um combo é vendido, ele "explode" nos produtos que o compõem — cada
-- item da venda continua sendo um produto de verdade (então o estoque baixa
-- sozinho, como sempre), só que marcado com qual combo ele veio, para
-- aparecer certinho na tela de Vendas.
alter table sale_items add column combo_id uuid references combos(id) on delete set null;
alter table sale_items add column combo_name text; -- nome do combo no momento da venda (não muda se o combo for renomeado ou removido depois)

-- Fim do schema.
