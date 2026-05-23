import { useMemo, useRef, useState } from "react";

import { getOrders } from "@/api/orders.api";
import type { Order } from "@/shared/types/order";

import {
  appendLog,
  createLatestOnly,
  createSingleFlight,
  createSemaphore,
  delay,
  type LogItem,
} from "@/features/concurrency/utils";
import { formatMoney } from "@/shared/utils";

import {
  Card,
  MiniTimeline,
  TalkTrack,
} from "@/features/concurrency/components";

import "./concurrency-page.scss";

export default function ConcurrencyPage() {
  const [logs, setLogs] = useState<ReadonlyArray<LogItem>>([]); // масив подій (що стартувало/що завершилось/що оновило UI)
  const [lastCount, setLastCount] = useState<number | null>(null); // кількість orders
  const [lastSum, setLastSum] = useState<number | null>(null); // сума amount по orders

  // useRef, бо це не UI-стан — не треба ререндер від цього
  const counter = useRef(0); // Лічильник для ідентифікації запитів у логах (naive#1, naive#2…)

  const latestOnly = useMemo(() => {
    // Створюємо “обгортку”, яка гарантує:
    // якщо викликали 2 рази latestOnly.run(...),
    // тільки останній має право “закомітити” результат, попередній буде “ігнор”.
    return createLatestOnly(async (label: string, delayMs: number) => {
      // Всередині ми описуємо “що таке один запит”:
      appendLog(
        setLogs,
        "info",
        `${label}: start (${delayMs.toFixed(0)} ms)`, // Пишемо лог “старт”
      );

      await delay(delayMs); // Чекаємо delayMs — симуляція різної швидкості

      //Реальний API виклик.
      const orders = await getOrders({
        statuses: ["new", "processing", "completed", "cancelled"],
      });

      // Пишемо лог “завершився”
      appendLog(setLogs, "ok", `${label}: resolved (${orders.length})`);

      return orders; // Повертаємо orders
    });
  }, []);

  // Створює менеджер in-flight запитів
  // Ідея: якщо singleFlight.run(key, fn) викликають паралельно 3 рази з однаковим key,
  // → fn виконається один раз, всі інші дочекаються того самого Promise
  const singleFlight = useMemo(
    () => createSingleFlight<ReadonlyArray<Order>>(),
    [],
  );

  // Створює “лімітер”: максимум 3 задачі одночасно (одночасно можуть виконуватись тільки 3 задачі, інші чекають в черзі)
  // Все інше стає в чергу
  const semaphore = useMemo(() => createSemaphore(3), []);

  // єдине місце, де ми “оновлюємо UI”
  const applyUi = (orders: ReadonlyArray<Order>, note: string) => {
    const sum = orders.reduce((acc, o) => acc + o.amount, 0); // Рахуємо суму amount по orders

    // Записуємо в UI “останній застосований результат”
    setLastCount(orders.length);
    setLastSum(sum);

    // Пишемо в лог “UI updated …”
    // note — підказка, хто саме застосував (naive slow overwrote / latest fast / singleflight shared…)
    // саме тут видно, хто “переміг” і що реально потрапило в UI
    appendLog(
      setLogs,
      "ok",
      `UI updated (${note}): count=${orders.length}, sum=${formatMoney(sum)}`,
    );
  };

  // DEMO 1: Naive race condition
  const runNaiveRace = async () => {
    // Скидаємо попередній UI результат перед демо
    setLastCount(null);
    setLastSum(null);

    // Пишемо попередження, що зараз буде race
    appendLog(
      setLogs,
      "warn",
      "Race demo: slow request may overwrite fast result (stale UI update)",
    );

    // Slow request
    counter.current += 1; // Інкрементуємо лічильник → id
    const slowId = counter.current;

    // Запускаємо async IIFE і не чекаємо її (void (...)()), тобто “паралельно”
    // Цей slow запит може прийти пізніше і перезаписати UI
    // void - Я свідомо ігнорую результат цього Promise(це потрібно для Eslint, typescript)
    void (async () => {
      await delay(1200); // Чекаємо 1200ms

      // робимо fetch
      const orders = await getOrders({
        statuses: ["new", "processing", "completed", "cancelled"],
      });

      appendLog(setLogs, "warn", `naive#${slowId} slow resolved → setState`);

      // оновлюємо UI
      applyUi(orders, "naive slow overwrote");
    })();

    // Fast request
    counter.current += 1;
    const fastId = counter.current;

    void (async () => {
      await delay(300); // Все те саме, але delay 300ms

      const orders = await getOrders({
        statuses: ["new", "processing", "completed", "cancelled"],
      });

      appendLog(setLogs, "info", `naive#${fastId} fast resolved → setState`);

      applyUi(orders, "naive fast applied");
    })();

    // fast оновить UI першим
    // Потім slow оновить UI другим → і “overwrite”
    // Суть демо: обидва запити без контролю мають право робити setState → можливий stale overwrite
  };

  // DEMO 2: Latest-only (race protection)
  const runLatestOnlyDemo = async () => {
    // Скидаємо UI
    setLastCount(null);
    setLastSum(null);

    // Пояснення в лог
    appendLog(
      setLogs,
      "info",
      "Latest-only demo: only the latest request is allowed to update the UI",
    );

    // Slow + Fast, але через latestOnly.run
    void (async () => {
      try {
        const orders = await latestOnly.run("latest slow", 1200);

        applyUi(orders, "latest slow");
      } catch {
        // Якщо цей виклик перестав бути “останнім”, він зазвичай “відхиляється/скасовується” логікою latestOnly,
        // тоді попадемо в catch і напишемо “ignored”
        appendLog(setLogs, "warn", "latest slow ignored (stale)");
      }
    })();

    // Другий виклик (fast) стартує після slow, тому він “останніший”
    // Очікування: fast застосовується, slow буде ignored, навіть якщо прийде пізніше
    void (async () => {
      try {
        const orders = await latestOnly.run("latest fast", 300);

        applyUi(orders, "latest fast");
      } catch {
        appendLog(setLogs, "warn", "latest fast ignored");
      }
    })();

    // Суть демо: “останній виклик перемагає”, UI консистентний
  };

  // DEMO 3: Singleflight (dedup)
  const runSingleFlightDemo = async () => {
    // Скидаємо UI
    setLastCount(null);
    setLastSum(null);

    // Пояснення в лог
    appendLog(
      setLogs,
      "info",
      "Singleflight demo: multiple identical requests share one in-flight promise",
    );

    const key = "orders-all"; // Ключ ресурсу (ідентифікатор “однакового запиту”)

    const runOne = async (label: string) => {
      const start = performance.now(); // Замір часу для кожного “клієнта”

      const orders = await singleFlight.run(key, async () => {
        appendLog(setLogs, "info", "singleflight: real fetch started");

        await delay(650);

        return getOrders({
          statuses: ["new", "processing", "completed", "cancelled"],
        });

        // Перший, хто зайде з key, реально виконає fn (“real fetch started”)
        // інші, хто зайдуть паралельно з тим же key, не запустять fn, а дочекаються того ж Promise
      });

      // Логуємо, що цей клієнт завершився і за скільки
      appendLog(
        setLogs,
        "ok",
        `${label}: resolved in ${(performance.now() - start).toFixed(1)} ms`,
      );

      return orders;
    };

    // Запускаємо 3 клієнти паралельно
    // Реальний fetch буде один, але завершаться всі 3
    // тобто воно поверне один і той же результат для всіх 3 клієнтів, але по факту кольнеться тільки один раз
    const [result] = await Promise.all([
      runOne("sf#1"),
      runOne("sf#2"),
      runOne("sf#3"),
    ]);

    // Беремо результат першого (всі однакові) і застосовуємо в UI
    applyUi(result, "singleflight shared result");

    // Суть демо: один реальний запит на 3 клієнти → економія мережі/ресурсів
  };

  // DEMO 4: Semaphore (limit concurrency)
  const runSemaphoreDemo = async () => {
    setLastCount(null);
    setLastSum(null);

    appendLog(
      setLogs,
      "info",
      "Semaphore demo: limit concurrency to 3 (10 tasks queued)",
    );

    // Створюємо 10 задач
    // Кожну запускаємо через semaphore.run, тобто не більше 3 одночасно
    const tasks = Array.from({ length: 10 }).map((_, i) =>
      semaphore.run(async () => {
        const delayMs = 200 + Math.random() * 900; // випадковий delay від 200 до 1100ms
        // стартує, логує “скільки зараз running”
        appendLog(
          setLogs,
          "info",
          `task#${i + 1} start | running=${semaphore.getRunningCount()}`,
        );
        await delay(delayMs); // чекає випадковий час (типу запит до сервера)

        // завершується, знову логує running
        appendLog(
          setLogs,
          "ok",
          `task#${i + 1} finish | running=${semaphore.getRunningCount()}`,
        );
      }),
    );

    // Чекаємо завершення всіх
    await Promise.all(tasks);

    // Лог “все готово”
    appendLog(setLogs, "ok", "Semaphore: all tasks finished");

    // Суть демо: running ніколи не має перевищити 3
  };

  return (
    <div className="concurrency-page">
      <div className="concurrency-page__header">
        <h1 className="concurrency-page__title">Concurrency synchronization</h1>

        <div className="concurrency-page__subtitle">
          Demonstrates how to <b>synchronise concurrent operations</b>:{" "}
          <b>race protection</b> (latest-only), <b>request dedup</b>{" "}
          (singleflight), <b>concurrency limit</b> (semaphore).
        </div>

        <div className="concurrency-page__summary-row">
          <div className="concurrency-page__summary">
            <div className="concurrency-page__summary-label">Last UI</div>
            <div className="concurrency-page__summary-value">
              count: {lastCount ?? "—"}
            </div>
            <div className="concurrency-page__summary-sep">|</div>
            <div className="concurrency-page__summary-value">
              sum: {lastSum == null ? "—" : formatMoney(lastSum)}
            </div>
          </div>

          <button
            onClick={() => {
              setLogs([]);
              setLastCount(null);
              setLastSum(null);
            }}
            className="concurrency-btn concurrency-btn--ghost"
          >
            Clear log
          </button>
        </div>
      </div>

      <div className="concurrency-page__grid concurrency-page__grid--two">
        <Card
          title="Race condition"
          subtitle="Naive approach: two requests run concurrently. A slower response can arrive later and overwrite the newer result."
          badge={{ text: "Problem", variant: "danger" }}
        >
          <div className="concurrency-card__actions">
            <button
              onClick={runNaiveRace}
              className="concurrency-btn concurrency-btn--primary"
            >
              Run race demo
            </button>

            <div className="concurrency-card__hint">
              Expect: slow overwrites fast sometimes
            </div>
          </div>
        </Card>

        <Card
          title="Latest-only protection"
          subtitle="Synchronised: only the newest request can commit a UI update. Older results are ignored."
          badge={{ text: "Fix", variant: "success" }}
        >
          <div className="concurrency-card__actions">
            <button
              onClick={runLatestOnlyDemo}
              className="concurrency-btn concurrency-btn--primary"
            >
              Run latest-only demo
            </button>

            <div className="concurrency-card__hint">
              Expect: only fast applies
            </div>
          </div>
        </Card>

        <Card
          title="Singleflight (dedup)"
          subtitle="Synchronised: many callers share one in-flight promise for the same key. Less network, same result."
          badge={{ text: "Optimization", variant: "neutral" }}
        >
          <div className="concurrency-card__actions">
            <button
              onClick={runSingleFlightDemo}
              className="concurrency-btn concurrency-btn--primary"
            >
              Run singleflight demo
            </button>

            <div className="concurrency-card__hint">
              Expect: one “real fetch”
            </div>
          </div>
        </Card>

        <Card
          title="Semaphore (limit concurrency)"
          subtitle="Synchronised: allow only N concurrent tasks; queue the rest. Prevents overload and keeps app responsive."
          badge={{ text: "Control", variant: "neutral" }}
        >
          <div className="concurrency-card__actions">
            <button
              onClick={runSemaphoreDemo}
              className="concurrency-btn concurrency-btn--primary"
            >
              Run semaphore demo
            </button>

            <div className="concurrency-card__hint">
              Expect: running never exceeds 3
            </div>
          </div>
        </Card>
      </div>

      <div className="concurrency-page__grid concurrency-page__grid--two">
        <MiniTimeline
          title="Timeline: naive race"
          lines={[
            {
              label: "fast request",
              note: "finishes early → sets UI",
              widthPct: 25,
              color: "#60a5fa",
              endTag: "UI = fast",
            },
            {
              label: "slow request",
              note: "finishes later → overwrites UI",
              widthPct: 85,
              color: "#fb7185",
              endTag: "UI = stale (slow)",
            },
          ]}
        />

        <MiniTimeline
          title="Timeline: latest-only guard"
          lines={[
            {
              label: "fast request",
              note: "latest → allowed to commit",
              widthPct: 25,
              color: "#22c55e",
              endTag: "UI = fast",
            },
            {
              label: "slow request",
              note: "stale → ignored",
              widthPct: 85,
              color: "#a1a1aa",
              endTag: "ignored",
            },
          ]}
        />
      </div>

      <TalkTrack />

      <div className="concurrency-log">
        <div className="concurrency-log__header">
          <div className="concurrency-log__title">Live log</div>
          <div className="concurrency-log__meta">
            newest first | max 120 items
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="concurrency-log__empty">No activity yet.</div>
        ) : (
          <div className="concurrency-log__list">
            {logs.map(({ id, time, level, text }) => {
              return (
                <div key={id} className="concurrency-log__item">
                  <div className="concurrency-log__time">{time}</div>
                  <div
                    className={`concurrency-log__dot concurrency-log__dot--${level}`}
                  />
                  <div className="concurrency-log__text">{text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
