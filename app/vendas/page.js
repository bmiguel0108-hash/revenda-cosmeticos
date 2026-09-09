import { createClient } from "@/lib/supabase/server";
import SalesTable from "@/components/vendas/SalesTable";

export default async function VendasPage() {
  const supabase = await createClient();

  const [{ data: sales }, { data: saleItems }] = await Promise.all([
    supabase.from("vw_sales").select("*").order("sale_date", { ascending: false }),
    supabase
      .from("sale_items")
      .select("id, sale_id, quantity, unit_cost, unit_price, products(name)")
      .order("created_at"),
  ]);

  const itemsBySale = {};
  (saleItems || []).forEach((item) => {
    if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
    itemsBySale[item.sale_id].push(item);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Vendas</h1>
        <p className="text-sm text-gray-500">
          Todas as vendas registradas. Clique numa venda para ver os itens.
        </p>
      </div>

      <SalesTable sales={sales || []} itemsBySale={itemsBySale} />
    </div>
  );
}
