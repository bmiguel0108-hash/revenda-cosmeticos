import { createClient } from "@/lib/supabase/server";
import CatalogTabs from "@/components/catalogo/CatalogTabs";
import { comboDerived } from "@/lib/combos";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const [
    { data: products },
    { data: brands },
    { data: paymentMethods },
    { data: categories },
    { data: combosRaw },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, brands(id, name), product_categories(category_id)")
      .order("name"),
    supabase.from("brands").select("*").eq("active", true).order("name"),
    supabase
      .from("payment_methods")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("combos")
      .select(
        "*, combo_items(id, product_id, quantity, products(id, name, cost, target_price, stock_quantity, photo_url))"
      )
      .order("name"),
  ]);

  const productsWithCategories = (products || []).map((p) => ({
    ...p,
    category_ids: (p.product_categories || []).map((pc) => pc.category_id),
  }));

  const combos = (combosRaw || []).map((combo) => {
    const items = (combo.combo_items || []).map((ci) => ({
      product_id: ci.product_id,
      quantity: ci.quantity,
      product: ci.products,
    }));
    return { ...combo, items, ...comboDerived(combo, items) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">
          Catálogo de Produtos
        </h1>
        <p className="text-sm text-gray-500">
          Cadastre o produto uma vez com o preço-alvo ("Venda Revista") e o
          sistema calcula sozinho quanto cobrar em cada forma de pagamento,
          já repassando a taxa da maquininha.
        </p>
      </div>

      <CatalogTabs
        products={productsWithCategories}
        brands={brands || []}
        paymentMethods={paymentMethods || []}
        categories={categories || []}
        combos={combos}
      />
    </div>
  );
}
