"use client";

import { useEffect } from "react";
import { recordCategoryInterest } from "../utils/category-interest";

export function CategoryInterestTracker({
  slug,
  eventKey,
}: {
  slug?: string;
  eventKey: string;
}) {
  useEffect(() => {
    if (slug) recordCategoryInterest(slug, eventKey);
  }, [slug, eventKey]);

  return null;
}
