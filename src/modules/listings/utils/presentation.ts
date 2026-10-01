import type { ListingStatus } from "@/generated/prisma/enums";
export const statusLabels: Record<ListingStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  SOLD: "Vendido",
  REMOVED: "Excluído",
};
// Conversion is for display only; persistence and validation use decimal strings.
export const formatPrice = (price: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(price),
  );
