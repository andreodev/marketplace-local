import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

const publicListing = {
  status: "ACTIVE" as const,
  seller: { status: "ACTIVE" as const },
  category: { active: true },
};

export const favoriteRepository = {
  find(userId: string, listingId: string) {
    return db.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
  },
  list(userId: string) {
    return db.favorite.findMany({
      where: { userId, listing: publicListing },
      orderBy: { createdAt: "desc" },
      select: {
        listing: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            city: true,
            state: true,
            condition: true,
            images: {
              orderBy: { position: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
  },
  async toggle(userId: string, listingId: string) {
    return db.$transaction(async (tx) => {
      const removed = await tx.favorite.deleteMany({
        where: { userId, listingId },
      });
      if (removed.count) return false;
      const listing = await tx.listing.findFirst({
        where: { id: listingId, ...publicListing },
        select: { id: true, sellerId: true },
      });
      if (!listing) throw new AppError("Este anúncio não está disponível.");
      if (listing.sellerId === userId)
        throw new AppError("Você não pode favoritar seu próprio anúncio.");
      try {
        await tx.favorite.create({ data: { userId, listingId } });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        )
          return true;
        throw error;
      }
      return true;
    });
  },
};
