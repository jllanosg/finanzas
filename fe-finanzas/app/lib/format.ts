import type { Currency } from "./api";

const moneyFormatters = new Map<Currency, Intl.NumberFormat>();
const compactFormatters = new Map<Currency, Intl.NumberFormat>();

function localeFor(currency: Currency): string {
  return currency === "CLP" ? "es-CL" : "en-US";
}

function moneyFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    const fractionDigits = currency === "CLP" ? 0 : 2;
    formatter = new Intl.NumberFormat(localeFor(currency), {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter;
}

function compactFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = compactFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(localeFor(currency), {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      notation: "compact",
      maximumFractionDigits: currency === "CLP" ? 0 : 1,
    });
    compactFormatters.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(value: number, currency: Currency = "USD"): string {
  return moneyFormatter(currency).format(value);
}

export function moneyParts(
  value: number,
  currency: Currency = "USD",
): { whole: string; fraction: string } {
  const parts = moneyFormatter(currency).formatToParts(Math.abs(value));
  return {
    whole: parts
      .filter((part) => part.type === "currency" || part.type === "integer" || part.type === "group")
      .map((part) => part.value)
      .join(""),
    fraction: parts.find((part) => part.type === "fraction")?.value ?? "",
  };
}

export function formatCompactCurrency(value: number, currency: Currency = "USD"): string {
  if (value === 0) return formatMoney(0, currency);
  return compactFormatter(currency).format(value);
}

export function formatTransactionDate(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDifference === 0) {
    return `Today, ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  if (dayDifference === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

export function formatLongDate(date: Date): string {
  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function dateInputValue(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

const categoryColors: Record<string, string> = {
  blue: "#6e8990",
  green: "#77967d",
  gold: "#d7b283",
  peach: "#c9926b",
  lavender: "#a9a4c1",
  purple: "#8c83ab",
  mint: "#7cae91",
  gray: "#cfd5cf",
};

export function categoryColor(color: string | null | undefined): string {
  return categoryColors[color ?? ""] ?? categoryColors.gray;
}

const categoryTones = new Set(["lavender", "mint", "peach", "blue", "gold", "purple", "gray"]);

export function categoryTone(color: string | null | undefined): string {
  return color && categoryTones.has(color) ? color : "lavender";
}
