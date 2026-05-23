// Ця функція робить штучну затримку на потрібну кількість мілісекунд

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // ця функція виконається через ms мілісекунд і викличе resolve, який розблокує await
    window.setTimeout(() => resolve(), ms);
  });
}

export default delay;
