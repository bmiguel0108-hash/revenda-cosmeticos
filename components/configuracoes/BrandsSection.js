"use client";

import { useState, useTransition } from "react";
import { createBrand, updateBrand, toggleBrandActive } from "@/app/configuracoes/actions";

function EditableRow({ brand }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(brand.name);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      const result = await updateBrand(brand.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleToggle() {
    startTransition(() => toggleBrandActive(brand.id, !brand.active));
  }

  if (editing) {
    return (
      <tr>
        <td>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
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
    <tr className={!brand.active ? "opacity-40" : ""}>
      <td className="font-medium text-gray-800">{brand.name}</td>
      <td className="space-x-2 whitespace-nowrap">
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button className="btn-danger" disabled={isPending} onClick={handleToggle}>
          {brand.active ? "Desativar" : "Reativar"}
        </button>
      </td>
    </tr>
  );
}

function NewRowForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      const result = await createBrand(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setName("");
      }
    });
  }

  return (
    <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 mt-4 pt-4 border-t border-gray-100">
      <div>
        <label className="label">Nova marca</label>
        <input
          className="input"
          placeholder="ex: Jequiti"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        Adicionar
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}

export default function BrandsSection({ brands }) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Marcas</h2>
      <p className="text-sm text-gray-500 mb-4">
        Essa é a única lista de marcas do sistema — usada no Catálogo de
        Produtos, sempre sincronizada.
      </p>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nome</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <EditableRow key={brand.id} brand={brand} />
            ))}
          </tbody>
        </table>
      </div>

      <NewRowForm />
    </section>
  );
}
