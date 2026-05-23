export default // Додає ведучий 0 до числа, якщо воно менше 10 (для форматування дати)
function formatTwoDigitNumber(number: number): string {
  if (number < 10) {
    return `0${number}`;
  }
  return String(number);
}
