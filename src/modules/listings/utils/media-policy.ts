import { AppError } from "@/lib/errors";
export const MAX_LISTING_IMAGES = 8;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const mediaKeyPattern =
  /^listings\/[a-z0-9]{20,40}\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;
export function assertMediaKey(key: string, userId?: string) {
  if (
    !mediaKeyPattern.test(key) ||
    (userId && !key.startsWith(`listings/${userId}/`))
  )
    throw new AppError("Esta foto não pertence à sua conta.");
}
export function assertUploadFile(file: File) {
  if (!file.size || file.size > MAX_IMAGE_BYTES)
    throw new AppError("Cada foto deve ter até 3 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new AppError("Envie fotos JPEG, PNG ou WebP.");
}
export const mediaUrl = (key: string) => `/media/${key}`;
