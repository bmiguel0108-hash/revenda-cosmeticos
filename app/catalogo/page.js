import { createClient } from "@/lib/supabase/server";
import ProductsTable from "@/components/catalogo/ProductsTable";
import NewProductForm from "@/components/catalogo/NewProductForm";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: brands }, { data: paymentMethods }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*, brands(id, name)")
        .order("name"),
      supabase.from("brands").select("*").eq("active", true).order("name"),
      supabase
        .from("payment_methods")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
    ]);

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

      <NewProductForm brands={brands || []} />

      <ProductsTable
        products={products || []}
        brands={brands || []}
        paymentMethods={paymentMethods || []}
      />
    </div>
  );
}
