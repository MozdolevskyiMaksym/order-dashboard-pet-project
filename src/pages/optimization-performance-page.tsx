import { useMemo, useState } from "react";

import { appendLog } from "@/features/optimization-performance/utils";
import type { LogEntry } from "@/features/optimization-performance/types";
import {
  PerformanceCard,
  LiveLog,
  VirtualListDemo,
  ExpensiveFilterDemo,
  EventStormDemo,
  NetworkDemo,
  RerenderDemo,
  ChunkedProcessingDemo,
  WorkerDemo,
} from "@/features/optimization-performance/components";

import "./optimization-performance-page.scss";

export default function OptimizationPerformancePage() {
  const [log, setLog] = useState<ReadonlyArray<LogEntry>>([]);

  const logger = useMemo(() => {
    return {
      info: (text: string) => appendLog(setLog, "info", text),
      ok: (text: string) => appendLog(setLog, "ok", text),
      warn: (text: string) => appendLog(setLog, "warn", text),
      clear: () => setLog([]),
    };
  }, []);

  return (
    <div className="optimization-performance-page">
      <div className="optimization-performance-page__header">
        <h1 className="optimization-performance-page__title">
          Page performance lab
        </h1>
        <div className="optimization-performance-page__subtitle">
          Demos of runtime optimizations: virtualization, memoization, rerender
          reduction, event throttling, and network dedup/cancel patterns.
        </div>

        <div className="optimization-performance-page__header-actions">
          <button
            type="button"
            className="optimization-performance-page__btn optimization-performance-page__btn--ghost"
            onClick={() => logger.clear()}
          >
            Clear log
          </button>
        </div>
      </div>

      <div className="optimization-performance-page__grid optimization-performance-page__grid--two">
        <PerformanceCard
          title="A) Rendering huge lists"
          subtitle="Naive render of thousands of rows vs virtualized windowing (render only visible items)."
          badge={{ text: "Virtualization", variant: "neutral" }}
        >
          {/* Демонструє віртуалізацію для рендеру великих списків, відображаючи лише видимі елементи */}
          <VirtualListDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="B) Expensive computations"
          subtitle="Avoid recomputing heavy transforms on every input; use memoization + debounced input."
          badge={{ text: "Memoization", variant: "neutral" }}
        >
          {/* Показує мемоізацію для уникнення перераховування складних трансформацій на кожен ввід */}
          <ExpensiveFilterDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="C) Unnecessary re-renders"
          subtitle="Stabilize props and split state. Compare naive vs memoized child grid."
          badge={{ text: "React render", variant: "neutral" }}
        >
          {/* Демонструє як стабілізація props і мемоізація зменшують непотрібні перерендери */}
          <RerenderDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="D) Event storm"
          subtitle="Mousemove/scroll can trigger hundreds of updates per second. Use raf-throttle to cap work per frame."
          badge={{ text: "Throttling", variant: "neutral" }}
        >
          {/* Показує дросселювання подій для обмеження кількості оновлень per frame */}
          <EventStormDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="E) Network: dedup + cancel"
          subtitle="Singleflight deduplicates identical in-flight requests. Latest-only prevents stale UI updates."
          badge={{ text: "Network", variant: "neutral" }}
        >
          {/* Демонструє дедублікацію запитів і скасування застарілих API викликів */}
          <NetworkDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="F) Browser rendering optimization"
          subtitle="Use CSS content-visibility for large offscreen sections so the browser can skip unnecessary rendering work until content enters the viewport."
          badge={{ text: "CSS rendering", variant: "neutral" }}
        >
          {/* Використовує CSS content-visibility для пропуску рендеринга елементів поза вікном */}
          <ChunkedProcessingDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="G) Web Worker offloading"
          subtitle="Move CPU-heavy work off the main thread to keep UI responsive during long computations."
          badge={{ text: "Worker", variant: "neutral" }}
        >
          {/* Переносить важкі обчислення у Web Worker щоб UI залишався responsive */}
          <WorkerDemo logger={logger} />
        </PerformanceCard>

        <PerformanceCard
          title="Live log"
          subtitle="Shows timings and what is happening during demos."
          badge={{ text: "Observability", variant: "success" }}
        >
          {/* Виводить логи із часовими мітками для спостереження за відбіжниками дем */}
          <LiveLog entries={log} />
        </PerformanceCard>
      </div>
    </div>
  );
}
