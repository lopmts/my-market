export function formatRating(
  rating: string | number | null | undefined,
): string {
  if (rating === null || rating === undefined || rating === "") return "—";

  const value = typeof rating === "string" ? Number(rating) : rating;
  if (Number.isNaN(value)) return "—";

  // sempre 1 casa decimal: 4.5, 4.8, 5.0
  return value.toFixed(1);
}

export function formatReviewsCount(count: number | null | undefined): string {
  if (!count) return "0";

  if (count >= 1000) {
    // 1200 -> "1.2k" | 856 -> "856"
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return String(count);
}
