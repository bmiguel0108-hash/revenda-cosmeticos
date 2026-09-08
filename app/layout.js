import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Revenda de Cosméticos",
  description: "Sistema de controle de revenda de cosméticos",
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="pt-BR">
      <body>
        {user ? (
          <div className="min-h-screen flex flex-col md:flex-row">
            <NavBar userEmail={user.email} />
            <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
              {children}
            </main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
