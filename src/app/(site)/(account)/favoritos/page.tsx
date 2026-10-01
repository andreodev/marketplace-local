import { Card } from "@/components/ui/card";
import { ListingGrid } from "@/modules/listings/components/listing-grid";
import { listFavorites } from "@/modules/favorites/queries/favorites";

export const metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const favorites = await listFavorites();
  const listings = favorites.map((favorite) => favorite.listing);
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold">Meus favoritos</h1>
      {listings.length ? (
        <ListingGrid listings={listings} />
      ) : (
        <Card className="py-16 text-center">
          <h2 className="text-xl font-semibold">Nada salvo por enquanto</h2>
          <p className="mt-3 text-muted-foreground">
            Favorite anúncios para encontrá-los novamente aqui.
          </p>
        </Card>
      )}
    </>
  );
}
