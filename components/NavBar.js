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
    <nav className="w-full md:w-60 shrink-0 bg-brand-700 md:min-h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between md:block mb-2 md:mb-6">
        <div className="flex items-center gap-2 md:block md:text-center">
          <div className="h-12 w-12 md:h-20 md:w-20 md:mx-auto rounded-full bg-white p-1 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="BM Espaço Multimarcas"
              className="h-full w-full rounded-full mix-blend-multiply"
            />
          </div>
          <div className="md:mt-2">
            <p className="text-sm md:text-base font-semibold text-white leading-tight">
              Beatriz Miguel
            </p>
            <p className="text-xs text-brand-200">Revenda de Cosméticos</p>
          </div>
        </div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-white/20 p-2 text-white"
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
                    ? "bg-white text-brand-700"
                    : "text-brand-100 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={`${mobileOpen ? "block" : "hidden"} md:block mt-6 border-t border-white/15 pt-4`}>
        <p className="text-xs text-brand-200 truncate mb-2">{userEmail}</p>
        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
