import "server-only";
import { db } from "@/lib/db";

export const dashboardRepository = {
  async counts() {
    const [users, activeListings, openReports, activeCategories] =
      await Promise.all([
        db.user.count(),
        db.listing.count({ where: { status: "ACTIVE" } }),
        db.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
        db.category.count({ where: { active: true } }),
      ]);
    return { users, activeListings, openReports, activeCategories };
  },
};
