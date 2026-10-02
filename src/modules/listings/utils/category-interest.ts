export const categoryInterestKey = "perto:category-interest:v1";

export function parseCategoryInterest(raw: string): Record<string, number> {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([slug, count]) =>
          /^[a-z0-9-]+$/.test(slug) &&
          typeof count === "number" &&
          Number.isFinite(count) &&
          count > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function readCategoryInterest(): Record<string, number> {
  try {
    return parseCategoryInterest(localStorage.getItem(categoryInterestKey) ?? "{}");
  } catch {
    return {};
  }
}

export function recordCategoryInterest(slug: string, eventKey: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) return;
  try {
    const lastEvent = JSON.parse(sessionStorage.getItem("perto:last-interest-event") ?? "null") as
      | { key: string; at: number }
      | null;
    if (lastEvent?.key === eventKey && Date.now() - lastEvent.at < 3000) return;
    sessionStorage.setItem(
      "perto:last-interest-event",
      JSON.stringify({ key: eventKey, at: Date.now() }),
    );
    const interest = readCategoryInterest();
    interest[slug] = Math.min((interest[slug] ?? 0) + 1, 1000);
    localStorage.setItem(categoryInterestKey, JSON.stringify(interest));
  } catch {
    // Storage can be disabled; the general showcase still works.
  }
}
