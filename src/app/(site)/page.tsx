import Link from "next/link";
import { listRecentListings } from "@/modules/listings/queries/listings";
import { ListingGrid } from "@/modules/listings/components/listing-grid";
import { ListingSearchForm } from "@/modules/listings/components/listing-search-form";
import { listingSearchSchema } from "@/modules/listings/schemas/search";
import { ArrowUpRight, MapPin } from "lucide-react";
import { listCategories } from "@/modules/categories/queries/categories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default async function Home() {
  const [categories, listings] = await Promise.all([
    listCategories(),
    listRecentListings(),
  ]);
  return (
    <>
      <section className="rounded-3xl bg-muted px-6 py-12 sm:px-12 sm:py-20">
        <p className="mb-5 flex items-center gap-2 text-sm text-primary">
          <MapPin size={16} /> Bons encontros começam perto
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
          O que você procura pode estar aqui perto.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Novos achados. Novas histórias. Um espaço para comprar e vender na sua
          região.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/meus-anuncios/novo">
              Quero anunciar <ArrowUpRight size={18} />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/criar-conta">Criar minha conta</Link>
          </Button>
        </div>
        <div className="mt-8 max-w-4xl">
          <ListingSearchForm
            categories={categories}
            search={listingSearchSchema.parse({})}
          />
        </div>
      </section>
      <section className="py-12">
        <h2 className="text-2xl font-semibold">Explore por categoria</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              href={`/categoria/${category.slug}`}
              key={category.id}
              className="flex min-h-24 items-center rounded-2xl border bg-card p-6 font-medium transition-colors hover:bg-muted"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-6 text-2xl font-semibold">Anúncios recentes</h2>
        {listings.length ? (
          <ListingGrid listings={listings} />
        ) : (
          <Card className="bg-muted text-center">
            <h3 className="text-xl font-semibold">
              Seu produto pode ser o primeiro achado
            </h3>
            <p className="mt-2 text-muted-foreground">
              Publique um anúncio e conecte-se com compradores por perto.
            </p>
          </Card>
        )}
      </section>
    </>
  );
}
