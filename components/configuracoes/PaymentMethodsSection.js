"use client";

import { useState, useTransition } from "react";
import {
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethodActive,
} from "@/app/configuracoes/actions";

function formatPercent(rate) {
  return (Number(rate) * 100).toFixed(2).replace(".", ",");
}

function EditableRow({ method }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(method.name);
  const [feePercent, setFeePercent] = useState(formatPercent(method.fee_rate));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    const formData = new FormData();
    formData.set("name", name);
    formData.set("fee_percent", feePercent);

    startTransition(async () => {
      const result = await updatePaymentMethod(method.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleToggle() {
    startTransition(() => togglePaymentMethodActive(method.id, !method.active));
  }

  if (editing) {
    return (
      <tr>
        <td>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td>
          <input
            className="input"
            value={feePercent}
            onChange={(e) => setFeePercent(e.target.value)}
          />
        </td>
        <td className="text-gray-500">
          {(1 / (1 - parseFloat(feePercent.replace(",", ".")) / 100 || 0)).toFixed(4)}
        </td>
        <td className="space-x-2 whitespace-nowrap">
          <button className="btn-primary" disabled={isPending} onClick={handleSave}>
            Salvar
          </button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>
            Cancelar
          </button>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className={!method.active ? "opacity-40" : ""}>
      <td className="font-medium text-gray-800">{method.name}</td>
      <td>{formatPercent(method.fee_rate)}%</td>
      <td className="text-gray-500">{Number(method.multiplier).toFixed(4)}</td>
      <td className="space-x-2 whitespace-nowrap">
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button className="btn-danger" disabled={isPending} onClick={handleToggle}>
          {method.active ? "Desativar" : "Reativar"}
        </button>
      </td>
    </tr>
  );
}

function NewRowForm() {
  const [name, setName] = useState("");
  const [feePercent, setFeePercent] = useState("0");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("name", name);
    formData.set("fee_percent", feePercent);

    startTransition(async () => {
      const result = await createPaymentMethod(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setName("");
        setFeePercent("0");
      }
    });
  }

  return (
    <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 mt-4 pt-4 border-t border-gray-100">
      <div>
        <label className="label">Nova forma de pagamento</label>
        <input
          className="input"
          placeholder="ex: Maquininha 5x"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Taxa (%)</label>
        <input
          className="input w-28"
          value={feePercent}
          onChange={(e) => setFeePercent(e.target.value)}
        />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        Adicionar
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

export default function PaymentMethodsSection({ paymentMethods }) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Formas de Pagamento
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        O multiplicador é calculado sozinho: 1 ÷ (1 − taxa). É ele que o
        sistema usa para calcular o preço de cada produto em cada forma de
        pagamento.
      </p>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Taxa</th>
              <th>Multiplicador</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paymentMethods.map((method) => (
              <EditableRow key={method.id} method={method} />
            ))}
          </tbody>
        </table>
      </div>

      <NewRowForm />
    </section>
  );
}
