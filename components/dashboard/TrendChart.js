"use client";

import { useMemo, useState } from "react";

const CHART = {
  surface: "#ffffff",
  textPrimary: "#0b0b0b",
  textSecondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatMoneyCompact(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function formatDateShort(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  let step;
  if (residual <= 1) step = 1;
  else if (residual <= 2) step = 2;
  else if (residual <= 5) step = 5;
  else step = 10;
  return step * magnitude;
}

/**
 * Generic time-series trend chart (hand-rolled SVG, no chart library).
 * One shared Y axis only — never dual-axis. Built per the dataviz skill:
 * fixed mark specs, crosshair + one tooltip listing every series, a legend
 * for 2+ series, endpoint direct-labels, and a table-view fallback.
 */
export default function TrendChart({
  title,
  subtitle,
  data,
  series,
  height = 240,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const width = 720;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 20;
  const padBottom = 28;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const maxValue = useMemo(() => {
    let max = 0;
    data.forEach((row) => {
      series.forEach((s) => {
        if (row[s.key] > max) max = row[s.key];
      });
    });
    return niceMax(max || 1);
  }, [data, series]);

  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  function xAt(i) {
    return padLeft + i * stepX;
  }
  function yAt(value) {
    return padTop + plotHeight - (value / maxValue) * plotHeight;
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxValue);

  function pathFor(key) {
    return data
      .map((row, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(row[key]).toFixed(1)}`)
      .join(" ");
  }

  function areaPathFor(key) {
    const line = data
      .map((row, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(row[key]).toFixed(1)}`)
      .join(" ");
    return `${line} L ${xAt(data.length - 1).toFixed(1)} ${yAt(0).toFixed(1)} L ${xAt(0).toFixed(1)} ${yAt(0).toFixed(1)} Z`;
  }

  function handlePointerMove(e) {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return;
    const relX = ((clientX - rect.left) / rect.width) * width;
    const idx = Math.round((relX - padLeft) / stepX);
    setHoverIndex(Math.min(Math.max(idx, 0), data.length - 1));
  }

  function handleKeyDown(e) {
    if (hoverIndex === null) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") setHoverIndex(0);
      return;
    }
    if (e.key === "ArrowLeft") setHoverIndex((i) => Math.max(0, i - 1));
    if (e.key === "ArrowRight") setHoverIndex((i) => Math.min(data.length - 1, i + 1));
  }

  const xLabelIdxs = data.length > 1
    ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
    : [0];

  const tooltipPct = hoverIndex !== null ? (xAt(hoverIndex) / width) * 100 : null;

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="text-xs text-brand-600 underline shrink-0"
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "Ver gráfico" : "Ver como tabela"}
        </button>
      </div>

      {series.length >= 2 && (
        <div className="flex flex-wrap gap-3 mb-2">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="table-base min-w-[420px]">
            <thead>
              <tr>
                <th>Data</th>
                {series.map((s) => (
                  <th key={s.key}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date}>
                  <td className="text-gray-500">{formatDateShort(row.date)}</td>
                  {series.map((s) => (
                    <td key={s.key}>{formatMoney(row[s.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            style={{ background: CHART.surface }}
            role="img"
            aria-label={`${title}. ${subtitle || ""}`}
          >
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke={CHART.gridline}
                  strokeWidth="1"
                />
                <text x={padLeft - 8} y={yAt(t) + 3} textAnchor="end" fontSize="10" fill={CHART.muted}>
                  {formatMoneyCompact(t)}
                </text>
              </g>
            ))}

            <line
              x1={padLeft}
              x2={width - padRight}
              y1={padTop + plotHeight}
              y2={padTop + plotHeight}
              stroke={CHART.baseline}
              strokeWidth="1"
            />

            {xLabelIdxs.map((i) => (
              <text
                key={i}
                x={xAt(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                fontSize="10"
                fill={CHART.muted}
              >
                {formatDateShort(data[i].date)}
              </text>
            ))}

            {series.map((s) =>
              s.area ? (
                <path key={`${s.key}-area`} d={areaPathFor(s.key)} fill={s.color} opacity="0.1" />
              ) : null
            )}

            {series.map((s) => (
              <path
                key={s.key}
                d={pathFor(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {series.map((s) => {
              const last = data[data.length - 1];
              return (
                <g key={`${s.key}-end`}>
                  <circle
                    cx={xAt(data.length - 1)}
                    cy={yAt(last[s.key])}
                    r="4.5"
                    fill={s.color}
                    stroke={CHART.surface}
                    strokeWidth="2"
                  />
                  <text
                    x={xAt(data.length - 1) - 6}
                    y={yAt(last[s.key]) - 8}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill={CHART.textPrimary}
                  >
                    {formatMoneyCompact(last[s.key])}
                  </text>
                </g>
              );
            })}

            {hoverIndex !== null && (
              <>
                <line
                  x1={xAt(hoverIndex)}
                  x2={xAt(hoverIndex)}
                  y1={padTop}
                  y2={padTop + plotHeight}
                  stroke={CHART.baseline}
                  strokeWidth="1"
                />
                {series.map((s) => (
                  <circle
                    key={`${s.key}-hover`}
                    cx={xAt(hoverIndex)}
                    cy={yAt(data[hoverIndex][s.key])}
                    r="5"
                    fill={s.color}
                    stroke={CHART.surface}
                    strokeWidth="2"
                  />
                ))}
              </>
            )}

            <rect
              x={padLeft}
              y={padTop}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              tabIndex={0}
              role="slider"
              aria-label="Passe o mouse ou use as setas do teclado para ver os valores de cada dia"
              aria-valuetext={
                hoverIndex !== null
                  ? `${formatDateShort(data[hoverIndex].date)}: ${series
                      .map((s) => `${s.label} ${formatMoney(data[hoverIndex][s.key])}`)
                      .join(", ")}`
                  : undefined
              }
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex((i) => (i === null ? data.length - 1 : i))}
              onBlur={() => setHoverIndex(null)}
              onKeyDown={handleKeyDown}
              style={{ cursor: "crosshair" }}
            />
          </svg>

          {hoverIndex !== null && tooltipPct !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 rounded-lg border border-brand-100 bg-white px-3 py-2 shadow-md text-xs"
              style={{
                left: `${tooltipPct}%`,
                transform: tooltipPct > 65 ? "translateX(-100%)" : tooltipPct < 10 ? "translateX(0%)" : "translateX(-50%)",
              }}
            >
              <p className="text-gray-500 mb-1">{formatDateShort(data[hoverIndex].date)}</p>
              {series.map((s) => (
                <p key={s.key} className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="font-semibold text-gray-800">{formatMoney(data[hoverIndex][s.key])}</span>
                  <span className="text-gray-500">{s.label}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
