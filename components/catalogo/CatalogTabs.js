"use client";

import { useMemo, useState } from "react";
import NewProductForm from "@/components/catalogo/NewProductForm";
import ProductGrid from "@/components/catalogo/ProductGrid";
import NewComboForm from "@/components/catalogo/NewComboForm";
import ComboGrid from "@/components/catalogo/ComboGrid";

export default function CatalogTabs({ products, brands, paymentMethods, categories, combos }) {
  const [tab, setTab] = useState("produtos");
  const [selectedCategories, setSelectedCategories] = useState([]);

  function toggleCategory(id) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) return products;
    return products.filter((p) => p.category_ids.some((id) => selectedCategories.includes(id)));
  }, [products, selectedCategories]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-brand-100">
        <button
          type="button"
          onClick={() => setTab("produtos")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "produtos"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Produtos
        </button>
        <button
          type="button"
          onClick={() => setTab("combos")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === "combos"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Combos
        </button>
      </div>

      {tab === "produtos" ? (
        <div className="space-y-4">
          <NewProductForm brands={brands} categories={categories} />

          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">Filtrar por categoria:</span>
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className={`badge cursor-pointer transition ${
                  selectedCategories.length === 0
                    ? "bg-brand-600 text-white"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                }`}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={`badge cursor-pointer transition ${
                    selectedCategories.includes(c.id)
                      ? "bg-brand-600 text-white"
                      : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <ProductGrid
            products={filteredProducts}
            brands={brands}
            paymentMethods={paymentMethods}
            categories={categories}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <NewComboForm products={products} />
          <ComboGrid combos={combos} products={products} />
        </div>
      )}
    </div>
  );
}
