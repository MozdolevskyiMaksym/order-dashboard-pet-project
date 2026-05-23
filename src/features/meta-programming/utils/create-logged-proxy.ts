import { LoggedProxyOptions } from "../types";
import stableStringify from "./stable-stringify";

// Узагальнена функція (generic): приймає будь-який об’єкт target і повертає той самий тип T
// Використовує Proxy для перехоплення викликів методів об’єкта target і логування інформації про них
// Логування включає назву методу, аргументи (за бажанням), час виконання та помилки (якщо вони виникають)
export default function createLoggedProxy<T extends object>(
  target: T,
  options: LoggedProxyOptions,
): T {
  const { label, logger, includeArgs } = options; // Деструктуризація параметрів з об’єкта options

  // Повертаємо новий Proxy, який перехоплює доступ до властивостей об’єкта target
  return new Proxy(target, {
    // Метод get викликається при доступі до властивості об’єкта target
    get(obj, prop, receiver) {
      // Отримуємо значення властивості за допомогою Reflect.get для коректного оброблення this
      // Це безпечний спосіб дістати реальне значення з об’єкта, це типу як obj[prop], але з правильним this (receiver) для випадків, коли це геттер або метод
      const value = Reflect.get(obj, prop, receiver);

      // Якщо значення не є функцією, просто повертаємо його без логування
      // Бо Proxy може перехопити не тільки методи, а й будь-які поля
      if (typeof value !== "function") {
        return value;
      }

      // Якщо значення є функцією, повертаємо обгорнуту версію цієї функції, яка виконує логування
      // Це аргементи функції, виклику, наприклад fetchOrders - тоді name буде "fetchOrders"
      return (...args: ReadonlyArray<unknown>) => {
        const name = String(prop); // Перетворюємо назву властивості на рядок для логування
        const start = performance.now(); // Запам’ятовуємо час початку виконання функції

        // Логування виклику функції з назвою та аргументами (якщо includeArgs встановлено в true)
        if (includeArgs) {
          // Використовуємо функцію safePreview для безпечного перетворення аргументів у рядок
          // Тобто якщо аргументи - це складні об’єкти, ми намагаємося їх перетворити в рядок для логування
          logger.log(`[${label}] call ${name}(${safePreview(args)})`);
        } else {
          // Якщо includeArgs не встановлено, логування буде містити лише назву функції без аргументів
          logger.log(`[${label}] call ${name}()`);
        }

        try {
          const result = value.apply(obj, args); // Викликаємо оригінальну функцію з правильним контекстом (this) та аргументами
          // Якщо результат є промісом (асинхронною операцією), обробляємо його окремо для логування часу виконання та помилок
          if (isPromiseLike(result)) {
            return result.then(
              (data: unknown) => {
                const ms = performance.now() - start; // Обчислюємо час виконання функції
                logger.log(`[${label}] ok ${name} (${ms.toFixed(1)}ms)`); // Логування успішного виконання функції з часом виконання

                return data; // Повертаємо результат проміса для подальшого використання
              },
              // Обробка помилок, які можуть виникнути під час виконання проміса
              (e: unknown) => {
                const ms = performance.now() - start; // Обчислюємо час до виникнення помилки

                // Логування помилки з назвою функції, часом до помилки та повідомленням про помилку
                logger.log(
                  `[${label}] error ${name} (${ms.toFixed(1)}ms): ${toErrorMessage(e)}`,
                );

                throw e; // Проброс помилки далі, щоб вона могла бути оброблена зовнішнім кодом, якщо потрібно
              },
            );
          }

          const ms = performance.now() - start; // Обчислюємо час виконання функції для синхронного результату
          logger.log(`[${label}] ok ${name} (${ms.toFixed(1)}ms)`); // Логування успішного виконання функції з часом виконання для синхронного результату

          return result; // Повертаємо результат виконання функції для синхронного випадку
        } catch (e) {
          // Обробка помилок, які можуть виникнути під час виконання синхронної функції
          const ms = performance.now() - start;
          logger.log(
            `[${label}] error ${name} (${ms.toFixed(1)}ms): ${toErrorMessage(e)}`,
          );
          throw e; // Проброс помилки далі, щоб вона могла бути оброблена зовнішнім кодом, якщо потрібно
        }
      };
    },
  });
}

// Допоміжна функція для безпечного перетворення значення в рядок для логування
function safePreview(value: unknown): string {
  try {
    return stableStringify(value);
  } catch {
    return "[unserializable]";
  }
}

// Допоміжна функція для визначення, чи є значення промісоподібним (має метод then)
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as any).then === "function"
  );
}

// Допоміжна функція для перетворення об’єкта помилки в рядок повідомлення
function toErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}


// Простими словами: цей файл створює обгортку над будь-яким об’єктом, щоб автоматично логувати виклики його методів
// Використовує Proxy для перехоплення викликів методів об’єкта target і логування інформації про них


// Наприклад, у мене є звичайний API-об’єкт:
// api.fetchOrders(...)
// api.getOrderById(...)

// Я обгортаю його 
// const loggedApi = createLoggedProxy(api, options);

// І тепер коли я викликаю:
// loggedApi.fetchOrders(...)

// виклик проходить через Proxy, який автоматично робить додаткову роботу:

// 1. Побачив, що викликається fetchOrders
// 2. Записав у лог: “call fetchOrders(...)”
// 3. Засік час старту
// 4. Викликав справжній api.fetchOrders(...)
// 5. Дочекався результату
// 6. Записав у лог: “ok fetchOrders (123ms)”
// 7. Повернув результат назад

// Якщо метод впав з помилкою, Proxy запише в лог:
// error fetchOrders (123ms): message

// Proxy дозволяє перехопити доступ до властивостей об’єкта.
// Тобто коли я пишу:
// loggedApi.fetchOrders

// спрацьовує:
// get(obj, prop, receiver)

// prop — це назва властивості, наприклад "fetchOrders".

// Без Proxy мені довелося б писати логування вручну в кожному методі
// А з Proxy я роблю це один раз і для всіх методів API
