"use client";

import { useMemo, useState, useTransition } from "react";
import { updateCombo, toggleComboActive, deleteCombo } from "@/app/catalogo/comboActions";
import { computeComboTotals } from "@/lib/combos";
import ComboItemsEditor from "@/components/catalogo/ComboItemsEditor";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function StockBadge({ quantity }) {
  const cls =
    quantity <= 0
      ? "bg-red-50 text-red-600"
      : quantity <= 2
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";
  return <span className={`badge ${cls}`}>{quantity} combo(s) possível(is)</span>;
}

function EditForm({ combo, products, onClose }) {
  const [name, setName] = useState(combo.name);
  const [targetPrice, setTargetPrice] = useState(String(combo.target_price));
  const [items, setItems] = useState(combo.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const itemsWithProduct = items.map((i) => ({ ...i, product: productMap.get(i.product_id) }));
  const totals = computeComboTotals(itemsWithProduct);
  const targetPriceNumber = parseFloat(String(targetPrice).replace(",", ".")) || 0;

  function handleSave(e) {
    e.preventDefault();
    setError("");
    if (items.length < 2) {
      setError("Escolha pelo menos 2 produtos diferentes para o combo.");
      return;
    }
    const formData = new FormData();
    formData.set("name", name);
    formData.set("target_price", targetPrice);
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await updateCombo(combo.id, formData);
      if (result?.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do combo" />
      <input
        className="input"
        value={targetPrice}
        onChange={(e) => setTargetPrice(e.target.value)}
        placeholder="Preço final (R$)"
      />
      <ComboItemsEditor products={products} items={items} onChange={setItems} />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="text-gray-500">Soma individual</p>
          <p className="font-semibold text-gray-800">{formatMoney(totals.individualTotal)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
          <p className="text-emerald-700">Lucro</p>
          <p className="font-semibold text-emerald-700">
            {formatMoney(targetPriceNumber - totals.totalCost)}
          </p>
        </div>
      </div>

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

export default function ComboCard({ combo, products }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggleActive() {
    startTransition(() => toggleComboActive(combo.id, !combo.active));
  }

  function handleDelete() {
    if (!confirm(`Remover o combo "${combo.name}"?`)) return;
    startTransition(() => deleteCombo(combo.id));
  }

  return (
    <div className={`card flex flex-col p-4 ${!combo.active ? "opacity-50" : ""}`}>
      {editing ? (
        <EditForm combo={combo} products={products} onClose={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 leading-tight">{combo.name}</p>
            <StockBadge quantity={combo.availableStock} />
          </div>

          <ul className="mt-2 text-xs text-gray-500 space-y-0.5">
            {combo.items.map((i) => (
              <li key={i.product_id}>
                {i.quantity}x {i.product?.name || "Produto removido"}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-lg font-semibold text-brand-700">{formatMoney(combo.target_price)}</p>
            <p className="text-xs text-gray-400 line-through">{formatMoney(combo.individualTotal)}</p>
          </div>
          <p className="text-xs text-brand-600">
            economia de {formatMoney(combo.savings)} para o cliente
          </p>
          <p className={`text-xs ${combo.profit < 0 ? "text-red-600" : "text-emerald-700"}`}>
            lucro {formatMoney(combo.profit)}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={() => setEditing(true)}>Editar</button>
            <button className="btn-danger" disabled={isPending} onClick={handleToggleActive}>
              {combo.active ? "Desativar" : "Reativar"}
            </button>
            <button className="btn-secondary col-span-2" disabled={isPending} onClick={handleDelete}>
              Remover combo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
