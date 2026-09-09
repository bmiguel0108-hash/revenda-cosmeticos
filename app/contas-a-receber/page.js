import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export default async function ContasAReceberPage() {
  const supabase = await createClient();

  const { data: sales } = await supabase
    .from("vw_sales")
    .select("*")
    .in("display_status", ["recebendo", "atrasado"])
    .order("days_overdue", { ascending: false });

  const totalReceivable = (sales || []).reduce((sum, s) => sum + Number(s.balance_due), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Contas a Receber</h1>
        <p className="text-sm text-gray-500">
          Calculado na hora a partir das vendas — vendas pagas ou canceladas não aparecem aqui.
        </p>
      </div>

      <div className="card inline-flex flex-col">
        <p className="text-xs text-gray-500">Total a receber</p>
        <p className="text-2xl font-semibold text-brand-700">{formatMoney(totalReceivable)}</p>
      </div>

      <section className="card overflow-x-auto">
        <table className="table-base min-w-[800px]">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Valor Final</th>
              <th>Recebido</th>
              <th>Saldo Devedor</th>
              <th>Próximo vencimento</th>
              <th>Dias em atraso</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(sales || []).map((sale) => (
              <tr key={sale.id}>
                <td>#{sale.sale_number}</td>
                <td className="font-medium text-gray-800">{sale.customer_name || "—"}</td>
                <td>{formatMoney(sale.final_value)}</td>
                <td className="text-gray-500">{formatMoney(sale.total_received)}</td>
                <td className="font-medium">{formatMoney(sale.balance_due)}</td>
                <td>{formatDate(sale.next_due_date)}</td>
                <td className={sale.days_overdue > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                  {sale.days_overdue > 0 ? `${sale.days_overdue} dia(s)` : "—"}
                </td>
                <td>
                  <StatusBadge status={sale.display_status} />
                </td>
              </tr>
            ))}
            {(!sales || sales.length === 0) && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-6">
                  Nada a receber no momento — tudo em dia!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-gray-500">
        Para registrar um pagamento recebido, vá em{" "}
        <Link href="/recebimentos" className="text-brand-600 underline">
          Recebimentos
        </Link>
        .
      </p>
    </div>
  );
}
