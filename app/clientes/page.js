import { createClient } from "@/lib/supabase/server";
import CustomersTable from "@/components/clientes/CustomersTable";
import NewCustomerForm from "@/components/clientes/NewCustomerForm";

export default async function ClientesPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: sales }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase
      .from("vw_sales")
      .select(
        "id, sale_number, sale_date, customer_id, final_value, balance_due, display_status, payment_method_name"
      )
      .order("sale_date", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Clientes</h1>
        <p className="text-sm text-gray-500">
          Cadastro de clientes com telefone e histórico de compras.
        </p>
      </div>

      <NewCustomerForm />

      <CustomersTable customers={customers || []} sales={sales || []} />
    </div>
  );
}
