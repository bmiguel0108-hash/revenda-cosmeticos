"use client";

import { useRef, useState, useTransition } from "react";
import { createProduct } from "@/app/catalogo/actions";

const initialState = {
  name: "",
  brand_id: "",
  cost: "",
  target_price: "",
  cycle: "",
  initial_stock: "",
  expiration_date: "",
  ready_for_delivery: false,
};

export default function NewProductForm({ brands }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(e) {
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
    }

    startTransition(async () => {
      const result = await createProduct(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setForm(initialState);
        setPhotoPreview(null);
        if (fileRef.current) fileRef.current.value = "";
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Novo produto
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Novo produto</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-brand-50">
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div>
            <label className="label">Foto do produto (opcional)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block text-xs text-gray-500 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-100 file:px-2 file:py-1 file:text-xs file:text-brand-700"
            />
          </div>
        </div>

        <div>
          <label className="label">Produto</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Marca</label>
          <select
            className="input"
            value={form.brand_id}
            onChange={(e) => update("brand_id", e.target.value)}
          >
            <option value="">— Selecione —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Ciclo</label>
          <input
            className="input"
            value={form.cycle}
            onChange={(e) => update("cycle", e.target.value)}
            placeholder="ex: 14"
          />
        </div>

        <div>
          <label className="label">Custo (R$)</label>
          <input
            className="input"
            value={form.cost}
            onChange={(e) => update("cost", e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="label">Venda Revista — preço-alvo (R$)</label>
          <input
            className="input"
            value={form.target_price}
            onChange={(e) => update("target_price", e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="label">Estoque inicial</label>
          <input
            className="input"
            value={form.initial_stock}
            onChange={(e) => update("initial_stock", e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="label">Data de vencimento (opcional)</label>
          <input
            type="date"
            className="input"
            value={form.expiration_date}
            onChange={(e) => update("expiration_date", e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.ready_for_delivery}
          onChange={(e) => update("ready_for_delivery", e.target.checked)}
        />
        Pronto para entrega (já tenho em mãos)
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="flex gap-2 mt-5">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Salvando..." : "Salvar produto"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setOpen(false);
            setForm(initialState);
            setPhotoPreview(null);
            if (fileRef.current) fileRef.current.value = "";
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
