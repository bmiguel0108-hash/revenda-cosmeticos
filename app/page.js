import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ProductProfitChart from "@/components/dashboard/ProductProfitChart";
import { buildProductProfitRanking } from "@/lib/productProfit";

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Rótulo/urgência da validade — mesma ideia do card do Catálogo, mas com uma
// janela de 30 dias (mais curta) para esse alerta do Painel.
function expirationAlert(expirationDate) {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(`${expirationDate}T00:00:00`);
  const daysUntil = Math.round((expDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntil > 30) return null;
  if (daysUntil < 0) return { label: "vencido", className: "bg-red-50 text-red-600", priority: 0 };
  return { label: `vence em ${daysUntil}d`, className: "bg-amber-50 text-amber-700", priority: 2 };
}

export default async function PainelPage() {
  const supabase = await createClient();
  const in30Days = addDaysISO(30);

  const [{ data: sales }, { data: alertProducts }, { data: saleItems }] = await Promise.all([
    supabase.from("vw_sales").select("*").order("sale_date", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, stock_quantity, expiration_date")
      .eq("active", true)
      .or(`stock_quantity.lt.2,expiration_date.lte.${in30Days}`),
    supabase
      .from("sale_items")
      .select("product_id, quantity, unit_cost, unit_price, products(name), sales(status)"),
  ]);

  const productProfit = buildProductProfitRanking(saleItems || []);

  const stockAndExpiryAlerts = (alertProducts || [])
    .map((p) => {
      const lowStock = p.stock_quantity < 2;
      const expiry = expirationAlert(p.expiration_date);
      return { ...p, lowStock, expiry };
    })
    .filter((p) => p.lowStock || p.expiry)
    .sort((a, b) => {
      const priority = (p) => (p.expiry ? p.expiry.priority : p.lowStock ? 1 : 3);
      return priority(a) - priority(b) || a.stock_quantity - b.stock_quantity;
    });

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

      <ProductProfitChart
        title="Lucro por produto vendido"
        subtitle="Total geral, do maior para o menor"
        data={productProfit}
      />

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
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Alertas: Estoque Baixo e Vencimento
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Menos de 2 unidades em estoque, ou vencimento em até 30 dias.
          </p>
          <table className="table-base min-w-[320px]">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Estoque</th>
                <th>Validade</th>
              </tr>
            </thead>
            <tbody>
              {stockAndExpiryAlerts.map((p) => (
                <tr key={p.id}>
                  <td className="text-gray-700">{p.name}</td>
                  <td>
                    {p.lowStock ? (
                      <span
                        className={`badge ${
                          p.stock_quantity <= 0
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {p.stock_quantity} un.
                      </span>
                    ) : (
                      <span className="text-gray-400">{p.stock_quantity} un.</span>
                    )}
                  </td>
                  <td>
                    {p.expiry ? (
                      <span className={`badge ${p.expiry.className}`}>{p.expiry.label}</span>
                    ) : (
                      <span className="text-gray-400">
                        {p.expiration_date ? formatDate(p.expiration_date) : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {stockAndExpiryAlerts.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-6">
                    Nenhum alerta de estoque ou vencimento no momento.
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
