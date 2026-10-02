import "server-only";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { profileSchema } from "../schemas/profile";

const privateProfile = {
  id: true,
  name: true,
  email: true,
  phone: true,
  whatsapp: true,
  image: true,
  role: true,
  status: true,
} as const;

export const userRepository = {
  findCredentials(email: string) {
    return db.user.findUnique({
      where: { email },
      select: { ...privateProfile, passwordHash: true },
    });
  },
  findById(id: string) {
    return db.user.findUnique({ where: { id }, select: privateProfile });
  },
  create(data: {
    name: string;
    email: string;
    whatsapp: string | null;
    passwordHash: string;
  }) {
    return db.user.create({ data, select: { id: true } });
  },
  updateProfile(id: string, data: z.output<typeof profileSchema>) {
    return db.user.updateMany({ where: { id, status: "ACTIVE" }, data });
  },
  listForAdmin() {
    return db.user.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        ...privateProfile,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    });
  },
  findForAdmin(id: string) {
    return db.user.findUnique({
      where: { id },
      select: {
        ...privateProfile,
        createdAt: true,
        _count: { select: { listings: true, reports: true } },
      },
    });
  },
  setStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    return db.user.update({ where: { id }, data: { status } });
  },
};
