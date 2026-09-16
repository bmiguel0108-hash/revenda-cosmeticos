"use client";

import { useMemo, useState, useTransition } from "react";
import { createCombo } from "@/app/catalogo/comboActions";
import { computeComboTotals } from "@/lib/combos";
import ComboItemsEditor from "@/components/catalogo/ComboItemsEditor";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NewComboForm({ products }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [items, setItems] = useState([]); // { product_id, quantity }
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const itemsWithProduct = items.map((i) => ({ ...i, product: productMap.get(i.product_id) }));
  const totals = computeComboTotals(itemsWithProduct);
  const targetPriceNumber = parseFloat(String(targetPrice).replace(",", ".")) || 0;
  const savings = totals.individualTotal - targetPriceNumber;
  const profit = targetPriceNumber - totals.totalCost;

  function resetForm() {
    setName("");
    setTargetPrice("");
    setItems([]);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Informe o nome do combo.");
      return;
    }
    if (items.length < 2) {
      setError("Escolha pelo menos 2 produtos diferentes para o combo.");
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("target_price", targetPrice);
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await createCombo(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        resetForm();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Novo combo
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Novo combo</h2>
      <p className="text-xs text-gray-500 mb-4">
        Escolha 2 ou mais produtos do catálogo e o preço final do combo — o
        sistema calcula sozinho a economia e o lucro.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome do combo</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Kit Hidratação Total"
          />
        </div>
        <div>
          <label className="label">Preço final do combo (R$)</label>
          <input
            className="input"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Produtos do combo</label>
        <ComboItemsEditor products={products} items={items} onChange={setItems} />
      </div>

      {itemsWithProduct.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-gray-500 text-xs">Soma individual</p>
            <p className="font-semibold text-gray-800">{formatMoney(totals.individualTotal)}</p>
          </div>
          <div className="rounded-lg bg-brand-50 px-3 py-2">
            <p className="text-brand-700 text-xs">Economia do cliente</p>
            <p className={`font-semibold ${savings < 0 ? "text-red-600" : "text-brand-700"}`}>
              {formatMoney(savings)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-gray-500 text-xs">Custo total</p>
            <p className="font-semibold text-gray-800">{formatMoney(totals.totalCost)}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2">
            <p className="text-emerald-700 text-xs">Lucro do combo</p>
            <p className={`font-semibold ${profit < 0 ? "text-red-600" : "text-emerald-700"}`}>
              {formatMoney(profit)}
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="flex gap-2 mt-5">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Salvando..." : "Salvar combo"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            resetForm();
            setOpen(false);
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
