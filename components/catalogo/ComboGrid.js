import ComboCard from "@/components/catalogo/ComboCard";

export default function ComboGrid({ combos, products }) {
  if (!combos || combos.length === 0) {
    return (
      <div className="card text-center text-gray-400 py-10">
        Nenhum combo cadastrado ainda. Combos precisam de pelo menos 2
        produtos do catálogo.
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {combos.map((combo) => (
        <ComboCard key={combo.id} combo={combo} products={products} />
      ))}
    </div>
  );
}
