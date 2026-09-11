import ProductCard from "@/components/catalogo/ProductCard";

export default function ProductGrid({ products, brands, paymentMethods }) {
  if (!products || products.length === 0) {
    return (
      <div className="card text-center text-gray-400 py-10">
        Nenhum produto cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          brands={brands}
          paymentMethods={paymentMethods}
        />
      ))}
    </div>
  );
}
