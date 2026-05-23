export default function randomInt(min: number, max: number): number {
  const span = max - min + 1;
  return min + Math.floor(Math.random() * span);
}
