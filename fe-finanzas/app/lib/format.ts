const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return currencyFormatter.format(value);
}

export function moneyParts(value: number): { whole: string; fraction: string } {
  const formatted = currencyFormatter.format(Math.abs(value));
  const separator = formatted.lastIndexOf(".");
  return {
    whole: formatted.slice(0, separator),
    fraction: formatted.slice(separator + 1),
  };
}

export function formatCompactCurrency(value: number): string {
  if (value === 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
