"use client";
import Image from "next/image";
import { useState } from "react";
export function ListingGallery({
  images,
  title,
}: {
  images: { id: string; url: string }[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  if (!images.length)
    return <div className="aspect-[4/3] rounded-2xl bg-muted" />;
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <Image
          src={images[selected].url}
          alt={title}
          fill
          unoptimized
          priority
          sizes="(max-width: 768px) 100vw, 650px"
          className="object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Ver foto ${index + 1}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${selected === index ? "border-primary" : "border-transparent"}`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
