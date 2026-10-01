import { getListingPhoto } from "@/modules/listings/services/media-service";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    const photo = await getListingPhoto(key.join("/"));
    if (!photo) return new Response(null, { status: 404 });
    return new Response(photo.body, {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      "Media read failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return new Response(null, { status: 404 });
  }
}
