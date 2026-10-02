"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight, ImageIcon, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { categoryInterestKey, parseCategoryInterest } from "../utils/category-interest";
import { formatPrice } from "../utils/presentation";

export type FeaturedCategory = {
  id: string;
  slug: string;
  name: string;
  listings: {
    id: string;
    slug: string;
    title: string;
    price: string;
    city: string;
    state: string;
    image?: string;
    featured: boolean;
  }[];
};

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === categoryInterestKey) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function getSnapshot() {
  try {
    return localStorage.getItem(categoryInterestKey) ?? "{}";
  } catch {
    return "{}";
  }
}

export function FeaturedShowcase({ categories }: { categories: FeaturedCategory[] }) {
  const interestRaw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");
  const interest = useMemo(() => parseCategoryInterest(interestRaw), [interestRaw]);

  const ordered = categories
    .map((category, index) => ({ category, index }))
    .sort((a, b) =>
      (interest[b.category.slug] ?? 0) - (interest[a.category.slug] ?? 0) ||
      b.category.listings.length - a.category.listings.length ||
      a.index - b.index,
    )
    .map(({ category }) => category);
  const featured = ordered.filter((category) => category.listings.length).slice(0, 3);
  const personalized = Object.values(interest).some((count) => count > 0);

  return (
    <section className="py-8" aria-labelledby="featured-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Vitrine local
          </p>
          <h2 id="featured-title" className="text-2xl font-bold tracking-tight">
            Destaques para você
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {personalized
              ? "Categorias em destaque com base nas suas buscas neste navegador."
              : "Uma seleção das principais categorias por aqui."}
          </p>
        </div>
        <Link href="/buscar" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Ver todos os anúncios <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <nav aria-label="Categorias em destaque" className="mb-8 flex flex-wrap gap-2">
        {ordered.map((category, index) => (
          <Link
            key={category.id}
            href={`/categoria/${category.slug}`}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary ${index === 0 ? "border-primary/30 bg-secondary text-secondary-foreground" : "bg-card"}`}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {featured.length ? (
        <div className="space-y-9">
          {featured.map((category, index) => (
            <section key={category.id} aria-labelledby={`featured-${category.slug}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 id={`featured-${category.slug}`} className="text-lg font-semibold">
                    {category.name}
                  </h3>
                  {index === 0 && personalized && <Badge variant="secondary">Sua preferência</Badge>}
                </div>
                <Link href={`/categoria/${category.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Ver categoria <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {category.listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/anuncio/${listing.slug}`}
                    className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted text-muted-foreground">
                      {listing.featured && <Badge className="absolute left-2 top-2 z-10">Destaque</Badge>}
                      {listing.image ? (
                        <Image
                          src={listing.image}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 230px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <ImageIcon size={28} aria-hidden="true" />
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 group-hover:text-primary">
                        {listing.title}
                      </p>
                      <p className="mt-1 text-lg font-bold tracking-tight">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={12} aria-hidden="true" />
                        {listing.city}, {listing.state}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card className="items-center py-12 text-center">
          <h3 className="text-lg font-semibold">Ainda não há anúncios por aqui</h3>
          <p className="text-sm text-muted-foreground">
            Publique um produto para começar a vitrine da sua região.
          </p>
        </Card>
      )}
    </section>
  );
}
