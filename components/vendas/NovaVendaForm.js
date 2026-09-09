"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/app/vendas/nova/actions";
import { createCustomer } from "@/app/clientes/actions";
import { formatMoney } from "@/lib/format";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NovaVendaForm({ products, customers, paymentMethods }) {
  const router = useRouter();

  const [localCustomers, setLocalCustomers] = useState(customers);
  const [customerId, setCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerError, setNewCustomerError] = useState("");

  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qtyToAdd, setQtyToAdd] = useState("1");

  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id || "");
  const [saleDate, setSaleDate] = useState(todayISO());
  const [downPayment, setDownPayment] = useState("0");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [isAddingCustomer, startAddingCustomer] = useTransition();

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const baseValue = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);

  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);
  const multiplier = Number(selectedPaymentMethod?.multiplier || 1);
  const finalValue = Math.round(baseValue * multiplier * 100) / 100;
  const downPaymentNumber = parseFloat(String(downPayment).replace(",", ".")) || 0;
  const installmentsNumber = parseInt(installmentsCount, 10) || 1;
  const installmentValue =
    installmentsNumber > 0 ? (finalValue - downPaymentNumber) / installmentsNumber : 0;
  const profit = finalValue - totalCost;

  function handleAddItem() {
    if (!selectedProductId) return;
    const product = productMap.get(selectedProductId);
    if (!product) return;
    const qty = parseInt(qtyToAdd, 10) || 1;

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.product_id === selectedProductId);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + qty,
        };
        return copy;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: qty,
          unit_cost: Number(product.cost),
          unit_price: Number(product.target_price),
          stock_quantity: product.stock_quantity,
        },
      ];
    });
    setSelectedProductId("");
    setQtyToAdd("1");
  }

  function handleRemoveItem(index) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function handleQtyChange(index, value) {
    const qty = parseInt(value, 10) || 1;
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item)));
  }

  function handleAddCustomer(e) {
    e.preventDefault();
    setNewCustomerError("");
    if (!newCustomerName.trim()) {
      setNewCustomerError("Informe o nome do cliente.");
      return;
    }
    const formData = new FormData();
    formData.set("name", newCustomerName);
    formData.set("phone", newCustomerPhone);

    startAddingCustomer(async () => {
      const result = await createCustomer(formData);
      if (result?.error) {
        setNewCustomerError(result.error);
      } else {
        setLocalCustomers((prev) => [...prev, result.customer].sort((a, b) => a.name.localeCompare(b.name)));
        setCustomerId(result.customer.id);
        setNewCustomerName("");
        setNewCustomerPhone("");
        setShowNewCustomer(false);
      }
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessInfo(null);

    if (cart.length === 0) {
      setError("Adicione pelo menos um produto à venda.");
      return;
    }
    if (!paymentMethodId) {
      setError("Selecione a forma de pagamento.");
      return;
    }

    const formData = new FormData();
    formData.set("customer_id", customerId);
    formData.set("payment_method_id", paymentMethodId);
    formData.set("sale_date", saleDate);
    formData.set("down_payment", downPayment);
    formData.set("installments_count", installmentsCount);
    formData.set("notes", notes);
    formData.set(
      "items",
      JSON.stringify(cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })))
    );

    startTransition(async () => {
      const result = await createSale(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccessInfo(result.saleNumber);
        setCart([]);
        setCustomerId("");
        setDownPayment("0");
        setInstallmentsCount("1");
        setNotes("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {successInfo && (
        <div className="card border-emerald-200 bg-emerald-50 flex items-center justify-between">
          <p className="text-sm text-emerald-800">
            Venda <strong>#{successInfo}</strong> registrada com sucesso!
          </p>
          <button className="btn-secondary" onClick={() => router.push("/vendas")}>
            Ver em Vendas
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Cliente</h2>
          {!showNewCustomer ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <label className="label">Cliente (opcional)</label>
                <select
                  className="input"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">— Sem cliente cadastrado —</option>
                  {localCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `— ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setShowNewCustomer(true)}>
                + Novo cliente
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="label">Nome do cliente</label>
                <input
                  className="input"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  className="input"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={isAddingCustomer}
                onClick={handleAddCustomer}
              >
                Adicionar
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowNewCustomer(false)}>
                Cancelar
              </button>
              {newCustomerError && <p className="text-xs text-red-600 w-full">{newCustomerError}</p>}
            </div>
          )}
        </section>

        {/* Produtos */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Produtos</h2>

          <div className="flex flex-wrap items-end gap-2 mb-4">
            <div className="flex-1 min-w-[220px]">
              <label className="label">Produto</label>
              <select
                className="input"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">— Selecione —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stock_quantity} em estoque) — {formatMoney(p.target_price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Qtd.</label>
              <input
                className="input w-20"
                value={qtyToAdd}
                onChange={(e) => setQtyToAdd(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primary" onClick={handleAddItem}>
              Adicionar item
            </button>
          </div>

          {cart.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd.</th>
                    <th>Preço-alvo (un.)</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={item.product_id}>
                      <td className="font-medium text-gray-800">
                        {item.name}
                        {item.quantity > item.stock_quantity && (
                          <span className="badge bg-amber-50 text-amber-700 ml-2">
                            estoque insuficiente ({item.stock_quantity})
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          className="input w-16"
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                        />
                      </td>
                      <td>{formatMoney(item.unit_price)}</td>
                      <td>{formatMoney(item.unit_price * item.quantity)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-danger"
                          onClick={() => handleRemoveItem(index)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nenhum produto adicionado ainda.</p>
          )}
        </section>

        {/* Pagamento */}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Pagamento</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Data da venda</label>
              <input
                type="date"
                className="input"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Forma de pagamento</label>
              <select
                className="input"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Entrada (R$)</label>
              <input
                className="input"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Parcelas</label>
              <input
                className="input"
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-5 text-sm">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-gray-500 text-xs">Valor base</p>
              <p className="font-semibold text-gray-800">{formatMoney(baseValue)}</p>
            </div>
            <div className="rounded-lg bg-brand-50 px-3 py-2">
              <p className="text-brand-700 text-xs">Valor final ({selectedPaymentMethod?.name || "—"})</p>
              <p className="font-semibold text-brand-700">{formatMoney(finalValue)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-gray-500 text-xs">Valor da parcela</p>
              <p className="font-semibold text-gray-800">{formatMoney(installmentValue)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-gray-500 text-xs">Custo total</p>
              <p className="font-semibold text-gray-800">{formatMoney(totalCost)}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2">
              <p className="text-emerald-700 text-xs">Lucro</p>
              <p className="font-semibold text-emerald-700">{formatMoney(profit)}</p>
            </div>
          </div>
        </section>

        <section className="card">
          <label className="label">Observações</label>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Salvando..." : "Registrar venda"}
        </button>
      </form>
    </div>
  );
}
