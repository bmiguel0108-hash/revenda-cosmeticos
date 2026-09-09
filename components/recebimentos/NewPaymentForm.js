"use client";

import { useState, useTransition } from "react";
import { createPayment } from "@/app/recebimentos/actions";
import { formatMoney } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const initialState = {
  sale_id: "",
  payment_date: todayISO(),
  amount: "",
  payment_method_id: "",
  installment_label: "",
  has_receipt: false,
  notes: "",
};

export default function NewPaymentForm({ sales, paymentMethods }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const selectedSale = sales.find((s) => s.id === form.sale_id);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "has_receipt") {
        if (value) formData.set(key, "on");
      } else {
        formData.set(key, value);
      }
    });

    startTransition(async () => {
      const result = await createPayment(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setForm({ ...initialState, payment_date: todayISO() });
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar recebimento</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="label">Venda</label>
          <select
            className="input"
            value={form.sale_id}
            onChange={(e) => update("sale_id", e.target.value)}
          >
            <option value="">— Selecione —</option>
            {sales.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.sale_number} — {s.customer_name || "sem cliente"} — saldo{" "}
                {formatMoney(s.balance_due)}
              </option>
            ))}
          </select>
          {selectedSale && (
            <p className="text-xs text-gray-500 mt-1">
              Saldo devedor atual: {formatMoney(selectedSale.balance_due)}
            </p>
          )}
        </div>

        <div>
          <label className="label">Data do recebimento</label>
          <input
            type="date"
            className="input"
            value={form.payment_date}
            onChange={(e) => update("payment_date", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Valor recebido (R$)</label>
          <input
            className="input"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            placeholder="0,00"
          />
        </div>

        <div>
          <label className="label">Forma de pagamento</label>
          <select
            className="input"
            value={form.payment_method_id}
            onChange={(e) => update("payment_method_id", e.target.value)}
          >
            <option value="">— Selecione —</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Parcela</label>
          <input
            className="input"
            value={form.installment_label}
            onChange={(e) => update("installment_label", e.target.value)}
            placeholder='"Entrada", "1", "2"...'
          />
        </div>

        <div className="lg:col-span-2">
          <label className="label">Observações</label>
          <input
            className="input"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.has_receipt}
          onChange={(e) => update("has_receipt", e.target.checked)}
        />
        Tem comprovante
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {success && <p className="text-sm text-emerald-700 mt-3">Recebimento registrado!</p>}

      <button type="submit" disabled={isPending} className="btn-primary mt-4">
        {isPending ? "Salvando..." : "Registrar recebimento"}
      </button>
    </form>
  );
}
