export default function toNumberOrUndefined(value: string): number | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return undefined;
  }

  const normalizedNumber = Number(normalizedValue);
  if (!Number.isFinite(normalizedNumber)) {
    return undefined;
  }

  return normalizedNumber;
}
