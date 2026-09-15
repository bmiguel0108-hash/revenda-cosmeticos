"use client";

import { useState, useTransition } from "react";
import { updateCustomer } from "@/app/clientes/actions";
import { formatMoney, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

function HistoryRow({ sales }) {
  if (sales.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="bg-gray-50 text-center text-gray-400 text-xs py-3">
          Nenhuma compra registrada ainda.
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={5} className="bg-gray-50 p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Venda</th>
              <th>Data</th>
              <th>Forma</th>
              <th>Valor</th>
              <th>Lucro</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>#{s.sale_number}</td>
                <td>{formatDate(s.sale_date)}</td>
                <td className="text-gray-500">{s.payment_method_name}</td>
                <td>{formatMoney(s.final_value)}</td>
                <td className={Number(s.profit) < 0 ? "text-red-600" : "text-emerald-700"}>
                  {s.display_status === "cancelado" ? "—" : formatMoney(s.profit)}
                </td>
                <td>
                  <StatusBadge status={s.display_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function CustomerRow({ customer, sales }) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone || "",
    notes: customer.notes || "",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    setError("");
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.set(key, value));

    startTransition(async () => {
      const result = await updateCustomer(customer.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  const customerSales = sales.filter((s) => s.customer_id === customer.id);
  const activeSales = customerSales.filter((s) => s.display_status !== "cancelado");
  const totalSpent = activeSales.reduce((sum, s) => sum + Number(s.final_value), 0);
  const totalProfit = activeSales.reduce((sum, s) => sum + Number(s.profit), 0);
  const lastPurchase = customerSales[0]?.sale_date;

  if (editing) {
    return (
      <tr>
        <td>
          <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </td>
        <td>
          <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </td>
        <td colSpan={2}>
          <input className="input" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
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
      <tr>
        <td className="font-medium text-gray-800">{customer.name}</td>
        <td className="text-gray-500">{customer.phone || "—"}</td>
        <td className="text-gray-500">
          {formatMoney(totalSpent)} em {activeSales.length} compra(s)
          <br />
          <span className="text-xs text-emerald-700">lucro {formatMoney(totalProfit)}</span>
        </td>
        <td className="text-gray-500">{lastPurchase ? formatDate(lastPurchase) : "—"}</td>
        <td className="space-x-2 whitespace-nowrap">
          <button className="btn-secondary" onClick={() => setEditing(true)}>Editar</button>
          <button className="btn-secondary" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? "Ocultar histórico" : "Ver histórico"}
          </button>
        </td>
      </tr>
      {showHistory && <HistoryRow sales={customerSales} />}
    </>
  );
}

export default function CustomersTable({ customers, sales }) {
  return (
    <section className="card overflow-x-auto">
      <table className="table-base min-w-[700px]">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Total comprado</th>
            <th>Última compra</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <CustomerRow key={customer.id} customer={customer} sales={sales} />
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-gray-400 py-6">
                Nenhum cliente cadastrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
