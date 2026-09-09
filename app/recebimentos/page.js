import { createClient } from "@/lib/supabase/server";
import NewPaymentForm from "@/components/recebimentos/NewPaymentForm";
import PaymentsTable from "@/components/recebimentos/PaymentsTable";

export default async function RecebimentosPage() {
  const supabase = await createClient();

  const [{ data: openSales }, { data: payments }, { data: paymentMethods }] =
    await Promise.all([
      supabase
        .from("vw_sales")
        .select("id, sale_number, customer_name, balance_due, display_status")
        .neq("display_status", "cancelado")
        .order("sale_number", { ascending: false }),
      supabase
        .from("payments")
        .select("*, sales(sale_number, customer_id, customers(name)), payment_methods(name)")
        .order("payment_date", { ascending: false }),
      supabase.from("payment_methods").select("*").eq("active", true).order("sort_order"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Recebimentos</h1>
        <p className="text-sm text-gray-500">
          Registre aqui cada pagamento recebido de uma venda (entrada ou parcela).
        </p>
      </div>

      <NewPaymentForm sales={openSales || []} paymentMethods={paymentMethods || []} />

      <PaymentsTable payments={payments || []} />
    </div>
  );
}
