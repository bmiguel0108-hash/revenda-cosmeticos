import Link from "next/link";

export default function PainelPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-700 mb-1">Painel</h1>
      <p className="text-sm text-gray-500 mb-6">
        Essa é a Parte 1 do sistema. O painel com os resumos (vendas do mês,
        total a receber, produtos com estoque baixo etc.) chega numa próxima
        entrega, junto com Vendas, Contas a Receber, Recebimentos e Clientes.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/catalogo" className="card hover:shadow-md transition">
          <p className="font-medium text-gray-800">Catálogo de Produtos</p>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre seus produtos, estoque e preços por forma de pagamento.
          </p>
        </Link>

        <Link href="/configuracoes" className="card hover:shadow-md transition">
          <p className="font-medium text-gray-800">Configurações</p>
          <p className="text-sm text-gray-500 mt-1">
            Formas de pagamento (taxas) e marcas.
          </p>
        </Link>
      </div>
    </div>
  );
}
