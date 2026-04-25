export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMiles(miles: number | null | undefined): string {
  return Number(miles || 0).toFixed(1);
}

export function parseDateLabel(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "Unknown";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function normalizeRunnerKey(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}
