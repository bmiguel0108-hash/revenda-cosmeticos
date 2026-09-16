"use client";

import { useState } from "react";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Escolher 2+ produtos do catálogo (com quantidade) para compor um combo.
// Usado tanto ao criar quanto ao editar um combo.
export default function ComboItemsEditor({ products, items, onChange }) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qtyToAdd, setQtyToAdd] = useState("1");

  const productMap = new Map(products.map((p) => [p.id, p]));

  function handleAdd() {
    if (!selectedProductId) return;
    const qty = parseInt(qtyToAdd, 10) || 1;
    const existing = items.findIndex((i) => i.product_id === selectedProductId);
    if (existing >= 0) {
      const copy = [...items];
      copy[existing] = { ...copy[existing], quantity: copy[existing].quantity + qty };
      onChange(copy);
    } else {
      onChange([...items, { product_id: selectedProductId, quantity: qty }]);
    }
    setSelectedProductId("");
    setQtyToAdd("1");
  }

  function handleRemove(productId) {
    onChange(items.filter((i) => i.product_id !== productId));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[220px]">
          <select
            className="input"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">— Selecione um produto —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatMoney(p.target_price)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            className="input w-20"
            value={qtyToAdd}
            onChange={(e) => setQtyToAdd(e.target.value)}
            placeholder="Qtd."
          />
        </div>
        <button type="button" className="btn-secondary" onClick={handleAdd}>
          Adicionar
        </button>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-1">
          {items.map((i) => {
            const product = productMap.get(i.product_id);
            return (
              <li
                key={i.product_id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm"
              >
                <span className="text-gray-700">
                  {i.quantity}x {product?.name || "Produto"}{" "}
                  <span className="text-gray-400">({formatMoney(product?.target_price)} un.)</span>
                </span>
                <button
                  type="button"
                  className="text-xs text-red-600 underline"
                  onClick={() => handleRemove(i.product_id)}
                >
                  remover
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
