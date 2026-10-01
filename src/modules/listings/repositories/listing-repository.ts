import "server-only";
import { db } from "@/lib/db";
import { Prisma, type ListingStatus } from "@/generated/prisma/client";
import type { z } from "zod";
import type { listingSchema } from "../schemas/listing";
import { AppError } from "@/lib/errors";
import { mediaUrl } from "../utils/media-policy";

type ListingData = z.output<typeof listingSchema>;
const orderedImages = { orderBy: { position: "asc" as const } };
const imageData = (keys: string[]) =>
  keys.map((storageKey, position) => ({
    storageKey,
    url: mediaUrl(storageKey),
    position,
  }));
const publicWhere = {
  status: "ACTIVE" as const,
  seller: { status: "ACTIVE" as const },
  category: { active: true },
};
const publicListingSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  city: true,
  state: true,
  condition: true,
  images: { ...orderedImages, take: 1, select: { url: true } },
} as const;

export type PublicListingFilters = {
  query?: string;
  categorySlug?: string;
  city?: string;
  state?: string;
  condition?: "NEW" | "USED";
};

function publicListingWhere(filters: PublicListingFilters = {}) {
  const query = filters.query?.trim();
  return {
    ...publicWhere,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            {
              description: {
                contains: query,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
    ...(filters.categorySlug
      ? { category: { active: true, slug: filters.categorySlug } }
      : {}),
    ...(filters.city
      ? { city: { equals: filters.city.trim(), mode: "insensitive" as const } }
      : {}),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.condition ? { condition: filters.condition } : {}),
  };
}

export const listingRepository = {
  listOwned(sellerId: string, skip = 0) {
    return db.listing.findMany({
      where: { sellerId, status: { not: "REMOVED" } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      skip,
      include: {
        images: { ...orderedImages, take: 1 },
        _count: { select: { contacts: true } },
      },
    });
  },
  findOwned(id: string, sellerId: string) {
    return db.listing.findFirst({
      where: { id, sellerId, status: { not: "REMOVED" } },
      include: { images: orderedImages },
    });
  },
  listForAdmin() {
    return db.listing.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      include: {
        images: { ...orderedImages, take: 1 },
        seller: { select: { id: true, name: true, status: true } },
        category: { select: { name: true } },
        _count: { select: { reports: true } },
      },
    });
  },
  findForAdmin(id: string) {
    return db.listing.findUnique({
      where: { id },
      include: {
        images: orderedImages,
        seller: { select: { id: true, name: true, email: true, status: true } },
        category: { select: { id: true, name: true, active: true } },
        _count: { select: { reports: true, favorites: true, contacts: true } },
      },
    });
  },
  removeAsAdmin(id: string) {
    return db.listing.update({ where: { id }, data: { status: "REMOVED" } });
  },
  async save(
    sellerId: string,
    data: ListingData,
    status: ListingStatus,
    slug: string,
    existing?: { id: string; updatedAt: Date },
  ) {
    return db.$transaction(async (tx) => {
      const seller = await tx.user.findFirst({
        where: { id: sellerId, status: "ACTIVE" },
        select: { id: true },
      });
      const category = await tx.category.findFirst({
        where: { id: data.categoryId, active: true },
        select: { id: true },
      });
      if (!seller || !category)
        throw new AppError("Usuário ou categoria indisponível.");
      const { images, price, ...fields } = data;
      const values = { ...fields, price: new Prisma.Decimal(price), status };
      if (!existing)
        return tx.listing.create({
          data: {
            ...values,
            sellerId,
            slug,
            ...(images.length ? { images: { create: imageData(images) } } : {}),
          },
        });
      const result = await tx.listing.updateMany({
        where: {
          id: existing.id,
          sellerId,
          seller: { status: "ACTIVE" },
          updatedAt: existing.updatedAt,
          status: { in: ["DRAFT", "ACTIVE", "PAUSED"] },
        },
        data: values,
      });
      if (result.count !== 1)
        throw new AppError(
          "O anúncio foi alterado. Recarregue a página antes de salvar.",
        );
      await tx.listingImage.deleteMany({ where: { listingId: existing.id } });
      await tx.listingImage.createMany({
        data: imageData(images).map((image) => ({
          ...image,
          listingId: existing.id,
        })),
      });
      return tx.listing.findUniqueOrThrow({ where: { id: existing.id } });
    });
  },
  async changeStatus(
    id: string,
    sellerId: string,
    from: ListingStatus,
    to: ListingStatus,
    updatedAt: Date,
  ) {
    const result = await db.listing.updateMany({
      where: {
        id,
        sellerId,
        seller: { status: "ACTIVE" },
        status: from,
        updatedAt,
        ...(to === "ACTIVE"
          ? { category: { active: true }, images: { some: {} } }
          : {}),
      },
      data: { status: to },
    });
    if (result.count !== 1)
      throw new AppError(
        "O anúncio foi alterado ou não pode ser publicado. Recarregue a página.",
      );
  },
  recent() {
    return db.listing.findMany({
      where: publicWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 12,
      select: publicListingSelect,
    });
  },
  searchPublic(filters: PublicListingFilters, skip = 0) {
    return db.listing.findMany({
      where: publicListingWhere(filters),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 24,
      skip,
      select: publicListingSelect,
    });
  },
  findPublic(slug: string) {
    return db.listing.findFirst({
      where: { ...publicWhere, slug },
      include: {
        images: orderedImages,
        category: { select: { name: true } },
        seller: { select: { id: true, name: true, createdAt: true } },
      },
    });
  },
  async recordView(id: string) {
    await db.listing.updateMany({
      where: { ...publicWhere, id },
      data: { views: { increment: 1 } },
    });
  },
  async recordContact(id: string, userId?: string) {
    return db.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { ...publicWhere, id },
        select: {
          id: true,
          title: true,
          seller: { select: { whatsapp: true } },
        },
      });
      if (!listing) throw new AppError("Este anúncio não está disponível.");
      await tx.listingContact.create({ data: { listingId: id, userId } });
      return listing;
    });
  },
  findPublicImage(key: string) {
    return db.listingImage.findFirst({
      where: { storageKey: key, listing: publicWhere },
      select: { id: true },
    });
  },
  findPublicSeller(id: string) {
    return db.user.findFirst({
      where: { id, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        listings: {
          where: publicWhere,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 24,
          select: publicListingSelect,
        },
      },
    });
  },
};
