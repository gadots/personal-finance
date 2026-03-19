export function formatCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "ARS" ? 0 : 2,
  }).format(amount);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-GB").format(new Date(dateString));
}
