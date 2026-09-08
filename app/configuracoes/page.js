import { createClient } from "@/lib/supabase/server";
import PaymentMethodsSection from "@/components/configuracoes/PaymentMethodsSection";
import BrandsSection from "@/components/configuracoes/BrandsSection";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const [{ data: paymentMethods }, { data: brands }] = await Promise.all([
    supabase.from("payment_methods").select("*").order("sort_order"),
    supabase.from("brands").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">
          Configurações
        </h1>
        <p className="text-sm text-gray-500">
          Formas de pagamento e marcas usadas em todo o sistema.
        </p>
      </div>

      <PaymentMethodsSection paymentMethods={paymentMethods || []} />
      <BrandsSection brands={brands || []} />
    </div>
  );
}
