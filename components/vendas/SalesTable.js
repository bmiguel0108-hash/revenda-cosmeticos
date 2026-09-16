"use client";

import { Fragment, useState, useTransition } from "react";
import { cancelSale } from "@/app/vendas/actions";
import { formatMoney, formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

function DetailRow({ sale, items }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleCancel() {
    if (
      !confirm(
        `Cancelar a venda #${sale.sale_number}? Os produtos vendidos voltam ao estoque automaticamente.`
      )
    )
      return;

    setError("");
    startTransition(async () => {
      const result = await cancelSale(sale.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <tr>
      <td colSpan={9} className="bg-gray-50">
        <div className="p-3 space-y-3">
          <table className="table-base bg-white rounded-lg overflow-hidden">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Preço-alvo (un.)</th>
                <th>Custo (un.)</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.products?.name || "—"}
                    {item.combo_name && (
                      <span className="badge bg-brand-50 text-brand-700 ml-2">
                        combo: {item.combo_name}
                      </span>
                    )}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unit_price)}</td>
                  <td>{formatMoney(item.unit_cost)}</td>
                  <td>{formatMoney(item.unit_price * item.quantity)}</td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-3">
                    Nenhum item registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <p>Entrada: <strong>{formatMoney(sale.down_payment)}</strong></p>
            <p>Parcelas: <strong>{sale.installments_count}x de {formatMoney(sale.installment_value)}</strong></p>
            <p>Último recebimento: <strong>{formatDate(sale.last_payment_date)}</strong></p>
            <p>Próximo vencimento: <strong>{formatDate(sale.next_due_date)}</strong></p>
            {sale.notes && <p className="w-full">Observações: {sale.notes}</p>}
          </div>

          {sale.display_status !== "cancelado" && (
            <button className="btn-danger" disabled={isPending} onClick={handleCancel}>
              Cancelar venda
            </button>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </td>
    </tr>
  );
}

export default function SalesTable({ sales, itemsBySale }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="card overflow-x-auto">
      <table className="table-base min-w-[900px]">
        <thead>
          <tr>
            <th>Nº</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Forma</th>
            <th>Valor Final</th>
            <th>Recebido</th>
            <th>Saldo Devedor</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <Fragment key={sale.id}>
              <tr className={sale.display_status === "cancelado" ? "opacity-50" : ""}>
                <td>#{sale.sale_number}</td>
                <td>{formatDate(sale.sale_date)}</td>
                <td className="font-medium text-gray-800">{sale.customer_name || "—"}</td>
                <td className="text-gray-500">{sale.payment_method_name}</td>
                <td>{formatMoney(sale.final_value)}</td>
                <td className="text-gray-500">{formatMoney(sale.total_received)}</td>
                <td>{formatMoney(sale.balance_due)}</td>
                <td>
                  <StatusBadge status={sale.display_status} />
                  {sale.display_status === "atrasado" && (
                    <span className="text-xs text-red-500 block">{sale.days_overdue} dia(s)</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn-secondary"
                    onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  >
                    {expandedId === sale.id ? "Ocultar" : "Ver itens"}
                  </button>
                </td>
              </tr>
              {expandedId === sale.id && (
                <DetailRow sale={sale} items={itemsBySale[sale.id]} />
              )}
            </Fragment>
          ))}
          {sales.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-gray-400 py-6">
                Nenhuma venda registrada ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
