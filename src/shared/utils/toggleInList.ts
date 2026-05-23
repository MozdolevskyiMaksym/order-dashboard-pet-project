export default function toggleInList<T>(
  list: ReadonlyArray<T>,
  value: T,
): ReadonlyArray<T> {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}
