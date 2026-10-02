import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageIcon, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "../utils/presentation";

export function ListingCard({
  listing,
}: {
  listing: {
    slug: string;
    title: string;
    price: string;
    city: string;
    state: string;
    condition: string;
    image?: string;
    featured?: boolean;
  };
}) {
  return (
    <Link
      href={`/anuncio/${listing.slug}`}
      className={`group flex gap-4 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-[#fcfdfb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:gap-5 sm:p-4 ${listing.featured ? "border-primary/50" : "border-border"}`}
    >
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground sm:h-40 sm:w-44">
        {listing.image ? (
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 112px, 176px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageIcon size={30} strokeWidth={1.5} aria-hidden="true" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary sm:text-lg">
            {listing.title}
          </h3>
          <ArrowUpRight size={18} className="hidden shrink-0 text-muted-foreground group-hover:text-primary sm:block" aria-hidden="true" />
        </div>
        {listing.featured && <Badge className="mt-2 w-fit">Destaque</Badge>}
        <p className="mt-2 text-lg font-bold tracking-tight sm:text-2xl">
          {formatPrice(listing.price)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted-foreground sm:text-sm">
          <span className="rounded-md bg-muted px-2 py-1 font-medium text-foreground">
            {listing.condition === "NEW" ? "Novo" : "Usado"}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            <span className="truncate">{listing.city}, {listing.state}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
