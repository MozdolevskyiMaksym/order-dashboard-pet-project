export default function formatMs(
  value: number,
  fractionDigits: number = 2,
): string {
  return `${value.toFixed(fractionDigits)} ms`;
}
