import { AppError } from "@/lib/errors";
import type { ListingStatus } from "@/generated/prisma/enums";

export function assertListingOwner(
  listing: { sellerId: string },
  userId: string,
) {
  if (listing.sellerId !== userId)
    throw new AppError("Você não pode alterar este anúncio.");
}

const transitions: Record<ListingStatus, readonly ListingStatus[]> = {
  DRAFT: ["ACTIVE", "REMOVED"],
  ACTIVE: ["PAUSED", "SOLD", "REMOVED"],
  PAUSED: ["ACTIVE", "SOLD", "REMOVED"],
  SOLD: ["REMOVED"],
  REMOVED: [],
};

export function assertStatusTransition(from: ListingStatus, to: ListingStatus) {
  if (!transitions[from].includes(to))
    throw new AppError("Esta alteração de status não é permitida.");
}
