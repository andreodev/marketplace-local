import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAdminDashboard } from "@/modules/admin/queries/dashboard";

export default async function Admin() {
  const counts = await getAdminDashboard();
  return (
    <>
      <h1 className="text-3xl font-semibold">Administração</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Usuários", counts.users, "/admin/usuarios"],
          ["Anúncios ativos", counts.activeListings, "/admin/anuncios"],
          ["Denúncias abertas", counts.openReports, "/admin/denuncias"],
          ["Categorias ativas", counts.activeCategories, "/admin/categorias"],
        ].map(([label, value, href]) => (
          <Link key={String(href)} href={String(href)}>
            <Card>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
