"use client";

import { useRef, useState, useTransition } from "react";
import {
  updateProduct,
  toggleProductActive,
  adjustStock,
  removeProductPhoto,
} from "@/app/catalogo/actions";
import { formatDate } from "@/lib/format";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function expirationInfo(expirationDate) {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(`${expirationDate}T00:00:00`);
  const daysUntil = Math.round((expDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return { label: "vencido", className: "bg-red-50 text-red-600", urgent: true };
  }
  if (daysUntil <= 60) {
    return { label: `vence em ${daysUntil}d`, className: "bg-amber-50 text-amber-700", urgent: true };
  }
  return { label: null, className: "text-gray-500", urgent: false };
}

function PhotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-300">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          d="M4 8.5 12 4l8 4.5M4 8.5v7L12 20l8-4.5v-7M4 8.5 12 13l8-4.5M12 13v7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StockBadge({ quantity }) {
  const cls =
    quantity <= 0
      ? "bg-red-50 text-red-600"
      : quantity <= 3
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";
  return <span className={`badge ${cls}`}>{quantity} un.</span>;
}

function StockAdjustBox({ product, onClose }) {
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const value = parseInt(delta, 10);
    if (!value) {
      setError("Informe uma quantidade (negativo para saída).");
      return;
    }
    startTransition(async () => {
      const result = await adjustStock(product.id, value, note);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg bg-brand-50/60 p-3 space-y-2">
      <p className="label mb-0">Ajuste de estoque (+ entrada / − saída)</p>
      <input
        className="input"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="ex: 5 ou -2"
      />
      <input
        className="input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Motivo (opcional)"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          Confirmar
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

function PriceList({ product, paymentMethods }) {
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {paymentMethods.map((pm) => (
        <div key={pm.id} className="rounded-lg border border-brand-100 bg-brand-50/40 px-2 py-1.5 text-xs">
          <p className="text-gray-500 break-words leading-snug">{pm.name}</p>
          <p className="font-semibold text-gray-800">
            {formatMoney(Number(product.target_price) * Number(pm.multiplier))}
          </p>
        </div>
      ))}
    </div>
  );
}

function EditForm({ product, brands, onClose }) {
  const [form, setForm] = useState({
    name: product.name,
    brand_id: product.brand_id || "",
    cost: String(product.cost),
    target_price: String(product.target_price),
    cycle: product.cycle ? String(product.cycle) : "",
    expiration_date: product.expiration_date || "",
    ready_for_delivery: product.ready_for_delivery,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSave(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "ready_for_delivery") {
        if (value) formData.set(key, "on");
      } else {
        formData.set(key, value);
      }
    });
    if (fileRef.current?.files?.[0]) {
      formData.set("photo", fileRef.current.files[0]);
      formData.set("previous_photo_url", product.photo_url || "");
    }

    startTransition(async () => {
      const result = await updateProduct(product.id, formData);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-2">
      <div className="aspect-square w-full overflow-hidden rounded-lg border border-brand-100">
        {photoPreview || product.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview || product.photo_url}
            alt={form.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="block w-full text-xs text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-100 file:px-2 file:py-1 file:text-xs file:text-brand-700"
      />

      <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Produto" />
      <select className="input" value={form.brand_id} onChange={(e) => update("brand_id", e.target.value)}>
        <option value="">— Marca —</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input className="input" value={form.cost} onChange={(e) => update("cost", e.target.value)} placeholder="Custo" />
        <input className="input" value={form.target_price} onChange={(e) => update("target_price", e.target.value)} placeholder="Venda Revista" />
      </div>
      <input className="input" value={form.cycle} onChange={(e) => update("cycle", e.target.value)} placeholder="Ciclo" />
      <div>
        <label className="label">Data de vencimento (opcional)</label>
        <input
          type="date"
          className="input"
          value={form.expiration_date}
          onChange={(e) => update("expiration_date", e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={form.ready_for_delivery}
          onChange={(e) => update("ready_for_delivery", e.target.checked)}
        />
        Pronto para entrega
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function ProductCard({ product, brands, paymentMethods }) {
  const [editing, setEditing] = useState(false);
  const [showStockBox, setShowStockBox] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [isPending, startTransition] = useTransition();

  const margin = product.target_price
    ? ((product.target_price - product.cost) / product.target_price) * 100
    : 0;
  const expInfo = expirationInfo(product.expiration_date);

  function handleToggleActive() {
    startTransition(() => toggleProductActive(product.id, !product.active));
  }

  function handleRemovePhoto() {
    startTransition(() => removeProductPhoto(product.id, product.photo_url));
  }

  return (
    <div className={`card flex flex-col p-4 ${!product.active ? "opacity-50" : ""}`}>
      {editing ? (
        <EditForm product={product} brands={brands} onClose={() => setEditing(false)} />
      ) : (
        <>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            {product.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.photo_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <PhotoPlaceholder />
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
              <StockBadge quantity={product.stock_quantity} />
              {product.ready_for_delivery && (
                <span className="badge bg-brand-600 text-white">pronta entrega</span>
              )}
            </div>
            {expInfo?.urgent && (
              <div className="absolute top-2 left-2">
                <span className={`badge ${expInfo.className}`}>{expInfo.label}</span>
              </div>
            )}
            {product.photo_url && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-white"
              >
                remover foto
              </button>
            )}
          </div>

          <div className="mt-3 flex-1">
            <p className="font-semibold text-gray-800 leading-tight line-clamp-2" title={product.name}>
              {product.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {product.brands?.name || "Sem marca"}
              {product.cycle ? ` · Ciclo ${product.cycle}` : ""}
            </p>
            {product.expiration_date && (
              <p className={`text-xs mt-0.5 ${expInfo?.urgent ? expInfo.className.split(" ")[1] : "text-gray-400"}`}>
                Validade: {formatDate(product.expiration_date)}
                {expInfo?.urgent ? ` · ${expInfo.label}` : ""}
              </p>
            )}

            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-lg font-semibold text-brand-700">{formatMoney(product.target_price)}</p>
              <p className="text-xs text-gray-500">margem {margin.toFixed(0)}%</p>
            </div>
            <p className="text-xs text-emerald-700">lucro {formatMoney(product.profit)}</p>
          </div>

          {showStockBox && (
            <StockAdjustBox product={product} onClose={() => setShowStockBox(false)} />
          )}
          {showPrices && <PriceList product={product} paymentMethods={paymentMethods} />}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={() => setEditing(true)}>Editar</button>
            <button className="btn-secondary" onClick={() => setShowStockBox((v) => !v)}>Estoque</button>
            <button className="btn-secondary" onClick={() => setShowPrices((v) => !v)}>
              {showPrices ? "Ocultar preços" : "Ver preços"}
            </button>
            <button className="btn-danger" disabled={isPending} onClick={handleToggleActive}>
              {product.active ? "Desativar" : "Reativar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
