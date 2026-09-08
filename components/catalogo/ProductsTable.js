"use client";

import { useState, useTransition } from "react";
import {
  updateProduct,
  toggleProductActive,
  adjustStock,
} from "@/app/catalogo/actions";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
      setError("Informe uma quantidade (use número negativo para saída).");
      return;
    }
    startTransition(async () => {
      const result = await adjustStock(product.id, value, note);
      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <tr>
      <td colSpan={9} className="bg-brand-50/50">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 py-2">
          <div>
            <label className="label">Ajuste de estoque (+ entrada / − saída)</label>
            <input
              className="input w-32"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="ex: 5 ou -2"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="label">Motivo (opcional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button type="submit" disabled={isPending} className="btn-primary">
            Confirmar
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          {error && <p className="text-xs text-red-600 w-full">{error}</p>}
        </form>
      </td>
    </tr>
  );
}

function PriceMatrixRow({ product, paymentMethods }) {
  return (
    <tr>
      <td colSpan={9} className="bg-gray-50">
        <div className="flex flex-wrap gap-3 py-3">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs min-w-[120px]">
              <p className="text-gray-500">{pm.name}</p>
              <p className="font-semibold text-gray-800">
                {formatMoney(Number(product.target_price) * Number(pm.multiplier))}
              </p>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

function ProductRow({ product, brands, paymentMethods }) {
  const [editing, setEditing] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [showStockBox, setShowStockBox] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    brand_id: product.brand_id || "",
    cost: String(product.cost),
    target_price: String(product.target_price),
    cycle: product.cycle ? String(product.cycle) : "",
    ready_for_delivery: product.ready_for_delivery,
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
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
      const result = await updateProduct(product.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleToggleActive() {
    startTransition(() => toggleProductActive(product.id, !product.active));
  }

  const margin = product.target_price
    ? ((product.target_price - product.cost) / product.target_price) * 100
    : 0;

  if (editing) {
    return (
      <tr>
        <td>
          <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </td>
        <td>
          <select className="input" value={form.brand_id} onChange={(e) => update("brand_id", e.target.value)}>
            <option value="">—</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </td>
        <td>
          <input className="input w-20" value={form.cycle} onChange={(e) => update("cycle", e.target.value)} />
        </td>
        <td>
          <input className="input w-24" value={form.cost} onChange={(e) => update("cost", e.target.value)} />
        </td>
        <td>
          <input className="input w-24" value={form.target_price} onChange={(e) => update("target_price", e.target.value)} />
        </td>
        <td colSpan={2} className="text-gray-400 text-xs">calculado ao salvar</td>
        <td>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={form.ready_for_delivery}
              onChange={(e) => update("ready_for_delivery", e.target.checked)}
            />
            Pronto
          </label>
        </td>
        <td className="space-x-2 whitespace-nowrap">
          <button className="btn-primary" disabled={isPending} onClick={handleSave}>Salvar</button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className={!product.active ? "opacity-40" : ""}>
        <td className="font-medium text-gray-800">{product.name}</td>
        <td className="text-gray-500">{product.brands?.name || "—"}</td>
        <td className="text-gray-500">{product.cycle || "—"}</td>
        <td>{formatMoney(product.cost)}</td>
        <td>{formatMoney(product.target_price)}</td>
        <td className="text-emerald-700">{formatMoney(product.profit)}</td>
        <td className="text-gray-500">{margin.toFixed(0)}%</td>
        <td>
          <span
            className={`badge ${
              product.stock_quantity <= 0
                ? "bg-red-50 text-red-600"
                : product.stock_quantity <= 3
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {product.stock_quantity} un.
          </span>
          {product.ready_for_delivery && (
            <span className="badge bg-brand-50 text-brand-700 ml-1">pronta entrega</span>
          )}
        </td>
        <td className="space-x-2 whitespace-nowrap">
          <button className="btn-secondary" onClick={() => setEditing(true)}>Editar</button>
          <button className="btn-secondary" onClick={() => setShowStockBox((v) => !v)}>Estoque</button>
          <button className="btn-secondary" onClick={() => setShowPrices((v) => !v)}>
            {showPrices ? "Ocultar preços" : "Ver preços"}
          </button>
          <button className="btn-danger" disabled={isPending} onClick={handleToggleActive}>
            {product.active ? "Desativar" : "Reativar"}
          </button>
        </td>
      </tr>
      {showStockBox && <StockAdjustBox product={product} onClose={() => setShowStockBox(false)} />}
      {showPrices && <PriceMatrixRow product={product} paymentMethods={paymentMethods} />}
    </>
  );
}

export default function ProductsTable({ products, brands, paymentMethods }) {
  return (
    <section className="card overflow-x-auto">
      <table className="table-base min-w-[900px]">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Marca</th>
            <th>Ciclo</th>
            <th>Custo</th>
            <th>Venda Revista</th>
            <th>Lucro</th>
            <th>Margem</th>
            <th>Estoque</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              brands={brands}
              paymentMethods={paymentMethods}
            />
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-gray-400 py-6">
                Nenhum produto cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
