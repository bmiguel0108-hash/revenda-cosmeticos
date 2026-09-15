// Soma o lucro (preço - custo, já considerando a quantidade) de cada produto
// vendido, a partir dos itens de venda — ignora vendas canceladas.
export function buildProductProfitRanking(saleItems = []) {
  const byProduct = new Map();

  for (const item of saleItems) {
    if (item.sales?.status === "cancelado") continue;

    const productId = item.product_id;
    const name = item.products?.name || "Produto removido";
    const quantity = Number(item.quantity || 0);
    const profit = quantity * (Number(item.unit_price || 0) - Number(item.unit_cost || 0));

    if (!byProduct.has(productId)) {
      byProduct.set(productId, { productId, name, profit: 0, quantity: 0 });
    }
    const row = byProduct.get(productId);
    row.profit += profit;
    row.quantity += quantity;
  }

  return Array.from(byProduct.values()).sort((a, b) => b.profit - a.profit);
}
