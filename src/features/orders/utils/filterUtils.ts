export function toggleInList<T>(
  list: ReadonlyArray<T>,
  value: T,
): ReadonlyArray<T> {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }

  return [...list, value];
}

export function uniqueSorted(
  values: ReadonlyArray<string>,
): ReadonlyArray<string> {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function isValidDay(value: string): boolean {
  if (!value) {
    return true;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function toNumberOrUndefined(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return undefined;
  }

  return number;
}
