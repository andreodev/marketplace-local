"use client";

import { useState, useSyncExternalStore } from "react";
import { zipSync } from "fflate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "../utils/presentation";
import { publicationText } from "../utils/publication-text";

type Listing = {
  slug: string;
  title: string;
  description: string;
  price: string;
  condition: string;
  city: string;
  state: string;
  images: string[];
};

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function imageBytes(url: string) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Não foi possível baixar uma das fotos.");
  return new Uint8Array(await response.arrayBuffer());
}

function lines(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, limit: number) {
  const result: string[] = [];
  let current = "";
  for (const word of value.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > maxWidth) {
      result.push(current);
      current = word;
      if (result.length === limit) break;
    } else current = next;
  }
  if (current && result.length < limit) result.push(current);
  return result;
}

export function PublicationKit({ listing }: { listing: Listing }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const origin = useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");
  const url = origin ? `${origin}/anuncio/${listing.slug}` : "";
  const fullText = publicationText(listing, url);

  async function copy(value: string, success: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(success);
    } catch { setMessage("Não foi possível copiar. Confira a permissão do navegador."); }
  }

  async function downloadPhotos() {
    setBusy(true);
    try {
      const files = await Promise.all(listing.images.map(async (src, index) => [
        `foto-${String(index + 1).padStart(2, "0")}.webp`, await imageBytes(src),
      ] as const));
      download(new Blob([zipSync(Object.fromEntries(files)) as BlobPart], { type: "application/zip" }), `fotos-${listing.slug}.zip`);
      setMessage("Fotos baixadas em um arquivo ZIP.");
    } catch { setMessage("Não foi possível baixar as fotos. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function downloadCard() {
    if (!listing.images[0]) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(new Blob([await imageBytes(listing.images[0]) as BlobPart]));
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível");
      ctx.fillStyle = "#f3f4ef";
      ctx.fillRect(0, 0, 1080, 1080);
      const scale = Math.max(1080 / bitmap.width, 760 / bitmap.height);
      const width = bitmap.width * scale;
      const height = bitmap.height * scale;
      ctx.drawImage(bitmap, (1080 - width) / 2, (760 - height) / 2, width, height);
      bitmap.close();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 760, 1080, 320);
      ctx.fillStyle = "#17664f";
      ctx.font = "bold 40px Arial, sans-serif";
      ctx.fillText("perto.", 56, 818);
      ctx.fillStyle = "#17201c";
      ctx.font = "bold 48px Arial, sans-serif";
      lines(ctx, listing.title, 950, 2).forEach((line, index) => ctx.fillText(line, 56, 884 + index * 54));
      ctx.fillStyle = "#17664f";
      ctx.font = "bold 50px Arial, sans-serif";
      ctx.fillText(formatPrice(listing.price), 56, 1010);
      ctx.fillStyle = "#64736b";
      ctx.font = "28px Arial, sans-serif";
      ctx.fillText(`${listing.city}, ${listing.state}`, 680, 1010);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Imagem indisponível");
      download(blob, `divulgar-${listing.slug}.png`);
      setMessage("Imagem de divulgação baixada.");
    } catch { setMessage("Não foi possível gerar a imagem. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, text: `${listing.title} · ${formatPrice(listing.price)}`, url }); return; }
      catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
    }
    await copy(url, "Link copiado para compartilhar.");
  }

  return (
    <div className="mt-7 space-y-5">
      <Card className="gap-4">
        <div><h2 className="text-lg font-semibold">Compartilhar</h2><p className="text-sm text-muted-foreground">Envie o link do anúncio para seus contatos e grupos.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={share}>Compartilhar no celular</Button>
          <Button type="button" variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank", "noopener,noreferrer")}>Enviar pelo WhatsApp</Button>
          <Button type="button" variant="outline" onClick={() => copy(url, "Link copiado.")}>Copiar link</Button>
        </div>
      </Card>
      <Card className="gap-4">
        <div><h2 className="text-lg font-semibold">Texto pronto</h2><p className="text-sm text-muted-foreground">Use nas suas publicações em outros canais.</p></div>
        <textarea aria-label="Texto pronto do anúncio" readOnly value={fullText} className="h-48 w-full resize-y rounded-lg border bg-background p-3 text-sm" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => copy(fullText, "Anúncio completo copiado.")}>Copiar tudo</Button>
          <Button type="button" variant="outline" onClick={() => copy(listing.title, "Título copiado.")}>Copiar título</Button>
          <Button type="button" variant="outline" onClick={() => copy(listing.description, "Descrição copiada.")}>Copiar descrição</Button>
          <Button type="button" variant="outline" onClick={() => copy(formatPrice(listing.price), "Preço copiado.")}>Copiar preço</Button>
        </div>
      </Card>
      <Card className="gap-4">
        <div><h2 className="text-lg font-semibold">Fotos e imagem de divulgação</h2><p className="text-sm text-muted-foreground">Baixe todas as fotos ou uma imagem quadrada com preço e título.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy || !listing.images.length} onClick={downloadPhotos}>Baixar fotos (.zip)</Button>
          <Button type="button" variant="outline" disabled={busy || !listing.images.length} onClick={downloadCard}>Criar imagem para divulgar</Button>
        </div>
      </Card>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-primary">{message}</p>
    </div>
  );
}
