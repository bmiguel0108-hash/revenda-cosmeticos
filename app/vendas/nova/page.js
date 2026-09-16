import { createClient } from "@/lib/supabase/server";
import NovaVendaForm from "@/components/vendas/NovaVendaForm";
import { comboDerived } from "@/lib/combos";

export default async function NovaVendaPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: customers }, { data: paymentMethods }, { data: combosRaw }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, cost, target_price, stock_quantity, ready_for_delivery")
        .eq("active", true)
        .order("name"),
      supabase.from("customers").select("id, name, phone").order("name"),
      supabase
        .from("payment_methods")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("combos")
        .select(
          "id, name, target_price, active, combo_items(product_id, quantity, products(id, name, cost, target_price, stock_quantity))"
        )
        .eq("active", true)
        .order("name"),
    ]);

  const combos = (combosRaw || [])
    .map((combo) => {
      const items = (combo.combo_items || []).map((ci) => ({
        product_id: ci.product_id,
        quantity: ci.quantity,
        product: ci.products,
      }));
      return { ...combo, items, ...comboDerived(combo, items) };
    })
    .filter((combo) => combo.items.length >= 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Nova Venda</h1>
        <p className="text-sm text-gray-500">
          Escolha o cliente e os produtos (ou combos) do catálogo — o sistema
          soma o valor, calcula o repasse da forma de pagamento e baixa o
          estoque sozinho.
        </p>
      </div>

      <NovaVendaForm
        products={products || []}
        combos={combos}
        customers={customers || []}
        paymentMethods={paymentMethods || []}
      />
    </div>
  );
}
