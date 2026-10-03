import { AppError } from "@/lib/errors";
export const MAX_LISTING_IMAGES = 8;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const mockListingImages = [
  "bicicleta",
  "camera",
  "cafeteira",
  "cadeira",
  "carro",
  "celular",
  "fone",
  "livros",
  "luminaria",
  "mochila",
  "moto",
  "notebook",
  "relogio",
  "sofa",
  "teclado",
  "tenis",
  "tv",
  "violao",
] as const;
const mockListingImagePrefix = "mock:";
export function mockListingImagePath(name: string) {
  if (!(mockListingImages as readonly string[]).includes(name))
    throw new AppError("Imagem de exemplo inválida.");
  return `public/demo-listings/${name}.jpg`;
}
export const mockListingImageKey = (name: string) => {
  mockListingImagePath(name);
  return `${mockListingImagePrefix}${name}`;
};
export function isMockListingImage(key: string) {
  return (
    key.startsWith(mockListingImagePrefix) &&
    (mockListingImages as readonly string[]).includes(
      key.slice(mockListingImagePrefix.length),
    )
  );
}
export function mockListingImageKeyFromUrl(url: string) {
  const name = mockListingImages.find((image) => url === `/demo-listings/${image}.jpg`);
  return name ? mockListingImageKey(name) : undefined;
}
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
export const mediaUrl = (key: string) =>
  isMockListingImage(key)
    ? `/demo-listings/${key.slice(mockListingImagePrefix.length)}.jpg`
    : `/media/${key}`;
