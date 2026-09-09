"use client";

import { useEffect, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu do celular sempre que a página muda
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="w-full md:w-60 shrink-0 bg-white border-b md:border-b-0 md:border-r border-pink-100 md:min-h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between md:block mb-2 md:mb-6">
        <div>
          <p className="text-lg font-semibold text-brand-700">Beatriz Miguel</p>
          <p className="text-xs text-gray-500">Revenda de Cosméticos</p>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      <ul className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-col gap-1 flex-1 mt-2 md:mt-0`}>
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

      <div className={`${mobileOpen ? "block" : "hidden"} md:block mt-6 border-t border-gray-100 pt-4`}>
        <p className="text-xs text-gray-400 truncate mb-2">{userEmail}</p>
        <button onClick={handleLogout} className="btn-secondary w-full text-xs">
          Sair
        </button>
      </div>
    </nav>
  );
}
