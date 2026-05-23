export default function safeNumber(value: string): number | undefined {
  const v = value.trim();
  if (!v) {
    return undefined;
  }

  const n = Number(v);
  if (!Number.isFinite(n)) {
    return undefined;
  }

  return n;
}
