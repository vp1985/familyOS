export type MoneyTransactionType = "allowance" | "loan" | "repayment" | "adjustment" | "reward";

export function parseEuroToCents(value: string): number | null {
  const cleaned = value.trim().replace(/€/g, "").trim().replace(",", ".");

  if (!cleaned || cleaned.startsWith("-")) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  const [euroPart, centPart = ""] = cleaned.split(".");
  const cents = Number(euroPart) * 100 + Number(centPart.padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const euros = Math.floor(absolute / 100);
  const rest = String(absolute % 100).padStart(2, "0");

  return `${sign}${euros},${rest} €`;
}

export function applyMoneyTransaction(
  currentBalanceCents: number,
  type: MoneyTransactionType,
  amountCents: number,
): number {
  if (type === "allowance" || type === "repayment") {
    return currentBalanceCents + amountCents;
  }

  if (type === "loan") {
    return currentBalanceCents - amountCents;
  }

  return amountCents;
}
