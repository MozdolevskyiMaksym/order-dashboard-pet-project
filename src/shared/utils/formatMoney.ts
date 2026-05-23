type FormatMoneyOptions = Readonly<{
  locale?: string;
  currency?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  style?: "currency" | "decimal";
}>;

export default function formatMoney(
  value: number,
  options: FormatMoneyOptions = {},
): string {
  const {
    locale = "en-US",
    currency,
    maximumFractionDigits = 0,
    minimumFractionDigits,
    style,
  } = options;

  const resolvedStyle = style ?? (currency ? "currency" : "decimal");
  const formatOptions: Intl.NumberFormatOptions = {
    style: resolvedStyle,
    maximumFractionDigits,
  };

  if (minimumFractionDigits != null) {
    formatOptions.minimumFractionDigits = minimumFractionDigits;
  }

  if (resolvedStyle === "currency" && currency) {
    formatOptions.currency = currency;
  }

  return new Intl.NumberFormat(locale, formatOptions).format(value);
}
