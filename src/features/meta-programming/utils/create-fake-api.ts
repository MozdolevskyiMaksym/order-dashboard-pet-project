import type { Order } from "@/shared/types/order";

import type { MetaProgrammingApi } from "../types";
import makeFakeOrder from "./make-fake-order";
import randomInt from "./random-int";
import sleep from "./sleep";
import { ALL_STATUSES } from "@/features/orders/constants";

// Ця функція створює "фейкове" API, яке імітує асинхронні запити для отримання замовлень
// Вона використовує setTimeout (через sleep) для імітації затримки мережі, а також генерує випадкові замовлення з різними статусами
// Це дозволяє нам тестувати наші демонстрації з проксі та мемоізацією, не покладаючись на реальний бекенд
export default function createFakeApi(): MetaProgrammingApi {
  return {
    // Метод для отримання замовлень, який приймає об'єкт з опціональним полем statuses для фільтрації замовлень за статусом
    async fetchOrders(input) {
      await sleep(randomInt(120, 420)); // Імітуємо затримку мережі, яка може бути від 120 до 420 мілісекунд

      // Якщо вхідний об'єкт містить поле statuses, використовуємо його для генерації замовлень, інакше використовуємо стандартний набір статусів
      const statuses = input.statuses ?? ALL_STATUSES;

      const count = randomInt(8, 18); // Визначаємо випадкову кількість замовлень, яку ми хочемо згенерувати (від 8 до 18)

      // Генеруємо масив замовлень, використовуючи функцію makeFakeOrder для створення кожного замовлення з унікальним ID та статусом
      const items: Order[] = [];
      for (let i = 0; i < count; i += 1) {
        const status = statuses[i % statuses.length]; // Вибираємо статус для замовлення, циклічно проходячи через масив статусів
        items.push(makeFakeOrder(`ORD-${1000 + i}`, status)); // Генеруємо ID замовлення у форматі "ORD-1000", "ORD-1001" і т.д., та додаємо його до масиву items
      }

      // Повертаємо згенерований масив замовлень
      return items;
    },

    // Метод для отримання замовлення за ID, який також імітує затримку мережі та повертає фейкове замовлення з статусом "processing"
    async getOrderById(id) {
      await sleep(randomInt(80, 240)); // Імітуємо затримку мережі, яка може бути від 80 до 240 мілісекунд
      return makeFakeOrder(id, "processing"); // Повертаємо фейкове замовлення з вказаним ID та статусом "processing"
    },
  };
}
