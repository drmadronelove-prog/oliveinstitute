/** Formats a price in minor units, e.g. 24900 -> "$249.00". Free reads "Free". */
export function formatPrice(amountCents: number, currency = "usd"): string {
  if (amountCents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

/** Formats a whole-minute duration, e.g. 190 -> "3h 10m". */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Formats a lesson length in seconds, e.g. 840 -> "14:00". */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

const TRACK_LABEL: Record<string, string> = {
  CLINICIAN: "Clinician",
  PUBLIC: "Public",
};

export function trackLabel(track: string): string {
  return TRACK_LABEL[track] ?? track;
}
