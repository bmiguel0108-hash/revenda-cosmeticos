"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function cancelSale(id) {
  const supabase = await createClient();

  const { error } = await supabase.from("sales").update({ status: "cancelado" }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/vendas");
  revalidatePath("/catalogo");
  revalidatePath("/contas-a-receber");
  revalidatePath("/recebimentos");
  revalidatePath("/clientes");
  revalidatePath("/");

  return { success: true };
}

export async function updateSaleNotes(id, notes) {
  const supabase = await createClient();

  const { error } = await supabase.from("sales").update({ notes }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/vendas");
  return { success: true };
}
