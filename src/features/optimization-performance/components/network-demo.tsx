import { useMemo, useState } from "react";
import type { Logger } from "../types";

import { getOrders } from "@/api/orders.api";
import type { Order } from "@/shared/types/order";

import { delay } from "@/features/concurrency/utils/delay";
import {
  createLatestOnly,
  createSingleFlight,
} from "@/features/concurrency/utils";

import "./network-demo.scss";

export default function NetworkDemo(props: Readonly<{ logger: Logger }>) {
  // Результат останнього успішного запиту для відображення в UI
  const [last, setLast] = useState<{ count: number; sum: number } | null>(null);
  const [busy, setBusy] = useState(false); // Чи виконується зараз якась мережна операція

  // Це обгортка над async-функцією, яка гарантує, що лише найновіший виклик має право повернути результат, а старі результати будуть відхилені
  const latestOnly = useMemo(() => {
    // Це factory-функція, яка приймає будь-яку async-функцію і повертає обгортку з latest-only поведінкою
    return createLatestOnly(async (label: string, delayMs: number) => {
      // Усередині цієї функції ми описуємо, що саме виконує наш запит
      props.logger.info(`${label}: start (${delayMs.toFixed(0)} ms)`);

      await delay(delayMs); // Імітуємо мережну затримку

      // Потім виконуємо реальний запит до API
      const orders = await getOrders({
        statuses: ["new", "processing", "completed", "cancelled"],
      });
      props.logger.ok(`${label}: resolved (${orders.length})`); // Логируем, що запит завершився і скільки замовлень отримано

      return orders; // Повертаємо результат, але лише якщо цей виклик є найновішим, інакше він буде відхилений createLatestOnly
    });
  }, [props.logger]);

  // Це обгортка над async-функцією, яка гарантує, що якщо кілька викликів запитують один і той же ключ,
  // то реальний запит виконується лише один раз, а всі виклики отримують його результат
  const singleFlight = useMemo(
    () => createSingleFlight<ReadonlyArray<Order>>(), // Це factory-функція, яка повертає обгортку з singleflight поведінкою
    [],
  );

  // Ось тут ми демонструємо, як працює latest-only
  async function runLatestOnly() {
    setBusy(true); // Встановлюємо стан "зайнято", щоб заблокувати кнопки під час виконання
    setLast(null); // Очищаємо останній результат, щоб показати, що ми зараз виконуємо новий запит

    // У цьому прикладі ми запускаємо два запити майже одночасно: "latest slow" з затримкою 1200 ms
    // і "latest fast" з затримкою 250 ms
    props.logger.warn(
      "Latest-only: slow + fast started; only latest can update UI",
    );

    // Обидва ці виклики запускаються майже одночасно, але "latest fast" має меншу затримку, тому він завершиться раніше
    (async () => {
      try {
        const orders = await latestOnly.run("latest slow", 1200); // Цей виклик має більшу затримку, тому він завершиться пізніше
        // Якщо цей виклик є найновішим, він оновить UI, але якщо "latest fast" завершиться раніше,
        // то цей результат буде визнаний застарілим і не оновить UI
        setLast({ count: orders.length, sum: sumAmounts(orders) });
        props.logger.ok("UI updated: latest slow");
      } catch {
        props.logger.warn("latest slow ignored (stale)");
      }
    })();

    (async () => {
      try {
        const orders = await latestOnly.run("latest fast", 250); // Цей виклик має меншу затримку, тому він завершиться раніше
        // Якщо цей виклик є найновішим, він оновить UI, але якщо "latest slow" завершиться пізніше, то цей результат буде визнаний застарілим і не оновить UI
        setLast({ count: orders.length, sum: sumAmounts(orders) });
        props.logger.ok("UI updated: latest fast");
      } catch {
        props.logger.warn("latest fast ignored (stale)");
      } finally {
        setBusy(false);
      }
    })();
  }

  // Ось тут ми демонструємо, як працює singleflight
  async function runSingleFlight() {
    setBusy(true); // Встановлюємо стан "зайнято", щоб заблокувати кнопки під час виконання
    setLast(null); // Очищаємо останній результат, щоб показати, що ми зараз виконуємо новий запит

    props.logger.info(
      "Singleflight: 3 callers request same key; only 1 real fetch",
    );

    // Це ключ, який ми використовуємо для singleflight. Усі виклики з однаковим ключем будуть обʼєднані в один реальний запит
    const key = "orders-all";

    // Ця функція виконує реальний запит, але вона обгорнута в singleFlight.run, який гарантує,
    // що якщо кілька викликів запитують один і той же ключ, то реальний запит виконується лише один раз,
    // а всі виклики отримують його результат
    const runOne = async (label: string) => {
      const start = performance.now(); // Починаємо вимірювати час виконання запиту

      // Тут ми виконуємо запит через singleFlight. Якщо цей ключ вже запитується,
      // то цей виклик буде чекати результат першого виклику, замість того, щоб запускати новий запит
      const orders = await singleFlight.run(key, async () => {
        props.logger.info("singleflight: real fetch started");
        await delay(650); // Імітуємо мережну затримку, щоб було видно ефект singleflight

        // Потім виконуємо реальний запит до API. Якщо кілька викликів запитують цей ключ,
        // то цей код виконається лише один раз, і всі виклики отримають його результат
        return getOrders({
          statuses: ["new", "processing", "completed", "cancelled"], // Це реальний запит, який повертає замовлення з різними статусами
        });
      });

      // Вимірюємо, скільки часу зайняв виклик singleFlight.run, який може включати час очікування, якщо цей ключ вже запитується
      const ms = performance.now() - start;
      props.logger.ok(`${label}: resolved in ${ms.toFixed(1)} ms`);
      return orders;
    };

    // Тут ми запускаємо три виклики майже одночасно,
    // всі з однаковим ключем "orders-all". Завдяки singleflight, лише один з них виконає реальний запит,
    // а інші два будуть чекати його результат
    const [a] = await Promise.all([
      runOne("sf#1"),
      runOne("sf#2"),
      runOne("sf#3"),
    ]);
    // Оновлюємо UI з результатом, який отримали від singleflight.
    // Всі три виклики отримали один і той же результат, але реальний запит був виконаний лише один раз
    setLast({ count: a.length, sum: sumAmounts(a) });
    props.logger.ok("UI updated: singleflight shared result");
    setBusy(false);
  }

  return (
    <div className="network-demo">
      <div className="network-demo__row">
        <button
          type="button"
          className="network-demo__btn network-demo__btn--primary"
          onClick={runLatestOnly}
          disabled={busy}
        >
          Run latest-only
        </button>

        <button
          type="button"
          className="network-demo__btn network-demo__btn--primary"
          onClick={runSingleFlight}
          disabled={busy}
        >
          Run singleflight
        </button>

        <div className="network-demo__hint">
          Latest-only prevents stale UI updates. Singleflight reduces duplicate
          network calls.
        </div>
      </div>

      <div className="network-demo__metrics">
        <div className="network-demo__metric">
          <div className="network-demo__metric-label">UI count</div>
          <div className="network-demo__metric-value">
            {last ? last.count : "—"}
          </div>
        </div>
        <div className="network-demo__metric">
          <div className="network-demo__metric-label">UI sum</div>
          <div className="network-demo__metric-value">
            {last ? last.sum.toFixed(2) : "—"}
          </div>
        </div>
        <div className="network-demo__metric">
          <div className="network-demo__metric-label">Busy</div>
          <div className="network-demo__metric-value">
            {busy ? "yes" : "no"}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ця функція обчислює суму полів amount для масиву замовлень.
// Вона використовується для демонстрації того, як можна обробляти результати мережних запитів,
// отримуючи агреговані дані для відображення в UI.
function sumAmounts(orders: ReadonlyArray<Order>): number {
  return orders.reduce((acc, o) => acc + o.amount, 0);
}
