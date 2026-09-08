"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  return Number(value.replace(",", ".")) || 0;
}

export async function createProduct(formData) {
  const supabase = await createClient();

  const name = formData.get("name")?.toString().trim();
  const brand_id = formData.get("brand_id")?.toString() || null;
  const cost = parseNumber(formData.get("cost"));
  const target_price = parseNumber(formData.get("target_price"));
  const cycleRaw = formData.get("cycle")?.toString().trim();
  const cycle = cycleRaw ? parseInt(cycleRaw, 10) : null;
  const ready_for_delivery = formData.get("ready_for_delivery") === "on";
  const initialStockRaw = formData.get("initial_stock")?.toString().trim();
  const initialStock = initialStockRaw ? parseInt(initialStockRaw, 10) : 0;

  if (!name) return { error: "Informe o nome do produto." };

  const { data, error } = await supabase
    .from("products")
    .insert({ name, brand_id, cost, target_price, cycle, ready_for_delivery })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (initialStock && initialStock !== 0) {
    await supabase.from("stock_movements").insert({
      product_id: data.id,
      quantity: initialStock,
      type: "entrada",
      note: "Estoque inicial no cadastro do produto",
    });
  }

  revalidatePath("/catalogo");
  return { success: true };
}

export async function updateProduct(id, formData) {
  const supabase = await createClient();

  const name = formData.get("name")?.toString().trim();
  const brand_id = formData.get("brand_id")?.toString() || null;
  const cost = parseNumber(formData.get("cost"));
  const target_price = parseNumber(formData.get("target_price"));
  const cycleRaw = formData.get("cycle")?.toString().trim();
  const cycle = cycleRaw ? parseInt(cycleRaw, 10) : null;
  const ready_for_delivery = formData.get("ready_for_delivery") === "on";

  if (!name) return { error: "Informe o nome do produto." };

  const { error } = await supabase
    .from("products")
    .update({ name, brand_id, cost, target_price, cycle, ready_for_delivery })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/catalogo");
  return { success: true };
}

export async function toggleProductActive(id, active) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ active }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/catalogo");
  return { success: true };
}

export async function adjustStock(productId, quantityDelta, note) {
  const supabase = await createClient();

  if (!quantityDelta) return { error: "Informe uma quantidade diferente de zero." };

  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId,
    quantity: quantityDelta,
    type: "ajuste",
    note: note || "Ajuste manual de estoque",
  });

  if (error) return { error: error.message };

  revalidatePath("/catalogo");
  return { success: true };
}
