import { useEffect, useRef, useState } from "react";
import type { Logger } from "../types";

import "./worker-demo.scss";
import { heavyCalc } from "../utils";

// Цей компонент демонструє різницю між виконанням важкої задачі на головному потоці (main thread) і в Web Worker.
// У режимі "main-thread" весь код виконується на UI-потоке, що призводить до блокування інтерфейсу під час виконання.
// У режимі "worker" важка задача виконується в окремому потоці (Web Worker), що дозволяє інтерфейсу залишатися чуйним і оновлювати прогрес.

const ITEMS = 5000000;

type WorkerResponse = Readonly<{
  progress: number;
  done: boolean;
  durationMs?: number;
}>;

export default function WorkerDemo({ logger }: Readonly<{ logger: Logger }>) {
  const [mode, setMode] = useState<"main-thread" | "worker">("worker");
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastDuration, setLastDuration] = useState<number | null>(null); // Стан для збереження часу виконання останньої задачі
  const [tick, setTick] = useState(0); // Стан для відображення "серцебиття" UI, щоб показати, що інтерфейс залишається чуйним

  const workerRef = useRef<Worker | null>(null); // Реф для збереження екземпляра Web Worker
  const tickTimerRef = useRef<number | null>(null); // Реф для збереження таймера, який оновлює "серцебиття" UI

  useEffect(() => {
    // Ініціалізуємо Web Worker при монтуванні компонента і очищуємо його при розмонтуванні
    const worker = new Worker(
      new URL("./worker-demo.worker.ts", import.meta.url),
      {
        type: "module", // Вказуємо, що це модульний скрипт, щоб мати можливість використовувати сучасний синтаксис в коді воркера
      },
    );

    // Встановлюємо обробник повідомлень від воркера, щоб оновлювати прогрес і отримувати результат виконання
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data; // Очікуємо, що воркер буде надсилати об'єкти з полями progress, done і необов'язковим durationMs
      setProgress(data.progress); // Оновлюємо прогрес на основі повідомлення від воркера

      // Якщо воркер повідомляє, що робота завершена (done: true), оновлюємо стан з часом виконання і логируем результат
      if (data.done) {
        setIsRunning(false);
        setLastDuration(data.durationMs ?? null);
        logger.info(
          `WorkerDemo: worker done in ${(data.durationMs ?? 0).toFixed(2)} ms`,
        );
      }
    };

    workerRef.current = worker; // Зберігаємо екземпляр воркера в рефі, щоб мати до нього доступ в інших частинах компонента

    // Функція очистки, яка буде викликана при розмонтуванні компонента, щоб коректно завершити роботу воркера і очистити таймер
    return () => {
      worker.terminate(); // Завершуємо роботу воркера, щоб звільнити ресурси
      workerRef.current = null;
    };
  }, [logger]);

  // Цей ефект відповідає за оновлення "серцебиття" UI, щоб показати, що інтерфейс залишається чуйним під час виконання задачі.
  // Якщо задача виконується, встановлюємо інтервал для оновлення стану tick кожні 120 мс.
  // Якщо задача не виконується, очищуємо інтервал.
  useEffect(() => {
    if (!isRunning) {
      if (tickTimerRef.current != null) {
        window.clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }

      return;
    }

    // Якщо задача виконується, встановлюємо інтервал для оновлення "серцебиття" UI
    tickTimerRef.current = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 120);

    // Функція очистки для цього ефекту, яка буде викликана при зміні isRunning або при розмонтуванні компонента,
    // щоб очистити інтервал і запобігти витоку пам'яті
    return () => {
      if (tickTimerRef.current != null) {
        window.clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
    };
  }, [isRunning]);

  // Ця функція обробляє перемикання режимів між виконанням на головному потоці і в воркері.
  // Вона оновлює стан mode і логує зміну режиму.
  const handleToggleMode = () => {
    const next = mode === "main-thread" ? "worker" : "main-thread";
    setMode(next);
    logger.info(`WorkerDemo: mode=${next}`);
  };

  // Ця функція демонструє виконання важкої задачі на головному потоці.
  // Вона блокує UI, і прогрес не буде оновлюватися, поки задача не завершиться.
  // Після завершення вона оновлює стан з часом виконання і логирует результат.
  const runOnMainThread = () => {
    setIsRunning(true);
    setProgress(0);
    setLastDuration(null);

    const startedAt = performance.now(); // Запускаємо таймер для вимірювання часу виконання

    // Виконуємо важку задачу для кожного елемента.
    // Це заблокує UI, і користувач не зможе взаємодіяти з інтерфейсом, поки це не завершиться.
    for (let i = 0; i < ITEMS; i += 1) {
      heavyCalc(i);

      // Оновлюємо прогрес, але це не буде відображатися в UI, поки цикл не завершиться,
      // оскільки весь код виконується на головному потоці і блокує рендеринг.
      if (i % 10000 === 0) {
        setProgress(Math.round((i / ITEMS) * 100));
      }
    }

    setProgress(100); // Оновлюємо прогрес до 100% після завершення циклу

    const endedAt = performance.now(); // Зупиняємо таймер і виводимо час виконання в лог
    const duration = endedAt - startedAt; // Обчислюємо тривалість виконання

    setLastDuration(duration);
    setIsRunning(false);

    logger.info(`WorkerDemo: main-thread done in ${duration.toFixed(2)} ms`);
  };

  // Ця функція демонструє виконання важкої задачі в Web Worker.
  // Вона надсилає повідомлення воркеру з кількістю елементів для обробки.
  // Прогрес і результат виконання будуть отримані через обробник повідомлень, встановлений в useEffect.
  const runInWorker = () => {
    setIsRunning(true);
    setProgress(0);
    setLastDuration(null);

    workerRef.current?.postMessage({ items: ITEMS }); // Надсилаємо повідомлення воркеру з даними для обробки
    logger.info("WorkerDemo: worker started");
  };

  // Ця функція обробляє натискання кнопки "Run".
  // Вона перевіряє поточний режим і викликає відповідну функцію для запуску задачі.
  const handleRun = () => {
    if (isRunning) {
      return;
    }

    if (mode === "main-thread") {
      runOnMainThread();
      return;
    }

    runInWorker();
  };

  return (
    <div className="worker-demo">
      <div className="worker-demo__row">
        <button
          type="button"
          className="worker-demo__btn worker-demo__btn--primary"
          onClick={handleToggleMode}
          disabled={isRunning}
        >
          Mode: {mode}
        </button>

        <button
          type="button"
          className="worker-demo__btn"
          onClick={handleRun}
          disabled={isRunning}
        >
          Run
        </button>

        <div className="worker-demo__hint">
          Main-thread mode blocks UI. Worker mode moves heavy CPU work off the
          UI thread.
        </div>
      </div>

      <div className="worker-demo__metrics">
        <div className="worker-demo__metric">
          <div className="worker-demo__metric-label">Progress</div>
          <div className="worker-demo__metric-value">{progress}%</div>
        </div>

        <div className="worker-demo__metric">
          <div className="worker-demo__metric-label">UI heartbeat</div>
          <div className="worker-demo__metric-value">{tick}</div>
        </div>

        <div className="worker-demo__metric">
          <div className="worker-demo__metric-label">Last run</div>
          <div className="worker-demo__metric-value">
            {lastDuration == null ? "—" : `${lastDuration.toFixed(2)} ms`}
          </div>
        </div>
      </div>

      <div className="worker-demo__bar">
        <div
          className="worker-demo__progress"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
