"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  return Number(value.replace(",", ".")) || 0;
}

// ---------- Formas de pagamento ----------

export async function createPaymentMethod(formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();
  const feePercent = parseNumber(formData.get("fee_percent"));

  if (!name) return { error: "Informe o nome da forma de pagamento." };

  const { error } = await supabase.from("payment_methods").insert({
    name,
    fee_rate: feePercent / 100,
  });

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function updatePaymentMethod(id, formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();
  const feePercent = parseNumber(formData.get("fee_percent"));

  if (!name) return { error: "Informe o nome da forma de pagamento." };

  const { error } = await supabase
    .from("payment_methods")
    .update({ name, fee_rate: feePercent / 100 })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function togglePaymentMethodActive(id, active) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ active })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: true };
}

// ---------- Marcas ----------

export async function createBrand(formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();

  if (!name) return { error: "Informe o nome da marca." };

  const { error } = await supabase.from("brands").insert({ name });

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function updateBrand(id, formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();

  if (!name) return { error: "Informe o nome da marca." };

  const { error } = await supabase.from("brands").update({ name }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function toggleBrandActive(id, active) {
  const supabase = await createClient();
  const { error } = await supabase.from("brands").update({ active }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  return { success: true };
}

// ---------- Categorias ----------

export async function createCategory(formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();

  if (!name) return { error: "Informe o nome da categoria." };

  const { error } = await supabase.from("categories").insert({ name });

  if (error) {
    if (error.code === "23505") return { error: "Já existe uma categoria com esse nome." };
    return { error: error.message };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function updateCategory(id, formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();

  if (!name) return { error: "Informe o nome da categoria." };

  const { error } = await supabase.from("categories").update({ name }).eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Já existe uma categoria com esse nome." };
    return { error: error.message };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function deleteCategory(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/catalogo");
  return { success: true };
}
