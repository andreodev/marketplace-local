import "server-only";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { z } from "zod";
import { AppError } from "./errors";
import { assertMediaKey } from "@/modules/listings/utils/media-policy";

const configSchema = z.object({
  driver: z.enum(["local", "s3"]),
  endpoint: z.url().optional(),
  region: z.string().min(1),
  bucket: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  forcePathStyle: z.enum(["true", "false"]),
});
let client: S3Client | undefined;
function storage() {
  const driver = process.env.MEDIA_DRIVER ?? "local";
  if (driver === "local") {
    if (process.env.NODE_ENV === "production" && !process.env.MEDIA_LOCAL_DIR)
      throw new AppError(
        "Configure o armazenamento de fotos para publicar anúncios.",
      );
    return {
      driver: "local" as const,
      // Uploads are runtime data on persistent storage, not build assets.
      root: resolve(
        /* turbopackIgnore: true */ process.env.MEDIA_LOCAL_DIR ??
          ".data/media",
      ),
    };
  }
  const parsed = configSchema.safeParse({
    driver,
    endpoint: process.env.MEDIA_S3_ENDPOINT || undefined,
    region: process.env.MEDIA_S3_REGION ?? "auto",
    bucket: process.env.MEDIA_S3_BUCKET,
    accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE ?? "false",
  });
  if (!parsed.success)
    throw new AppError(
      "O armazenamento de fotos ainda não foi configurado corretamente.",
    );
  const config = parsed.data;
  client ??= new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle === "true",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { driver: "s3" as const, client, bucket: config.bucket };
}

// Stable object keys and application URLs: no provider URL persisted in the DB.
export async function putMedia(key: string, bytes: Buffer) {
  assertMediaKey(key);
  const target = storage();
  if (target.driver === "local") {
    const path = resolve(target.root, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, { flag: "wx" });
  } else
    await target.client.send(
      new PutObjectCommand({
        Bucket: target.bucket,
        Key: key,
        Body: bytes,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
}
export async function mediaExists(key: string) {
  assertMediaKey(key);
  const target = storage();
  try {
    if (target.driver === "local")
      return (
        await stat(/* turbopackIgnore: true */ resolve(target.root, key))
      ).isFile();
    await target.client.send(
      new HeadObjectCommand({ Bucket: target.bucket, Key: key }),
    );
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      (("code" in error && error.code === "ENOENT") ||
        ("name" in error && ["NotFound", "NoSuchKey"].includes(error.name)))
    )
      return false;
    throw error;
  }
}
export async function readMedia(key: string) {
  assertMediaKey(key);
  const target = storage();
  if (target.driver === "local")
    return new Uint8Array(
      await readFile(/* turbopackIgnore: true */ resolve(target.root, key)),
    );
  const result = await target.client.send(
    new GetObjectCommand({ Bucket: target.bucket, Key: key }),
  );
  if (!result.Body) throw new AppError("Foto não encontrada.");
  return result.Body.transformToWebStream();
}
