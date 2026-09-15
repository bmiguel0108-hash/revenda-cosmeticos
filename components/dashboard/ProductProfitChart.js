"use client";

import { useState } from "react";

const BAR_COLOR = "#2a78d6"; // azul — categoria nominal, uma cor só para todas as barras
const CRITICAL_COLOR = "#d03b3b"; // vermelho reservado para estado (lucro negativo), nunca por identidade

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Ranking de lucro por produto vendido — uma barra por produto, uma única
 * cor (o valor é o que muda, não a identidade), maior lucro no topo. Sempre
 * com uma tabela completa como alternativa acessível.
 */
export default function ProductProfitChart({ title, subtitle, data, topN = 10 }) {
  const [showTable, setShowTable] = useState(false);

  const sorted = [...data].sort((a, b) => b.profit - a.profit);
  const top = sorted.slice(0, topN);
  const maxProfit = Math.max(1, ...sorted.map((d) => d.profit));

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {sorted.length > 0 && (
          <button
            type="button"
            className="text-xs text-brand-600 underline shrink-0"
            onClick={() => setShowTable((v) => !v)}
          >
            {showTable ? "Ver gráfico" : "Ver como tabela"}
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">
          Nenhum item vendido ainda.
        </p>
      ) : showTable ? (
        <div className="overflow-x-auto">
          <table className="table-base min-w-[320px]">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd. vendida</th>
                <th>Lucro</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.productId}>
                  <td className="text-gray-700">{row.name}</td>
                  <td className="text-gray-500">{row.quantity}</td>
                  <td className={row.profit < 0 ? "text-red-600" : "text-gray-800"}>
                    {formatMoney(row.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {top.map((row) => {
            const pct = Math.max(2, (Math.abs(row.profit) / maxProfit) * 100);
            const negative = row.profit < 0;
            return (
              <div key={row.productId}>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-gray-700 font-medium break-words">{row.name}</span>
                  <span className={`font-semibold shrink-0 ${negative ? "text-red-600" : "text-gray-800"}`}>
                    {formatMoney(row.profit)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-brand-50 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: negative ? CRITICAL_COLOR : BAR_COLOR }}
                  />
                </div>
              </div>
            );
          })}
          {sorted.length > topN && (
            <p className="text-xs text-gray-400 pt-1">
              Mostrando os {topN} produtos com mais lucro. Clique em &quot;Ver como
              tabela&quot; para ver todos.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
