import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin-action-button";
import { setUserStatusAction } from "@/modules/users/actions/admin-user-actions";
import { listUsersForAdmin } from "@/modules/users/queries/admin-users";

export default async function Page() {
  const users = await listUsersForAdmin();
  return (
    <>
      <h1 className="text-3xl font-semibold">Usuários</h1>
      <div className="mt-6 space-y-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <Link
                href={`/admin/usuarios/${user.id}`}
                className="font-semibold hover:underline"
              >
                {user.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {user.email} · {user._count.listings} anúncios
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {user.status === "ACTIVE" ? "Ativo" : "Suspenso"}
              </span>
              <AdminActionButton
                action={setUserStatusAction}
                values={{
                  id: user.id,
                  status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                }}
                label={user.status === "ACTIVE" ? "Suspender" : "Reativar"}
              />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
