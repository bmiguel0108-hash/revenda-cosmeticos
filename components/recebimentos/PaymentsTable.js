"use client";

import { useTransition } from "react";
import { deletePayment } from "@/app/recebimentos/actions";
import { formatMoney, formatDate } from "@/lib/format";

export default function PaymentsTable({ payments }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id, saleNumber) {
    if (!confirm(`Excluir esse recebimento da venda #${saleNumber}? Essa ação não pode ser desfeita.`))
      return;
    startTransition(() => deletePayment(id));
  }

  return (
    <section className="card overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Histórico de recebimentos</h2>
      <table className="table-base min-w-[800px]">
        <thead>
          <tr>
            <th>Data</th>
            <th>Venda</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Forma</th>
            <th>Parcela</th>
            <th>Comprovante</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{formatDate(p.payment_date)}</td>
              <td>#{p.sales?.sale_number}</td>
              <td className="text-gray-500">{p.sales?.customers?.name || "—"}</td>
              <td className="font-medium">{formatMoney(p.amount)}</td>
              <td className="text-gray-500">{p.payment_methods?.name || "—"}</td>
              <td>{p.installment_label || "—"}</td>
              <td>{p.has_receipt ? "Sim" : "Não"}</td>
              <td>
                <button
                  className="btn-danger"
                  disabled={isPending}
                  onClick={() => handleDelete(p.id, p.sales?.sale_number)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-gray-400 py-6">
                Nenhum recebimento registrado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
