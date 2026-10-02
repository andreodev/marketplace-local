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
  DRAFT: ["ACTIVE", "PENDING_REVIEW", "REMOVED"],
  PENDING_REVIEW: ["DRAFT", "REMOVED"],
  ACTIVE: ["PENDING_REVIEW", "PAUSED", "SOLD", "REMOVED"],
  PAUSED: ["ACTIVE", "PENDING_REVIEW", "SOLD", "REMOVED"],
  SOLD: ["REMOVED"],
  REMOVED: [],
};

export function assertStatusTransition(from: ListingStatus, to: ListingStatus) {
  if (!transitions[from].includes(to))
    throw new AppError("Esta alteração de status não é permitida.");
}
