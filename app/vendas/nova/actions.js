"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  // Busca custo e preço-alvo atuais de cada produto, para "fotografar" no momento da venda
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, cost, target_price")
    .in("id", productIds);

  if (productsError) return { error: productsError.message };

  const productMap = new Map(products.map((p) => [p.id, p]));

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

  // 2. Insere os itens (isso baixa o estoque e recalcula o valor da venda sozinho)
  const itemRows = items.map((item) => {
    const product = productMap.get(item.product_id);
    return {
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: product?.cost ?? 0,
      unit_price: product?.target_price ?? 0,
    };
  });

  const { error: itemsError } = await supabase.from("sale_items").insert(itemRows);

  if (itemsError) return { error: itemsError.message };

  // 3. Se houver entrada, já registra como um recebimento
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
