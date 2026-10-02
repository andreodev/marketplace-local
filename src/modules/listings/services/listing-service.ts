import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  requireUser,
} from "@/modules/auth/services/session-service";
import { AppError } from "@/lib/errors";
import { mediaExists } from "@/lib/media-storage";
import { listingRepository } from "../repositories/listing-repository";
import {
  saveListingSchema,
  changeStatusSchema,
  listingSchema,
} from "../schemas/listing";
import {
  assertListingOwner,
  assertStatusTransition,
} from "../utils/listing-policy";
import { assertMediaKey } from "../utils/media-policy";
import {
  ACCOUNT_CATEGORY_SLUG,
  assertAccountListingContent,
  assertAccountListingReady,
} from "../utils/account-policy";

export async function saveListing(input: unknown) {
  const user = await requireUser();
  const { id, updatedAt, intent, ...data } = saveListingSchema.parse(input);
  const category = await listingRepository.findActiveCategory(data.categoryId);
  if (!category) throw new AppError("Categoria indisponível.");
  const isAccount = category.slug === ACCOUNT_CATEGORY_SLUG;
  if (isAccount) {
    assertAccountListingContent(data);
    if (intent !== "DRAFT") assertAccountListingReady(data);
  }
  const existing = id ? await listingRepository.findOwned(id, user.id) : null;
  if (id && !existing) throw new AppError("Anúncio não encontrado.");
  if (existing) {
    assertListingOwner(existing, user.id);
    if (!["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED"].includes(existing.status))
      throw new AppError("Este anúncio não pode mais ser editado.");
    if (!updatedAt || existing.updatedAt.toISOString() !== updatedAt)
      throw new AppError("O anúncio foi alterado. Recarregue a página.");
    if (intent === "DRAFT" && existing.status !== "DRAFT")
      throw new AppError("Um anúncio publicado não pode voltar a rascunho.");
  } else if (intent === "SAVE")
    throw new AppError("Escolha salvar rascunho ou publicar.");
  const requestedStatus = intent === "SAVE" ? existing!.status : intent;
  const status = isAccount
    ? intent === "DRAFT" ? "DRAFT" : "PENDING_REVIEW"
    : requestedStatus === "PENDING_REVIEW" ? "DRAFT" : requestedStatus;
  if (["ACTIVE", "PENDING_REVIEW"].includes(status) && data.images.length === 0)
    throw new AppError("Adicione pelo menos uma foto para publicar.");
  if (existing && existing.status !== status)
    assertStatusTransition(existing.status, status);
  for (const key of data.images) {
    assertMediaKey(key, user.id);
    if (!(await mediaExists(key)))
      throw new AppError("Uma foto não foi encontrada. Envie novamente.");
  }
  const slug =
    existing?.slug ??
    `${
      data.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "produto"
    }-${randomUUID()}`;
  return listingRepository.save(
    user.id,
    data,
    status,
    slug,
    existing ? { id: existing.id, updatedAt: existing.updatedAt } : undefined,
  );
}
export async function changeListingStatus(input: unknown) {
  const user = await requireUser();
  const data = changeStatusSchema.parse(input);
  const listing = await listingRepository.findOwned(data.id, user.id);
  if (!listing) throw new AppError("Anúncio não encontrado.");
  assertListingOwner(listing, user.id);
  const category = await listingRepository.findCategoryById(listing.categoryId);
  if (!category) throw new AppError("Categoria indisponível.");
  const status = data.status === "ACTIVE" && category.slug === ACCOUNT_CATEGORY_SLUG
    ? "PENDING_REVIEW"
    : data.status;
  if ((status === "ACTIVE" || status === "PENDING_REVIEW") && !category.active)
    throw new AppError("Categoria indisponível.");
  assertStatusTransition(listing.status, status);
  if (listing.updatedAt.toISOString() !== data.updatedAt)
    throw new AppError("O anúncio foi alterado. Recarregue a página.");
  if (status === "ACTIVE" || status === "PENDING_REVIEW") {
    if (listing.images.length === 0)
      throw new AppError("Adicione pelo menos uma foto para publicar.");
    listingSchema.parse({
      title: listing.title,
      description: listing.description,
      price: listing.price.toFixed(2),
      categoryId: listing.categoryId,
      condition: listing.condition,
      city: listing.city,
      state: listing.state,
      neighborhood: listing.neighborhood,
      accountPlatform: listing.accountPlatform ?? "",
      accountType: listing.accountType ?? "",
      accountPolicyUrl: listing.accountPolicyUrl ?? "",
      accountTransferConfirmed: listing.accountTransferConfirmed,
      images: listing.images.map((image) => image.storageKey),
    });
    if (status === "PENDING_REVIEW") {
      assertAccountListingReady({
        title: listing.title,
        description: listing.description,
        accountPlatform: listing.accountPlatform ?? "",
        accountType: listing.accountType ?? "",
        accountPolicyUrl: listing.accountPolicyUrl ?? "",
        accountTransferConfirmed: listing.accountTransferConfirmed,
      });
    }
    for (const image of listing.images) {
      if (!image.storageKey || !(await mediaExists(image.storageKey)))
        throw new AppError(
          "Uma foto não foi encontrada. Edite o anúncio e envie novamente.",
        );
    }
  }
  await listingRepository.changeStatus(
    listing.id,
    user.id,
    listing.status,
    status,
    listing.updatedAt,
  );
  return status;
}
export async function trackListingView(id: unknown) {
  const parsed = z.cuid().safeParse(id);
  if (parsed.success) await listingRepository.recordView(parsed.data);
}
