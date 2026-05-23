import formatTwoDigitNumber from "./format-two-digit-number";

// Формує ISO-дату виду YYYY-MM-DDTHH:mm:ssZ для тестових замовлень
export default function buildIsoDateTime(
  baseYear: number,
  baseMonth: number,
  day: number,
): string {
  const date = `${baseYear}-${formatTwoDigitNumber(baseMonth)}-${formatTwoDigitNumber(day)}`;
  // Додаємо час, щоб ISO було правдоподібним
  return `${date}T${formatTwoDigitNumber(day % 24)}:${formatTwoDigitNumber((day * 7) % 60)}:00.000Z`;
}
