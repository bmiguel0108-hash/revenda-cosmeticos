"use client";

import { useState, useTransition } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/configuracoes/actions";

function EditableRow({ category }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      const result = await updateCategory(category.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Remover a categoria "${category.name}"? Os produtos ficam sem essa marcação.`)) return;
    startTransition(() => deleteCategory(category.id));
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
    <tr>
      <td className="font-medium text-gray-800">{category.name}</td>
      <td className="space-x-2 whitespace-nowrap">
        <button className="btn-secondary" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button className="btn-danger" disabled={isPending} onClick={handleDelete}>
          Remover
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
      const result = await createCategory(formData);
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
        <label className="label">Nova categoria</label>
        <input
          className="input"
          placeholder="ex: Infantil"
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

export default function CategoriesSection({ categories }) {
  return (
    <section className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Categorias</h2>
      <p className="text-sm text-gray-500 mb-4">
        Usadas para organizar e filtrar o Catálogo de Produtos. Um produto
        pode pertencer a mais de uma categoria.
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
            {categories.map((category) => (
              <EditableRow key={category.id} category={category} />
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center text-gray-400 py-4">
                  Nenhuma categoria cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewRowForm />
    </section>
  );
}
