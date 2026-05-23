// Цей компонент демонструє ефект "бурі подій" (event storm) та переваги використання `requestAnimationFrame`
// для оптимізації обробки великої кількості подій.
// Він дозволяє порівняти наївний підхід, який обробляє кожну подію одразу, з оптимізованим підходом,
// який використовує `requestAnimationFrame` для групування оновленьта важких операцій.

import { useMemo, useRef, useState } from "react";
import type { Logger } from "../types";
import { rafThrottle } from "../utils";

import "./event-storm-demo.scss";

type BurstResult = Readonly<{
  events: number;
  updates: number;
  workRuns: number;
  ms: number;
}>;

const BURST_SIZE = 300;

export default function EventStormDemo({
  logger,
}: Readonly<{ logger: Logger }>) {
  const [mode, setMode] = useState<"naive" | "optimized">("optimized");
  const [events, setEvents] = useState(0); // raw events
  const [updates, setUpdates] = useState(0); // state updates triggered
  const [workRuns, setWorkRuns] = useState(0); // expensive work runs triggered
  const [lastBurstMs, setLastBurstMs] = useState<number | null>(null); // duration of last burst run
  const [isRunning, setIsRunning] = useState(false); // indicates if a burst is currently running

  // refs to track counts without causing re-renders on every event
  const eventsRef = useRef(0);
  const updatesRef = useRef(0);
  const workRunsRef = useRef(0);

  // Функція flushCounters оновлює стан компонента на основі поточних значень у refs.
  // Це дозволяє відображати актуальні метрики після завершення обробки подій.
  const flushCounters = () => {
    setEvents(eventsRef.current);
    setUpdates(updatesRef.current);
    setWorkRuns(workRunsRef.current);
  };

  // Наївний обробник, який виконує важку роботу для кожної події без оптимізації.
  const naiveHandler = useMemo(() => {
    return () => {
      burnCpu(); // виконуємо важку роботу, яка імітує обробку події
      updatesRef.current += 1;
      workRunsRef.current += 1;
    };
  }, []);

  // Оптимізований обробник, який використовує requestAnimationFrame для групування оновлень.
  const optimizedHandler = useMemo(() => {
    // rafThrottle повертає функцію, яка виконує передану функцію не частіше, ніж один раз за кадр анімації.
    return rafThrottle(() => {
      burnCpu(); // виконуємо важку роботу, яка імітує обробку події
      updatesRef.current += 1;
      workRunsRef.current += 1;
    });
  }, []);

  // Функція runNaiveBurst виконує "бурю" наївних подій, обробляючи кожну подію одразу, і вимірює час виконання.
  const runNaiveBurst = async (): Promise<BurstResult> => {
    const startedAt = performance.now(); // фіксуємо час початку виконання

    // Генеруємо BURST_SIZE подій, викликаючи наївний обробник для кожної події, і збільшуємо лічильник подій.
    for (let i = 0; i < BURST_SIZE; i += 1) {
      eventsRef.current += 1;
      naiveHandler();
    }

    flushCounters();

    const endedAt = performance.now();

    return {
      events: eventsRef.current,
      updates: updatesRef.current,
      workRuns: workRunsRef.current,
      ms: endedAt - startedAt,
    };
  };

  // Функція runOptimizedBurst виконує "бурю" оптимізованих подій, використовуючи requestAnimationFrame для групування, і вимірює час виконання.
  const runOptimizedBurst = async (): Promise<BurstResult> => {
    const startedAt = performance.now(); // фіксуємо час початку виконання

    // Генеруємо BURST_SIZE подій, викликаючи оптимізований обробник для кожної події, і збільшуємо лічильник подій.
    for (let i = 0; i < BURST_SIZE; i += 1) {
      eventsRef.current += 1;
      optimizedHandler();
    }

    // Очікуємо, поки всі заплановані через RAF оновлення та важка робота виконаються, перш ніж вимірювати час.
    await new Promise<void>((resolve) => {
      // "дай усім операціям закінчитися"
      requestAnimationFrame(() => {
        // ще один RAF, щоб гарантувати, що всі оновлення та важка робота завершаться до вимірювання часу
        // "дай браузеру малювати"
        requestAnimationFrame(() => {
          resolve(); // розв’язуємо проміс, сигналізуючи про завершення обробки всіх подій та оновлень
        });
      });
    });

    flushCounters();

    const endedAt = performance.now();

    return {
      events: eventsRef.current,
      updates: updatesRef.current,
      workRuns: workRunsRef.current,
      ms: endedAt - startedAt,
    };
  };

  const handleToggleMode = () => {
    const next = mode === "naive" ? "optimized" : "naive";
    setMode(next);
    logger.info(`EventStormDemo: mode=${next}`);
  };

  // Функція handleReset скидає всі лічильники та оновлює стан, щоб почати нову серію вимірювань з чистого аркуша.
  const handleReset = () => {
    eventsRef.current = 0;
    updatesRef.current = 0;
    workRunsRef.current = 0;

    setEvents(0);
    setUpdates(0);
    setWorkRuns(0);
    setLastBurstMs(null);

    logger.info("EventStormDemo: counters reset");
  };

  // Функція handleRunBurst запускає "бурю" подій відповідно до поточного режиму (наївний або оптимізований) і оновлює метрики після завершення.
  const handleRunBurst = async () => {
    if (isRunning) {
      return;
    }

    setIsRunning(true);

    logger.info(`EventStormDemo: running ${mode} burst (${BURST_SIZE} events)`);

    const result =
      mode === "naive" ? await runNaiveBurst() : await runOptimizedBurst();

    setLastBurstMs(result.ms);

    logger.info(
      `EventStormDemo: done mode=${mode}, events=${result.events}, updates=${result.updates}, work=${result.workRuns}, duration=${result.ms.toFixed(2)} ms`,
    );

    setIsRunning(false);
  };

  return (
    <div className="event-storm-demo">
      <div className="event-storm-demo__row">
        <button
          type="button"
          className="event-storm-demo__btn event-storm-demo__btn--primary"
          onClick={handleToggleMode}
          disabled={isRunning}
        >
          Toggle mode: {mode}
        </button>

        <button
          type="button"
          className="event-storm-demo__btn event-storm-demo__btn--primary"
          onClick={handleRunBurst}
          disabled={isRunning}
        >
          Run burst ({BURST_SIZE})
        </button>

        <button
          type="button"
          className="event-storm-demo__btn event-storm-demo__btn--ghost"
          onClick={handleReset}
          disabled={isRunning}
        >
          Reset counters
        </button>

        <div className="event-storm-demo__hint">
          Naive handles every event immediately. RAF collapses many signals into
          far fewer updates and expensive work runs.
        </div>
      </div>

      <div className="event-storm-demo__metrics">
        <div className="event-storm-demo__metric">
          <div className="event-storm-demo__metric-label">Raw events</div>
          <div className="event-storm-demo__metric-value">{events}</div>
        </div>

        <div className="event-storm-demo__metric">
          <div className="event-storm-demo__metric-label">State updates</div>
          <div className="event-storm-demo__metric-value">{updates}</div>
        </div>

        <div className="event-storm-demo__metric">
          <div className="event-storm-demo__metric-label">Heavy work runs</div>
          <div className="event-storm-demo__metric-value">{workRuns}</div>
        </div>

        <div className="event-storm-demo__metric">
          <div className="event-storm-demo__metric-label">Last burst</div>
          <div className="event-storm-demo__metric-value">
            {lastBurstMs == null ? "—" : `${lastBurstMs.toFixed(2)} ms`}
          </div>
        </div>
      </div>

      <div className="event-storm-demo__hint">
        Expected result: naive ≈ 300 work runs, optimized ≪ 300 work runs.
      </div>
    </div>
  );
}

// Функція burnCpu виконує інтенсивну обчислювальну задачу, яка імітує важку роботу, що може виникати при обробці подій.
// Вона використовується для демонстрації різниці між наївним та оптимізованим підходами до обробки "бурі подій".
function burnCpu() {
  let acc = 0;

  for (let i = 0; i < 220000; i += 1) {
    acc += Math.sqrt(i % 1000);
  }

  return acc;
}
