export function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value + (String(value).length === 10 ? "T00:00:00" : ""));
  return date.toLocaleDateString("pt-BR");
}

export const STATUS_LABELS = {
  pago: "Pago",
  recebendo: "Recebendo",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const STATUS_CLASSES = {
  pago: "bg-emerald-50 text-emerald-700",
  recebendo: "bg-amber-50 text-amber-700",
  atrasado: "bg-red-50 text-red-600",
  cancelado: "bg-gray-100 text-gray-500",
};
