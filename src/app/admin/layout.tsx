import Link from "next/link";
import { requireAdmin } from "@/modules/auth/services/session-service";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="mb-8 flex flex-wrap gap-5" aria-label="Administração">
        <Link href="/">Voltar ao marketplace</Link>
        {["", "usuarios", "anuncios", "categorias", "denuncias"].map((path) => (
          <Link key={path} href={`/admin/${path}`}>
            {path || "Dashboard"}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
