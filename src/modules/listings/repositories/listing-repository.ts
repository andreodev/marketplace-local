import "server-only";
import { db } from "@/lib/db";
import { Prisma, type ListingStatus } from "@/generated/prisma/client";
import type { z } from "zod";
import { listingSchema } from "../schemas/listing";
import { AppError } from "@/lib/errors";
import { isMockListingImage, mediaUrl } from "../utils/media-policy";
import { ACCOUNT_CATEGORY_SLUG, assertAccountListingContent, assertAccountListingReady } from "../utils/account-policy";

type ListingData = z.input<typeof listingSchema>;
const orderedImages = { orderBy: { position: "asc" as const } };
const imageData = (keys: string[]) =>
  keys.map((key, position) => ({
    ...(isMockListingImage(key) ? {} : { storageKey: key }),
    url: mediaUrl(key),
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
  featuredUntil: true,
  category: { select: { slug: true } },
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

async function rankedPublicListings(where: Prisma.ListingWhereInput, take: number, skip = 0) {
  const now = new Date();
  const featuredWhere = { AND: [where, { featuredUntil: { gt: now } }] };
  const regularWhere = { AND: [where, { OR: [{ featuredUntil: null }, { featuredUntil: { lte: now } }] }] };
  const featuredCount = await db.listing.count({ where: featuredWhere });
  const promoted = skip < featuredCount
    ? await db.listing.findMany({ where: featuredWhere, orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }, { id: "desc" }], skip, take, select: publicListingSelect })
    : [];
  const remaining = take - promoted.length;
  if (!remaining) return promoted;
  const regular = await db.listing.findMany({ where: regularWhere, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: Math.max(0, skip - featuredCount), take: remaining, select: publicListingSelect });
  return [...promoted, ...regular];
}

export const listingRepository = {
  findActiveCategory(id: string) {
    return db.category.findFirst({
      where: { id, active: true },
      select: { id: true, slug: true },
    });
  },
  findCategoryById(id: string) {
    return db.category.findUnique({
      where: { id },
      select: { id: true, slug: true, active: true },
    });
  },
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
      where: { status: { not: "PENDING_REVIEW" } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      include: {
        images: { ...orderedImages, take: 1 },
        seller: { select: { id: true, name: true, status: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { reports: true } },
      },
    });
  },
  listPendingAccountReviews() {
    return db.listing.findMany({
      where: { status: "PENDING_REVIEW", category: { slug: ACCOUNT_CATEGORY_SLUG } },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: 50,
      include: {
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
        category: { select: { id: true, name: true, slug: true, active: true } },
        _count: { select: { reports: true, favorites: true, contacts: true } },
      },
    });
  },
  removeAsAdmin(id: string) {
    return db.listing.update({ where: { id }, data: { status: "REMOVED" } });
  },
  async reviewAccountListing(id: string, updatedAt: Date, approved: boolean, note: string) {
    const result = await db.listing.updateMany({
      where: {
        id,
        updatedAt,
        status: "PENDING_REVIEW",
        category: approved
          ? { slug: ACCOUNT_CATEGORY_SLUG, active: true }
          : { slug: ACCOUNT_CATEGORY_SLUG },
        ...(approved ? { seller: { status: "ACTIVE" as const } } : {}),
      },
      data: {
        status: approved ? "ACTIVE" : "DRAFT",
        moderationNote: approved ? null : note,
      },
    });
    if (result.count !== 1)
      throw new AppError("O anúncio foi alterado ou não está mais aguardando revisão.");
  },
  async save(
    sellerId: string,
    data: ListingData,
    status: ListingStatus,
    slug: string,
    existing?: { id: string; updatedAt: Date },
  ) {
    const parsed = listingSchema.parse(data);
    return db.$transaction(async (tx) => {
      const seller = await tx.user.findFirst({
        where: { id: sellerId, status: "ACTIVE" },
        select: { id: true },
      });
      const category = await tx.category.findFirst({
        where: { id: parsed.categoryId, active: true },
        select: { id: true, slug: true },
      });
      if (!seller || !category)
        throw new AppError("Usuário ou categoria indisponível.");
      const { images, price, ...fields } = parsed;
      const isAccount = category.slug === ACCOUNT_CATEGORY_SLUG;
      if (isAccount) {
        assertAccountListingContent(fields);
        if (status === "ACTIVE")
          throw new AppError("Contas digitais precisam passar por revisão.");
        if (status === "PENDING_REVIEW") assertAccountListingReady(fields);
      } else if (status === "PENDING_REVIEW") {
        throw new AppError("A revisão de contas exige a categoria Contas digitais.");
      }
      const values = {
        ...fields,
        price: new Prisma.Decimal(price),
        status,
        accountPlatform: isAccount ? fields.accountPlatform || null : null,
        accountType: isAccount ? fields.accountType || null : null,
        accountPolicyUrl: isAccount ? fields.accountPolicyUrl || null : null,
        accountTransferConfirmed: isAccount && fields.accountTransferConfirmed,
        moderationNote: null,
      };
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
          status: { in: ["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED"] },
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
          ? { category: { active: true, slug: { not: ACCOUNT_CATEGORY_SLUG } } }
          : to === "PENDING_REVIEW"
            ? { category: { active: true, slug: ACCOUNT_CATEGORY_SLUG } }
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
    return rankedPublicListings(publicWhere, 12);
  },
  featuredByCategory(categoryIds: string[]) {
    return Promise.all(
      categoryIds.map((categoryId) =>
        rankedPublicListings({ ...publicWhere, categoryId }, 4),
      ),
    );
  },
  searchPublic(filters: PublicListingFilters, skip = 0) {
    return rankedPublicListings(publicListingWhere(filters), 24, skip);
  },
  findPublic(slug: string) {
    return db.listing.findFirst({
      where: { ...publicWhere, slug },
      include: {
        images: orderedImages,
        category: { select: { name: true, slug: true } },
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
