"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Painel" },
  { href: "/catalogo", label: "Catálogo de Produtos" },
  { href: "/vendas", label: "Vendas" },
  { href: "/vendas/nova", label: "Nova Venda" },
  { href: "/contas-a-receber", label: "Contas a Receber" },
  { href: "/recebimentos", label: "Recebimentos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/configuracoes", label: "Configurações" },
];

export default function NavBar({ userEmail }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="w-full md:w-60 shrink-0 bg-white border-b md:border-b-0 md:border-r border-pink-100 md:min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <p className="text-lg font-semibold text-brand-700">Amigos do Bem</p>
        <p className="text-xs text-gray-500">Revenda de Cosméticos</p>
      </div>

      <ul className="flex flex-col gap-1 flex-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 truncate mb-2">{userEmail}</p>
        <button onClick={handleLogout} className="btn-secondary w-full text-xs">
          Sair
        </button>
      </div>
    </nav>
  );
}
