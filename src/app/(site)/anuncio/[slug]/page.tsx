import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { findPublicListing } from "@/modules/listings/queries/listings";
import { ListingGallery } from "@/modules/listings/components/listing-gallery";
import { ListingContact } from "@/modules/listings/components/listing-contact";
import { formatPrice } from "@/modules/listings/utils/presentation";
import { getCurrentUser } from "@/modules/auth/services/session-service";
import { getFavoriteStatus } from "@/modules/favorites/queries/favorites";
import { FavoriteButton } from "@/modules/favorites/components/favorite-button";
import { ReportListingForm } from "@/modules/reports/components/report-listing-form";
export const metadata = { title: "Anúncio" };
export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await findPublicListing(slug);
  if (!listing) notFound();
  const user = await getCurrentUser();
  const favorite = user ? await getFavoriteStatus(listing.id) : false;
  return (
    <>
      <Link href="/" className="text-sm text-primary">
        ← Voltar ao marketplace
      </Link>
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <ListingGallery
          title={listing.title}
          images={listing.images.map((image) => ({
            id: image.id,
            url: image.url,
          }))}
        />
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {listing.category.name} ·{" "}
            {listing.condition === "NEW" ? "Novo" : "Usado"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {listing.title}
          </h1>
          <p className="mt-5 text-3xl font-semibold text-primary">
            {formatPrice(listing.price.toFixed(2))}
          </p>
          <p className="mt-4 text-muted-foreground">
            {listing.neighborhood} · {listing.city}, {listing.state}
          </p>
          <Card className="mt-8">
            <p className="mb-1 text-sm text-muted-foreground">Anunciado por</p>
            <h2 className="mb-5 text-xl font-semibold">
              <Link
                href={`/vendedor/${listing.seller.id}`}
                className="hover:underline"
              >
                {listing.seller.name}
              </Link>
            </h2>
            <ListingContact id={listing.id} />
            {user?.id !== listing.seller.id && (
              <div className="mt-3">
                <FavoriteButton listingId={listing.id} active={favorite} />
                <ReportListingForm listingId={listing.id} />
              </div>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              Converse com o vendedor e combine pagamento e entrega diretamente.
            </p>
          </Card>
        </div>
      </div>
      <section className="mt-10 max-w-3xl">
        <h2 className="mb-4 text-xl font-semibold">Descrição</h2>
        <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
          {listing.description}
        </p>
      </section>
    </>
  );
}
