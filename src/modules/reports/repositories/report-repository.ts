import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { z } from "zod";
import type { reportSchema } from "../schemas/report";

type ReportData = z.output<typeof reportSchema>;
const publicListing = {
  status: "ACTIVE" as const,
  seller: { status: "ACTIVE" as const },
  category: { active: true },
};

export const reportRepository = {
  async create(reporterId: string, data: ReportData) {
    return db.$transaction(async (tx) => {
      const listing = await tx.listing.findFirst({
        where: { id: data.listingId, ...publicListing },
        select: { id: true, sellerId: true },
      });
      if (!listing) throw new AppError("Este anúncio não está disponível.");
      if (listing.sellerId === reporterId)
        throw new AppError("Você não pode denunciar seu próprio anúncio.");
      const existing = await tx.report.findUnique({
        where: {
          listingId_reporterId: { listingId: data.listingId, reporterId },
        },
        select: { id: true },
      });
      if (existing) throw new AppError("Você já denunciou este anúncio.");
      return tx.report.create({ data: { ...data, reporterId } });
    });
  },
  listForAdmin() {
    return db.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        listing: {
          select: { id: true, title: true, slug: true, status: true },
        },
        reporter: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });
  },
  updateStatus(
    id: string,
    reviewedById: string,
    status: "REVIEWING" | "RESOLVED" | "DISMISSED",
  ) {
    return db.report.update({
      where: { id },
      data: {
        status,
        reviewedById,
        reviewedAt: status === "REVIEWING" ? null : new Date(),
      },
    });
  },
};
