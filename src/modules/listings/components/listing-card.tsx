import Image from "next/image";
import Link from "next/link";
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
  };
}) {
  return (
    <Link
      href={`/anuncio/${listing.slug}`}
      className="group overflow-hidden rounded-2xl border bg-card focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.image && (
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs">
          {listing.condition === "NEW" ? "Novo" : "Usado"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-medium">{listing.title}</h3>
        <p className="mt-2 text-xl font-semibold">
          {formatPrice(listing.price)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {listing.city} · {listing.state}
        </p>
      </div>
    </Link>
  );
}
