import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin-action-button";
import { setUserStatusAction } from "@/modules/users/actions/admin-user-actions";
import { findUserForAdmin } from "@/modules/users/queries/admin-users";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.cuid().safeParse(id).success) notFound();
  const user = await findUserForAdmin(id);
  if (!user) notFound();
  return (
    <>
      <Link href="/admin/usuarios" className="text-sm text-primary">
        ← Usuários
      </Link>
      <h1 className="mb-6 mt-4 text-3xl font-semibold">{user.name}</h1>
      <Card className="space-y-3">
        <p>
          <span className="text-muted-foreground">Email:</span> {user.email}
        </p>
        <p>
          <span className="text-muted-foreground">Telefone:</span>{" "}
          {user.phone ?? "Não informado"}
        </p>
        <p>
          <span className="text-muted-foreground">WhatsApp:</span>{" "}
          {user.whatsapp}
        </p>
        <p>
          <span className="text-muted-foreground">Anúncios:</span>{" "}
          {user._count.listings} ·{" "}
          <span className="text-muted-foreground">Denúncias enviadas:</span>{" "}
          {user._count.reports}
        </p>
        <p>
          <span className="text-muted-foreground">Status:</span> {user.status}
        </p>
        <AdminActionButton
          action={setUserStatusAction}
          values={{
            id: user.id,
            status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
          }}
          label={
            user.status === "ACTIVE" ? "Suspender usuário" : "Reativar usuário"
          }
        />
      </Card>
    </>
  );
}
