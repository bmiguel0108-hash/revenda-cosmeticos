import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function PainelPage() {
  const supabase = await createClient();

  const [{ data: sales }, { data: lowStock }] = await Promise.all([
    supabase.from("vw_sales").select("*").order("sale_date", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, stock_quantity")
      .eq("active", true)
      .lte("stock_quantity", 3)
      .order("stock_quantity"),
  ]);

  const allSales = sales || [];
  const monthStart = startOfMonthISO();

  const salesThisMonth = allSales.filter(
    (s) => s.sale_date >= monthStart && s.display_status !== "cancelado"
  );
  const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + Number(s.final_value), 0);
  const profitThisMonth = salesThisMonth.reduce((sum, s) => sum + Number(s.profit), 0);

  const openSales = allSales.filter((s) => ["recebendo", "atrasado"].includes(s.display_status));
  const totalReceivable = openSales.reduce((sum, s) => sum + Number(s.balance_due), 0);
  const overdueSales = allSales.filter((s) => s.display_status === "atrasado");

  const recentSales = allSales.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-700 mb-1">Painel</h1>
        <p className="text-sm text-gray-500">Resumo geral da revenda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-gray-500">Vendas do mês</p>
          <p className="text-2xl font-semibold text-gray-800">{salesThisMonth.length}</p>
          <p className="text-xs text-gray-400 mt-1">{formatMoney(revenueThisMonth)} em vendas</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Lucro do mês</p>
          <p className="text-2xl font-semibold text-emerald-700">{formatMoney(profitThisMonth)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Total a receber</p>
          <p className="text-2xl font-semibold text-brand-700">{formatMoney(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">{openSales.length} venda(s) em aberto</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Vendas atrasadas</p>
          <p className="text-2xl font-semibold text-red-600">{overdueSales.length}</p>
          <Link href="/contas-a-receber" className="text-xs text-brand-600 underline">
            ver contas a receber
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Últimas vendas</h2>
          <table className="table-base min-w-[420px]">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id}>
                  <td>#{sale.sale_number}</td>
                  <td className="text-gray-700">{sale.customer_name || "—"}</td>
                  <td>{formatMoney(sale.final_value)}</td>
                  <td>
                    <StatusBadge status={sale.display_status} />
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-6">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Link href="/vendas/nova" className="btn-primary mt-4 inline-flex">
            + Nova Venda
          </Link>
        </section>

        <section className="card overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Estoque baixo</h2>
          <table className="table-base min-w-[280px]">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Estoque</th>
              </tr>
            </thead>
            <tbody>
              {(lowStock || []).map((p) => (
                <tr key={p.id}>
                  <td className="text-gray-700">{p.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.stock_quantity <= 0
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.stock_quantity} un.
                    </span>
                  </td>
                </tr>
              ))}
              {(!lowStock || lowStock.length === 0) && (
                <tr>
                  <td colSpan={2} className="text-center text-gray-400 py-6">
                    Nenhum produto com estoque baixo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Link href="/catalogo" className="btn-secondary mt-4 inline-flex">
            Ver Catálogo
          </Link>
        </section>
      </div>
    </div>
  );
}
