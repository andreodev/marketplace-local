import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin-action-button";
import { removeListingAsAdminAction } from "@/modules/listings/actions/admin-listing-actions";
import { listListingsForAdmin, listPendingAccountReviews } from "@/modules/listings/queries/admin-listings";

export default async function Page() {
  const [pendingAccounts, listings] = await Promise.all([
    listPendingAccountReviews(),
    listListingsForAdmin(),
  ]);
  return (
    <>
      <h1 className="text-3xl font-semibold">Anúncios</h1>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Contas digitais aguardando revisão ({pendingAccounts.length})</h2>
        <div className="mt-4 space-y-3">
          {pendingAccounts.map((listing) => (
            <Card key={listing.id} className="flex-row items-center justify-between gap-4">
              <div>
                <Link href={`/admin/anuncios/${listing.id}`} className="font-semibold hover:underline">{listing.title}</Link>
                <p className="text-sm text-muted-foreground">{listing.seller.name} · {listing.accountPlatform ?? "Plataforma não informada"}</p>
              </div>
              <Link href={`/admin/anuncios/${listing.id}`} className="text-sm font-medium text-primary">Revisar →</Link>
            </Card>
          ))}
          {!pendingAccounts.length && <p className="text-sm text-muted-foreground">Nenhuma conta aguardando revisão.</p>}
        </div>
      </section>
      <h2 className="mt-10 text-xl font-semibold">Outros anúncios</h2>
      <div className="mt-6 space-y-3">
        {listings.map((listing) => (
          <Card key={listing.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link href={`/admin/anuncios/${listing.id}`} className="font-semibold hover:underline">{listing.title}</Link>
              <p className="text-sm text-muted-foreground">
                {listing.seller.name} · {listing.category.name} · {listing._count.reports} denúncias
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">{listing.status}</span>
              {listing.status !== "REMOVED" && (
                <AdminActionButton
                  action={removeListingAsAdminAction}
                  values={{ id: listing.id }}
                  label="Remover"
                  variant="ghost"
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
