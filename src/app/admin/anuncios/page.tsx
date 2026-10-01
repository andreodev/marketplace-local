import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin-action-button";
import { removeListingAsAdminAction } from "@/modules/listings/actions/admin-listing-actions";
import { listListingsForAdmin } from "@/modules/listings/queries/admin-listings";

export default async function Page() {
  const listings = await listListingsForAdmin();
  return (
    <>
      <h1 className="text-3xl font-semibold">Anúncios</h1>
      <div className="mt-6 space-y-3">
        {listings.map((listing) => (
          <Card
            key={listing.id}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <Link
                href={`/admin/anuncios/${listing.id}`}
                className="font-semibold hover:underline"
              >
                {listing.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {listing.seller.name} · {listing.category.name} ·{" "}
                {listing._count.reports} denúncias
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
