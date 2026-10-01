import Link from "next/link";
import { Card } from "@/components/ui/card";
import { listCategories } from "@/modules/categories/queries/categories";
import { ListingGrid } from "@/modules/listings/components/listing-grid";
import { ListingSearchForm } from "@/modules/listings/components/listing-search-form";
import { searchPublicListings } from "@/modules/listings/queries/listings";
import { parseListingSearch } from "@/modules/listings/schemas/search";

export const metadata = { title: "Buscar anúncios" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = parseListingSearch(await searchParams);
  const [categories, listings] = await Promise.all([
    listCategories(),
    searchPublicListings(search),
  ]);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value && key !== "pagina") params.set(key, String(value));
  }
  const pageHref = (page: number) => {
    const next = new URLSearchParams(params);
    next.set("pagina", String(page));
    return `/buscar?${next}`;
  };
  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold">Encontre perto de você</h1>
      <ListingSearchForm categories={categories} search={search} />
      <section className="mt-10">
        <p className="mb-6 text-muted-foreground">
          {listings.length
            ? "Anúncios encontrados"
            : "Nenhum anúncio encontrado com esses filtros."}
        </p>
        {listings.length ? (
          <ListingGrid listings={listings} />
        ) : (
          <Card className="text-center">
            <p>Tente outro termo, categoria ou localização.</p>
          </Card>
        )}
      </section>
      <nav aria-label="Páginas da busca" className="mt-8 flex justify-between">
        {search.pagina > 1 ? (
          <Link href={pageHref(search.pagina - 1)} className="text-primary">
            ← Anterior
          </Link>
        ) : (
          <span />
        )}
        {listings.length === 24 && (
          <Link href={pageHref(search.pagina + 1)} className="text-primary">
            Próxima →
          </Link>
        )}
      </nav>
    </>
  );
}
