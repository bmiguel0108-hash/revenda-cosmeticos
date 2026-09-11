// Monta a série diária (últimos N dias) de vendas, custo, lucro e contas a
// receber (saldo acumulado), a partir das tabelas brutas de vendas e
// recebimentos — não depende da view (que só mostra o estado atual).
export function buildDashboardSeries({ sales = [], payments = [] }, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateKeys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }
  const firstDate = dateKeys[0];

  const activeSales = sales.filter((s) => s.status !== "cancelado");
  const activeSaleIds = new Set(activeSales.map((s) => s.id));

  const dailyVendas = {};
  const dailyCusto = {};
  for (const s of activeSales) {
    const key = s.sale_date;
    dailyVendas[key] = (dailyVendas[key] || 0) + Number(s.final_value || 0);
    dailyCusto[key] = (dailyCusto[key] || 0) + Number(s.total_cost || 0);
  }

  const dailyPayments = {};
  for (const p of payments) {
    if (!activeSaleIds.has(p.sale_id)) continue;
    const key = p.payment_date;
    dailyPayments[key] = (dailyPayments[key] || 0) + Number(p.amount || 0);
  }

  let cumSales = 0;
  let cumPayments = 0;
  for (const s of activeSales) {
    if (s.sale_date < firstDate) cumSales += Number(s.final_value || 0);
  }
  for (const p of payments) {
    if (activeSaleIds.has(p.sale_id) && p.payment_date < firstDate) {
      cumPayments += Number(p.amount || 0);
    }
  }

  return dateKeys.map((date) => {
    const vendas = dailyVendas[date] || 0;
    const custo = dailyCusto[date] || 0;
    const lucro = vendas - custo;
    cumSales += vendas;
    cumPayments += dailyPayments[date] || 0;
    const receivable = Math.max(0, cumSales - cumPayments);
    return { date, vendas, custo, lucro, receivable };
  });
}
