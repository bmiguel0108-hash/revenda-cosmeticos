"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!name) return { error: "Informe o nome do cliente." };

  const { data, error } = await supabase
    .from("customers")
    .insert({ name, phone, notes })
    .select("id, name, phone")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { success: true, customer: data };
}

export async function updateCustomer(id, formData) {
  const supabase = await createClient();
  const name = formData.get("name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim() || null;
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!name) return { error: "Informe o nome do cliente." };

  const { error } = await supabase
    .from("customers")
    .update({ name, phone, notes })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clientes");
  return { success: true };
}
