"use client";

import { useState, useTransition } from "react";
import { createProduct } from "@/app/catalogo/actions";

const initialState = {
  name: "",
  brand_id: "",
  cost: "",
  target_price: "",
  cycle: "",
  initial_stock: "",
  ready_for_delivery: false,
};

export default function NewProductForm({ brands }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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

    startTransition(async () => {
      const result = await createProduct(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setForm(initialState);
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
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
