export default function debounce<TArgs extends ReadonlyArray<unknown>>(
  fn: (...args: TArgs) => void,
  waitMs: number,
): (...args: TArgs) => void {
  let t: number | undefined;

  return (...args: TArgs) => {
    if (t != null) {
      window.clearTimeout(t);
    }
    t = window.setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}
