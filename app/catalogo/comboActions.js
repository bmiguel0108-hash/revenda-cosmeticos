"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  return Number(value.replace(",", ".")) || 0;
}

function parseItems(value) {
  try {
    const parsed = JSON.parse(value?.toString() || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((i) => ({ product_id: i.product_id, quantity: parseInt(i.quantity, 10) || 1 }))
      .filter((i) => i.product_id);
  } catch {
    return [];
  }
}

async function syncComboItems(supabase, comboId, items) {
  await supabase.from("combo_items").delete().eq("combo_id", comboId);
  await supabase
    .from("combo_items")
    .insert(items.map((i) => ({ combo_id: comboId, product_id: i.product_id, quantity: i.quantity })));
}

export async function createCombo(formData) {
  const supabase = await createClient();

  const name = formData.get("name")?.toString().trim();
  const target_price = parseNumber(formData.get("target_price"));
  const items = parseItems(formData.get("items"));

  if (!name) return { error: "Informe o nome do combo." };

  const uniqueProducts = new Set(items.map((i) => i.product_id));
  if (uniqueProducts.size < 2) {
    return { error: "Escolha pelo menos 2 produtos diferentes para o combo." };
  }

  const { data, error } = await supabase
    .from("combos")
    .insert({ name, target_price })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { error: itemsError } = await supabase
    .from("combo_items")
    .insert(items.map((i) => ({ combo_id: data.id, product_id: i.product_id, quantity: i.quantity })));

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/catalogo");
  revalidatePath("/vendas/nova");
  return { success: true };
}

export async function updateCombo(id, formData) {
  const supabase = await createClient();

  const name = formData.get("name")?.toString().trim();
  const target_price = parseNumber(formData.get("target_price"));
  const items = parseItems(formData.get("items"));

  if (!name) return { error: "Informe o nome do combo." };

  const uniqueProducts = new Set(items.map((i) => i.product_id));
  if (uniqueProducts.size < 2) {
    return { error: "Escolha pelo menos 2 produtos diferentes para o combo." };
  }

  const { error } = await supabase.from("combos").update({ name, target_price }).eq("id", id);
  if (error) return { error: error.message };

  await syncComboItems(supabase, id, items);

  revalidatePath("/catalogo");
  revalidatePath("/vendas/nova");
  return { success: true };
}

export async function toggleComboActive(id, active) {
  const supabase = await createClient();
  const { error } = await supabase.from("combos").update({ active }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/catalogo");
  revalidatePath("/vendas/nova");
  return { success: true };
}

export async function deleteCombo(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("combos").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/catalogo");
  revalidatePath("/vendas/nova");
  return { success: true };
}
