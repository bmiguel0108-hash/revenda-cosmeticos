-- =====================================================================
-- CORREÇÃO DE SEGURANÇA — rode isso uma vez no SQL Editor do Supabase
-- =====================================================================
-- O que aconteceu: as duas "visões" do banco (vw_sales e vw_product_prices)
-- foram criadas sem uma proteção que o Postgres exige à parte da RLS
-- (Row Level Security) das tabelas. Isso podia deixar os dados de vendas e
-- clientes visíveis por fora do sistema, para qualquer pessoa que tivesse o
-- endereço do projeto — mesmo sem fazer login. As tabelas em si (produtos,
-- clientes, vendas etc.) sempre estiveram protegidas corretamente; o problema
-- era só nessas duas visões calculadas.
--
-- Depois de rodar este script, só quem estiver logado no sistema consegue
-- ver esses dados, exatamente como já acontecia com o resto do sistema.
-- =====================================================================

alter view vw_sales set (security_invoker = on);
revoke all on vw_sales from anon, public;
grant select on vw_sales to authenticated;

alter view vw_product_prices set (security_invoker = on);
revoke all on vw_product_prices from anon, public;
grant select on vw_product_prices to authenticated;
