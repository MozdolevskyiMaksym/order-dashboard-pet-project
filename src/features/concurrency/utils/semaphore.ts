type Semaphore = Readonly<{
  run: <T>(task: () => Promise<T>) => Promise<T>; // запускає задачу через семафор
  getPendingCount: () => number; // скільки задач у черзі
  getRunningCount: () => number; // скільки задач зараз виконуються
}>;

// Semaphore — це механізм, який:
// Дозволяє виконувати максимум N async-операцій одночасно.
// Інші стають у чергу.
export default function createSemaphore(maxConcurrent: number): Semaphore {
  const queue: Array<() => void> = []; // Масив функцій-стартерів. Це не самі задачі, а функції, які запускають задачу
  let running = 0; // Скільки задач зараз виконуються

  // Не запускає всі задачі одразу
  // Запускає рівно стільки, скільки дозволено
  const pump = (): void => {
    // Якщо вже виконується максимум — нічого не робимо
    if (running >= maxConcurrent) {
      return;
    }

    const next = queue.shift(); // Беремо наступну задачу з черги

    // Якщо черга пуста — виходимо
    if (!next) {
      return;
    }

    running += 1; // Збільшуємо лічильник running
    next(); // Запускаємо задачу
  };

  // task — функція, яка повертає Promise
  const run = async <T>(task: () => Promise<T>): Promise<T> => {
    // Створюємо новий Promise
    return new Promise<T>((resolve, reject) => {
      // start — функція, яка реально запустить task
      const start = () => {
        task()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            running -= 1; // Зменшуємо running
            pump(); // Після завершення задачи запускаємо наступну з черги (якщо є) (3)
          });
      };

      // Додаємо start в чергу
      queue.push(start); // (1)
      pump(); // Спробуємо запустити (можливо, ми ще не досягли maxConcurrent, тоді start запустится відразу) // (2)
    });
  };

  return {
    run,
    getPendingCount: () => queue.length,
    getRunningCount: () => running,
  };
}

// Повний сценарій (10 задач, maxConcurrent = 3)

// 1. Перші 3 задачі:
// 	•	додаються в чергу
// 	•	pump запускає їх
// 	•	running = 3
// 2. 4-та задача:
// 	•	додається в чергу
// 	•	pump бачить running >= 3 → нічого не робить
// 3. Коли одна з перших 3 завершується:
// 	•	running–
// 	•	pump() запускає наступну з черги (якщо є)

// Тобто:
// Кожне завершення автоматично запускає наступну задачу.
// Це замкнутий цикл керування конкурентністю
