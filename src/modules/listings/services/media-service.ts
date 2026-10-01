import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  requireUser,
  getCurrentUser,
} from "@/modules/auth/services/session-service";
import { AppError } from "@/lib/errors";
import { putMedia, readMedia } from "@/lib/media-storage";
import { assertMediaKey, assertUploadFile } from "../utils/media-policy";
import { listingRepository } from "../repositories/listing-repository";
import { rateLimitRepository } from "@/modules/auth/repositories/rate-limit-repository";
import { createHash } from "node:crypto";

export async function uploadListingPhoto(file: File) {
  const user = await requireUser();
  assertUploadFile(file);
  const windowMs = 15 * 60 * 1000;
  const window = Math.floor(Date.now() / windowMs);
  const rateKey = createHash("sha256")
    .update(`media:${user.id}:${window}`)
    .digest("hex");
  const rate = await rateLimitRepository.consume(
    rateKey,
    new Date((window + 1) * windowMs),
  );
  if (rate.attempts > 40)
    throw new AppError("Muitos envios de fotos. Aguarde alguns minutos.");
  let bytes: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("Invalid image");
    bytes = await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new AppError(
      "Não foi possível ler essa foto. Envie um JPEG, PNG ou WebP válido.",
    );
  }
  const key = `listings/${user.id}/${randomUUID()}.webp`;
  await putMedia(key, bytes);
  // ponytail: abandoned/replaced uploads remain; reconcile unreferenced objects when storage costs justify cleanup.
  return key;
}
export async function getListingPhoto(key: string) {
  assertMediaKey(key);
  const isPublic = await listingRepository.findPublicImage(key);
  if (!isPublic) {
    const user = await getCurrentUser();
    if (!user || !key.startsWith(`listings/${user.id}/`)) return null;
  }
  return { body: await readMedia(key) };
}
