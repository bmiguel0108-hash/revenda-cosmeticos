"use client";

import { useState, useTransition } from "react";
import { createCustomer } from "@/app/clientes/actions";

const initialState = { name: "", phone: "", notes: "" };

export default function NewCustomerForm() {
  const [form, setForm] = useState(initialState);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.set(key, value));

    startTransition(async () => {
      const result = await createCustomer(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setForm(initialState);
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Novo cliente
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Novo cliente</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Observações</label>
          <input
            className="input"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <div className="flex gap-2 mt-5">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Salvando..." : "Salvar cliente"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setOpen(false);
            setForm(initialState);
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
