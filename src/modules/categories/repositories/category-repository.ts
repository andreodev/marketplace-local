import "server-only";
import { db } from "@/lib/db";

export const categoryRepository = {
  listActive() {
    return db.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    });
  },
  findActiveBySlug(slug: string) {
    return db.category.findUnique({
      where: { slug, active: true },
      select: { id: true, name: true, slug: true },
    });
  },
  listForAdmin() {
    return db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        sortOrder: true,
        _count: { select: { listings: true } },
      },
    });
  },
  create(data: { name: string; slug: string; sortOrder: number }) {
    return db.category.create({ data });
  },
  update(
    id: string,
    data: { name: string; slug: string; sortOrder: number; active: boolean },
  ) {
    return db.category.update({ where: { id }, data });
  },
};
