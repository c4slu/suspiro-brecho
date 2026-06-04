import Link from "next/link";
import { LogoutButton } from "./_components/logout-button";
import { createSupabaseServer } from "@/lib/supabase-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Sem usuário: o middleware cuida do redirect — aqui só renderiza os filhos
  // (a página de login está dentro deste layout mas não precisa do shell)
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F4ECD8" }}>
      {/* Sidebar desktop */}
      <aside
        className="w-56 shrink-0 border-r hidden md:flex flex-col"
        style={{ background: "#fff9f2", borderColor: "#E5D5B5", minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }}
      >
        <div className="px-5 py-6 border-b" style={{ borderColor: "#E5D5B5" }}>
          <p className="font-display italic text-2xl" style={{ color: "#4A3728" }}>✦ Suspiro</p>
          <p className="text-xs mt-0.5" style={{ color: "#B8A898" }}>Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLink href="/admin" icon="🏠">Início</NavLink>
          <NavLink href="/admin/vendas" icon="💰">Vendas</NavLink>
          <NavLink href="/admin/pecas/nova" icon="➕">Nova peça</NavLink>
          <div className="pt-3 border-t mt-3" style={{ borderColor: "#E5D5B5" }}>
            <NavLink href="/" icon="🛍" external>Ver a loja</NavLink>
          </div>
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "#E5D5B5" }}>
          <p className="text-xs px-3 mb-2 truncate" style={{ color: "#B8A898" }}>{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Header mobile */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: "rgba(255,249,242,0.96)", backdropFilter: "blur(10px)", borderColor: "#E5D5B5" }}
      >
        <p className="font-display italic text-xl" style={{ color: "#4A3728" }}>✦ Admin</p>
        <div className="flex gap-2">
          <Link href="/admin/pecas/nova"
            className="text-sm font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "#D4888A", color: "#fff" }}>
            + Nova
          </Link>
          <Link href="/" className="text-sm px-3 py-1.5 rounded-full"
            style={{ background: "#E5D5B5", color: "#4A3728" }}>
            Loja
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, children, external }: {
  href: string; icon: string; children: React.ReactNode; external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-bege"
      style={{ color: "#4A3728" }}
    >
      <span>{icon}</span>
      {children}
    </Link>
  );
}
