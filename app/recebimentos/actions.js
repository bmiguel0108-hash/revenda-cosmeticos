"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  return Number(value.replace(",", ".")) || 0;
}

function revalidateAll() {
  revalidatePath("/recebimentos");
  revalidatePath("/vendas");
  revalidatePath("/contas-a-receber");
  revalidatePath("/clientes");
  revalidatePath("/");
}

export async function createPayment(formData) {
  const supabase = await createClient();

  const sale_id = formData.get("sale_id")?.toString();
  const payment_date = formData.get("payment_date")?.toString();
  const amount = parseNumber(formData.get("amount"));
  const payment_method_id = formData.get("payment_method_id")?.toString() || null;
  const installment_label = formData.get("installment_label")?.toString().trim() || null;
  const has_receipt = formData.get("has_receipt") === "on";
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!sale_id) return { error: "Selecione a venda." };
  if (!amount || amount <= 0) return { error: "Informe um valor recebido maior que zero." };

  const { error } = await supabase.from("payments").insert({
    sale_id,
    payment_date,
    amount,
    payment_method_id,
    installment_label,
    has_receipt,
    notes,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deletePayment(id) {
  const supabase = await createClient();

  const { error } = await supabase.from("payments").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
