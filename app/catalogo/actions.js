"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  return Number(value.replace(",", ".")) || 0;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

function extractStoragePath(photoUrl) {
  if (!photoUrl) return null;
  const marker = "/product-photos/";
  const idx = photoUrl.indexOf(marker);
  if (idx === -1) return null;
  return photoUrl.slice(idx + marker.length);
}

async function uploadProductPhoto(supabase, file) {
  if (!file || typeof file === "string" || !file.size) return { photo_url: null };

  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "A foto precisa ter no máximo 5MB." };
  }

  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-photos")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from("product-photos").getPublicUrl(path);
  return { photo_url: data.publicUrl };
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

  const photoFile = formData.get("photo");
  const photoResult = await uploadProductPhoto(supabase, photoFile);
  if (photoResult.error) return { error: photoResult.error };

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      brand_id,
      cost,
      target_price,
      cycle,
      ready_for_delivery,
      photo_url: photoResult.photo_url,
    })
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

  const update = { name, brand_id, cost, target_price, cycle, ready_for_delivery };

  const photoFile = formData.get("photo");
  if (photoFile && typeof photoFile !== "string" && photoFile.size) {
    const photoResult = await uploadProductPhoto(supabase, photoFile);
    if (photoResult.error) return { error: photoResult.error };
    update.photo_url = photoResult.photo_url;

    const previousUrl = formData.get("previous_photo_url")?.toString();
    const oldPath = extractStoragePath(previousUrl);
    if (oldPath) {
      await supabase.storage.from("product-photos").remove([oldPath]);
    }
  }

  const { error } = await supabase.from("products").update(update).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/catalogo");
  return { success: true };
}

export async function removeProductPhoto(id, currentPhotoUrl) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ photo_url: null })
    .eq("id", id);

  if (error) return { error: error.message };

  const oldPath = extractStoragePath(currentPhotoUrl);
  if (oldPath) {
    await supabase.storage.from("product-photos").remove([oldPath]);
  }

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
