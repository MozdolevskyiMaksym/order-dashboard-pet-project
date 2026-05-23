type SingleFlight<T> = Readonly<{
  run: (key: string, fn: () => Promise<T>) => Promise<T>; // запускає або повторно використовує Promise
  clear: (key: string) => void; // видаляє конкретний ключ
  clearAll: () => void; // очищає всі in-flight
}>;

// Фабрика, яка створює менеджер in-flight запитів
export default function createSingleFlight<T>(): SingleFlight<T> {
  // key = ідентифікатор ресурсу (наприклад "orders-all")
  // value = Promise, який зараз виконується
  const inFlight = new Map<string, Promise<T>>();
  // Тобто ми зберігаємо:
  // "Оцей ресурс зараз завантажується, ось його Promise"

  // key — унікальний ідентифікатор ресурсу
  // fn — функцію, яка реально робить fetch
  async function run(key: string, fn: () => Promise<T>): Promise<T> {
    // Крок 1: перевіряємо чи вже є in-flight
    const existing = inFlight.get(key);

    // Якщо в Map вже є Promise для цього key
    if (existing) {
      // повертаємо його
      // НЕ запускаємо новий fn()
      // Оце і є deduplication — ми використовуємо вже існуючий Promise замість створення нового
      return existing;
    }

    // Крок 2: якщо ще немає — запускаємо
    const promise = fn().finally(() => {
      // Коли Promise завершиться (успішно або з помилкою)
      // ми видаляємо key з Map, бо singleFlight працює тільки для in-flight
      // Як тільки запит завершився - більше немає сенсу його дедуплікувати
      // наступний виклик повинен створити новий Promise
      inFlight.delete(key);
    });

    // Крок 3: зберігаємо Promise
    inFlight.set(key, promise); // кладемо Promise в Map
    return promise;
  }

  // Дозволяє вручну видалити конкретний in-flight ключ
  // Наприклад, якщо хочеш примусово дозволити новий fetch
  const clear = (key: string): void => {
    inFlight.delete(key);
  };

  // Очищає всі in-flight запити
  const clearAll = (): void => {
    inFlight.clear();
  };

  return { run, clear, clearAll };
}

// Повний сценарій:

// 1-й виклик:
// run("orders-all", fetchFn)

// Map пустий
// запускається fetchFn()
// Promise кладеться в Map
// повертається Promise

// 2-й виклик (поки 1-й ще не завершився):
// run("orders-all", fetchFn)

// Map вже містить Promise
// повертається existing Promise
// fetchFn НЕ запускається вдруге

// Коли Promise завершується:
// finally → key видаляється
// Map знову пустий
