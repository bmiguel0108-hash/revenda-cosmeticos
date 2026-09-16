"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { comboComponentUnitPrices } from "@/lib/combos";

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  return Number(value.replace(",", ".")) || 0;
}

export async function createSale(formData) {
  const supabase = await createClient();

  const customer_id = formData.get("customer_id")?.toString() || null;
  const payment_method_id = formData.get("payment_method_id")?.toString();
  const sale_date = formData.get("sale_date")?.toString() || undefined;
  const down_payment = parseNumber(formData.get("down_payment"));
  const installments_count = parseInt(formData.get("installments_count"), 10) || 1;
  const notes = formData.get("notes")?.toString().trim() || null;
  const itemsRaw = formData.get("items")?.toString();

  if (!payment_method_id) return { error: "Selecione a forma de pagamento." };

  let items;
  try {
    items = JSON.parse(itemsRaw || "[]");
  } catch {
    return { error: "Itens da venda inválidos." };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "Adicione pelo menos um produto à venda." };
  }

  const productItems = items.filter((i) => (i.kind || "product") === "product");
  const comboItems = items.filter((i) => i.kind === "combo");

  // Busca custo e preço-alvo atuais de cada produto avulso, para "fotografar" no momento da venda
  const productIds = productItems.map((i) => i.product_id);
  let productMap = new Map();
  if (productIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, cost, target_price")
      .in("id", productIds);

    if (productsError) return { error: productsError.message };
    productMap = new Map(products.map((p) => [p.id, p]));
  }

  // Busca os combos e os produtos que os compõem, para "explodir" cada combo
  // vendido nos produtos reais (o estoque de cada um baixa sozinho, como já
  // acontece com qualquer item de venda).
  const comboIds = comboItems.map((i) => i.combo_id);
  let comboMap = new Map();
  if (comboIds.length > 0) {
    const { data: combos, error: combosError } = await supabase
      .from("combos")
      .select(
        "id, name, target_price, combo_items(product_id, quantity, products(id, cost, target_price))"
      )
      .in("id", comboIds);

    if (combosError) return { error: combosError.message };
    comboMap = new Map(combos.map((c) => [c.id, c]));
  }

  // 1. Cria a venda (valores começam em zero, os gatilhos do banco recalculam ao inserir os itens)
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      customer_id,
      payment_method_id,
      sale_date,
      down_payment,
      installments_count,
      notes,
    })
    .select("id, sale_number")
    .single();

  if (saleError) return { error: saleError.message };

  // 2. Monta as linhas de sale_items — produtos avulsos primeiro...
  const itemRows = productItems.map((item) => {
    const product = productMap.get(item.product_id);
    return {
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: product?.cost ?? 0,
      unit_price: product?.target_price ?? 0,
    };
  });

  // ...e cada combo "explodido" nos produtos que o compõem, com o preço do
  // combo repartido proporcionalmente entre eles.
  for (const item of comboItems) {
    const combo = comboMap.get(item.combo_id);
    if (!combo) continue;

    const comboProductItems = (combo.combo_items || []).map((ci) => ({
      product_id: ci.product_id,
      quantity: ci.quantity,
      product: ci.products,
    }));
    const unitBreakdown = comboComponentUnitPrices(combo.target_price, comboProductItems);

    for (const part of unitBreakdown) {
      itemRows.push({
        sale_id: sale.id,
        product_id: part.product_id,
        quantity: part.quantity * item.quantity,
        unit_cost: part.unit_cost,
        unit_price: part.unit_price,
        combo_id: combo.id,
        combo_name: combo.name,
      });
    }
  }

  // 3. Insere os itens (isso baixa o estoque e recalcula o valor da venda sozinho)
  const { error: itemsError } = await supabase.from("sale_items").insert(itemRows);

  if (itemsError) return { error: itemsError.message };

  // 4. Se houver entrada, já registra como um recebimento
  if (down_payment > 0) {
    await supabase.from("payments").insert({
      sale_id: sale.id,
      payment_date: sale_date || new Date().toISOString().slice(0, 10),
      amount: down_payment,
      payment_method_id,
      installment_label: "Entrada",
    });
  }

  revalidatePath("/vendas");
  revalidatePath("/vendas/nova");
  revalidatePath("/catalogo");
  revalidatePath("/contas-a-receber");
  revalidatePath("/recebimentos");
  revalidatePath("/clientes");
  revalidatePath("/");

  return { success: true, saleNumber: sale.sale_number };
}
