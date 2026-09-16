// Contas compartilhadas dos combos (kits de 2+ produtos vendidos juntos,
// com um preço combinado que normalmente é menor que a soma dos preços
// individuais). Usado tanto na tela de Catálogo (mostrar economia/lucro)
// quanto na Nova Venda (calcular o preço "repartido" de cada produto do
// combo, para que o valor total da venda bata com o preço do combo).

// items: [{ quantity, product: { cost, target_price, stock_quantity } }]
export function computeComboTotals(items = []) {
  let totalCost = 0;
  let individualTotal = 0;
  let availableStock = null;

  for (const it of items) {
    const qty = Number(it.quantity || 0);
    const cost = Number(it.product?.cost || 0);
    const price = Number(it.product?.target_price || 0);
    const stock = Number(it.product?.stock_quantity || 0);

    totalCost += qty * cost;
    individualTotal += qty * price;

    if (qty > 0) {
      const possible = Math.floor(stock / qty);
      availableStock = availableStock === null ? possible : Math.min(availableStock, possible);
    }
  }

  return {
    totalCost,
    individualTotal,
    availableStock: availableStock ?? 0,
  };
}

export function comboDerived(combo, items = []) {
  const { totalCost, individualTotal, availableStock } = computeComboTotals(items);
  const targetPrice = Number(combo?.target_price || 0);
  return {
    totalCost,
    individualTotal,
    availableStock,
    savings: individualTotal - targetPrice,
    profit: targetPrice - totalCost,
  };
}

// Reparte o preço do combo entre os produtos que o compõem, proporcional ao
// preço-alvo de cada um — assim a soma dos itens "explodidos" bate com o
// preço do combo, e o desconto fica distribuído de forma justa entre eles.
export function comboComponentUnitPrices(comboTargetPrice, items = []) {
  const { individualTotal } = computeComboTotals(items);
  const targetPrice = Number(comboTargetPrice || 0);

  return items.map((it) => {
    const price = Number(it.product?.target_price || 0);
    const share = individualTotal > 0 ? price / individualTotal : 1 / items.length;
    return {
      product_id: it.product_id,
      quantity: Number(it.quantity || 0),
      unit_cost: Number(it.product?.cost || 0),
      unit_price: Math.round(targetPrice * share * 100) / 100,
    };
  });
}
