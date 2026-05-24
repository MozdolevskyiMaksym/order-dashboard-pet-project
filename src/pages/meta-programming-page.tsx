import { useMemo, useRef, useState } from "react";
import {
  bigSumWork, // важка функція
  createFakeApi, // функція для створення мок API з випадковими даними замовлень
  createLoggedProxy, // функція для створення проксі, який логуватиме виклики методів об’єкта
  createTypedEmitter, // функція для створення типізованого еммітера подій
  memoize, // функція для створення мемоізованої версії важкої функції
  stableStringify, // функція для створення стабільного рядкового представлення об’єкта
} from "@/features/meta-programming/utils";
import type {
  MetaProgrammingEvents,
  MetaProgrammingLogEntry,
} from "@/features/meta-programming/types";
import type { Order, OrderStatus } from "@/shared/types/order";
import { ALL_STATUSES } from "@/features/orders/constants";

import "./meta-programming-page.scss";

export default function MetaProgramming() {
  // Accordion state for type-level block
  const [typeAccordionOpen, setTypeAccordionOpen] = useState(true);
  // Створення typed emitter для демонстрації подій (наприклад, завантаження замовлень, помилки)
  // Створюється type-safe pub/sub
  // Generic гарантує правильні payload типи
  // Створюється один раз
  const emitter = useMemo(
    () => createTypedEmitter<MetaProgrammingEvents>(),
    [],
  );

  // Зберігає лог записів
  const [logs, setLogs] = useState<ReadonlyArray<MetaProgrammingLogEntry>>([]);

  // Результати demo
  const [proxyResult, setProxyResult] = useState<string>("");
  const [memoResult, setMemoResult] = useState<string>("");

  // Loading стани
  const [isProxyLoading, setIsProxyLoading] = useState<boolean>(false);
  const [isMemoLoading, setIsMemoLoading] = useState<boolean>(false);

  // Фільтр статусів
  const [statuses, setStatuses] = useState<ReadonlyArray<OrderStatus>>([
    "new",
    "processing",
  ]);

  // Скільки разів запускати memo benchmark
  const [memoRuns, setMemoRuns] = useState<number>(5);

  // Зберігає dataset без перерендеру
  const ordersRef = useRef<ReadonlyArray<Order>>([]);

  // Об’єкт логера
  const logger = useMemo(() => {
    return {
      log: (message: string) => {
        // Додає новий лог зверху. Обрізає до 60 записів.
        setLogs((prev) =>
          [
            {
              id: `log_${Date.now()}_${Math.random().toString(16).slice(2)}`,
              ts: new Date().toLocaleTimeString(),
              text: message,
            },
            ...prev,
          ].slice(0, 60),
        );
      },
    };
  }, []);

  // Створення API. Мок API.
  const api = useMemo(() => createFakeApi(), []);

  // Proxy wrapper
  // Це runtime метапрограмування
  // Ми НЕ змінюємо api, а обгортаємо його в проксі, який додає логування та вимірювання часу
  const loggedApi = useMemo(() => {
    // createLoggedProxy приймає об’єкт і повертає його ж, але обгорнутий у Proxy, який перехоплює виклики методів для логування
    return createLoggedProxy(api, {
      label: "DemoApi", // мітка для логів, щоб було зрозуміло, звідки вони
      logger, // наш кастомний логер, який додає записи в стан
      includeArgs: true, // включати аргументи у логування
    });
  }, [api, logger]);

  // Memoize wrapper, який обгортає важку функцію.
  // Це теж runtime метапрограмування, але вже на рівні окремої функції
  const memoizedHeavySum = useMemo(() => {
    return memoize(
      (orders: ReadonlyArray<Order>) => bigSumWork(orders), // важка функція, яка сумує щось по замовленнях (наприклад, загальну вартість),
      {
        // keyFn створює стабільний ключ
        // Він бере аргументи функції і перетворює їх у рядок, який використовується для зберігання результату в кеші
        keyFn: (args) => stableStringify(args),
        maxEntries: 50, // обмежує розмір кешу, щоб не займати забагато пам’яті
      },
    );
  }, []);

  useMemo(() => {
    // Підписуємося на події від emitter
    const offLoaded = emitter.on("orders:loaded", ({ count, source }) => {
      logger.log(`[Emitter] orders:loaded count=${count} source=${source}`);
    });

    // Підписуємося на помилки
    const offErrors = emitter.on("error", ({ message }) => {
      logger.log(`[Emitter] error message="${message}"`);
    });

    return () => {
      // Відписуємося при розмонтуванні компонента
      offLoaded();
      offErrors();
    };
  }, [emitter, logger]);

  // Функція для перемикання статусів у фільтрі. Додає або видаляє статус зі списку.
  const toggleStatus = (status: OrderStatus) => {
    setStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((prevStatus) => prevStatus !== status);
      }
      return [...prev, status];
    });
  };

  // Функція для запуску демонстрації Proxy. Вона викликає метод API, який обгорнутий у проксі, і обробляє результат або помилку.
  const runProxyDemo = async () => {
    // Скидаємо результат і ставимо статус завантаження
    setIsProxyLoading(true);
    setProxyResult("");

    try {
      // Викликаємо метод API через проксі. Він автоматично логуватиме виклик, аргументи, час виконання та помилки.
      const data = await loggedApi.fetchOrders({
        statuses: statuses.length > 0 ? statuses : undefined,
      });
      // Зберігаємо отримані замовлення в рефі, щоб не викликати перерендер компонента при їх зміні
      ordersRef.current = data;

      // Емітуємо подію про завантаження замовлень, щоб показати, як працює typed emitter
      emitter.emit("orders:loaded", { count: data.length, source: "proxy" });

      // Встановлюємо результат у вигляді JSON з кількістю отриманих замовлень і прикладом перших трьох
      setProxyResult(
        JSON.stringify(
          {
            fetched: data.length,
            sample: data.slice(0, 3),
          },
          null, // форматування JSON з відступами для кращої читабельності
          2, // 2 пробіли для відступу
        ),
      );
    } catch (e) {
      // Якщо сталася помилка, отримуємо її повідомлення і емітуємо подію про помилку. Також встановлюємо результат з текстом помилки.
      const message = e instanceof Error ? e.message : "Unknown error";
      emitter.emit("error", { message });
      setProxyResult(`Error: ${message}`);
    } finally {
      // Скидаємо статус завантаження
      setIsProxyLoading(false);
    }
  };

  // Функція для запуску демонстрації Memoization
  // Вона викликає обгорнуту у memoize важку функцію кілька разів і збирає статистику про час виконання та кеш
  const runMemoDemo = () => {
    // Скидаємо результат і ставимо статус виконання
    setIsMemoLoading(true);
    setMemoResult("");

    try {
      const orders = ordersRef.current;

      // Якщо немає замовлень, показуємо повідомлення і не запускаємо бенчмарк
      if (orders.length === 0) {
        setMemoResult(
          "No dataset yet. Run the Proxy demo first to fetch orders.",
        );
        return;
      }

      // Масив для зберігання часу виконання кожного запуску
      const times: number[] = [];

      // Запускаємо memoized функцію кілька разів, щоб побачити ефект кешування. Перші виклики будуть повільними (кешу немає),
      // а наступні - швидкими (кеш працює)
      let last = 0; // змінна для збереження останнього результату, щоб показати його в результаті

      // Виконуємо бенчмарк задану кількість разів
      for (let i = 0; i < memoRuns; i += 1) {
        // Вимірюємо час виконання memoized функції
        const start = performance.now();

        // Викликаємо memoized функцію з поточним набором замовлень.
        // Вона поверне результат з кешу, якщо такий є, або виконає важку роботу і збереже результат у кеші.
        last = memoizedHeavySum(orders);

        // Вимірюємо час після виконання і зберігаємо тривалість у масиві times
        const end = performance.now();
        // Час виконання в мілісекундах
        times.push(end - start);
      }

      // Емітуємо подію про завантаження замовлень, щоб показати, що ми працюємо з тим самим dataset і можемо відстежувати його використання в різних частинах програми
      emitter.emit("orders:loaded", {
        count: orders.length,
        source: "memoize",
      });

      // Встановлюємо результат у вигляді JSON з кількістю запусків, статистикою кешу (розмір, хіти, міси)
      // та часами виконання кожного запуску. Також показуємо останній результат для наочності.
      setMemoResult(
        JSON.stringify(
          {
            runs: memoRuns, // скільки разів ми запускали функцію
            cacheSize: memoizedHeavySum.cacheSize(), // скільки записів зараз у кеші
            cacheHits: memoizedHeavySum.cacheHits(), // скільки разів результат був отриманий з кешу
            cacheMisses: memoizedHeavySum.cacheMisses(), // скільки разів результат не був у кеші і функція виконувалась повністю
            timesMs: times.map((t) => Number(t.toFixed(2))), // часи виконання кожного запуску, округлені до 2 знаків після коми для кращої читабельності
            lastResult: Number(last.toFixed(2)), // останній результат, округлений для наочності
          },
          null, // форматування JSON з відступами для кращої читабельності
          2, // 2 пробіли для відступу
        ),
      );
    } catch (e) {
      // Якщо сталася помилка, отримуємо її повідомлення і емітуємо подію про помилку.
      // Також встановлюємо результат з текстом помилки.
      const msg = e instanceof Error ? e.message : "Unknown error";
      emitter.emit("error", { message: msg });
      setMemoResult(`Error: ${msg}`);
    } finally {
      // Скидаємо статус виконання
      setIsMemoLoading(false);
    }
  };

  const handleMemoRunsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = Number(e.target.value);
    if (Number.isFinite(number)) {
      setMemoRuns(Math.max(1, Math.min(30, Math.floor(number))));
    }
  };

  // Функція для очищення логів.
  // Вона просто скидає масив логів у стані, що призводить до оновлення UI і показу порожнього лог-екрана.
  const clearLogs = () => {
    setLogs([]);
  };

  const clearMemoCache = () => {
    memoizedHeavySum.cacheClear();
    setMemoResult("");
    logger.log("[Memoize] cache cleared");
  };

  // Код для демонстрації type-level метапрограмування. Це не виконується в рантаймі,
  // а служить прикладом того, як можна використовувати TypeScript для створення складних типів, які трансформують інші типи.
  const typeLevelSnippet = useMemo(() => {
    // Це просто рядок з кодом, який буде показаний у UI.
    // Він демонструє різні типи, які можна створити за допомогою TypeScript для покращення безпеки та зручності розробки.
    return `// Type-level metaprogramming examples (TypeScript)
type Brand<T, Name extends string> = T & { __brand: Name };

type UserId = Brand<string, "UserId">;
type OrderId = string;

const param1: UserId = "id1";
const param2: OrderId = "id2";

const implementSomeLogic = (userId: UserId) => {
  // some logic here
}

implementSomeLogic(param1); // Ok
implementSomeLogic(param2); // Error: Type 'OrderId' is not assignable to type 'UserId'

const implementSomeLogic2 = (orderId: OrderId) => {
  // some logic here
}

implementSomeLogic2(param1); // Логічно помилка, але для Typescript це Ok тому що UserId це string, який сумісний з OrderId
implementSomeLogic2(param2); // Ok

type User = {
  id: UserId;
  name: string;
  role: "admin" | "user";
  profile: {
    email: string;
    age: number;
  };
};

------------------------------------------------------------------------------------------------------------------

// DeepReadonly makes the whole structure immutable

type User = {
  id: string;
  name: string;
  profile: {
    email: string;
    age: number;
  };
  roles: string[];
};
type UserReadonly = DeepReadonly<User>;

const user: UserReadonly = {
  id: "1",
  name: "Max",
  profile: {
    email: "max@test.com",
    age: 28,
  },
  roles: ["admin"],
};

user.name = "Alex";
// Error: Cannot assign to 'name' because it is a read-only property.

user.profile.age = 29;
// Error: Cannot assign to 'age' because it is a read-only property.

user.roles.push("manager");
// Error: Property 'push' does not exist on type 'readonly string[]'.

------------------------------------------------------------------------------------------------------------------

// DeepPartial allows partial updates (patch DTO)

type User = {
  id: string;
  name: string;
  profile: {
    email: string;
    age: number;
    address: {
      city: string;
      street: string;
    };
  };
  roles: string[];
};

type UserPatch = DeepPartial<User>;

const updateUser = (data: User) => {};

updateUser({
  profile: {
    age: 29,
  },
});

// Error: не вистачає id, name, profile.email, profile.address, roles і т.д.

З DeepPartial можна передати тільки те, що реально хочеш змінити:

const updateUser = (data: UserPatch) => {};

updateUser({
  profile: {
    age: 29,
  },
});

------------------------------------------------------------------------------------------------------------------

// PickByValue extracts only fields of a given value type

Тут поля різних типів
type Profile = {
  email: string;
  age: number;
  rating: number;
  isVerified: boolean;
};

Якщо ми пишемо:
type NumericFields = PickByValue<Profile, number>;
Тому в цьому типі будуть тільки ті поля з Profile, які мають тип number, тобто age і rating.

type NumericFields = {
  age: number;
  rating: number;
};

Це типу фільтр для типів

------------------------------------------------------------------------------------------------------------------

// TypedEmitter makes events type-safe:
type Events = {
  "user:updated": { id: UserId; patch: UserPatch };
  "error": { message: string };
};

Приклад: оновили користувача
type Events = {
  "user:updated": {
    id: string;
    name: string;
  };
};

Створюємо emitter
const emitter = createTypedEmitter<Events>();

Один модуль підписується на подію
emitter.on("user:updated", (payload) => {
  console.log("User updated:", payload.id, payload.name);
});

Інший модуль викликає подію
emitter.emit("user:updated", {
  id: "user-1",
  name: "Max",
});


Тобто один модуль каже:
“користувач оновився”,
а інший модуль реагує на це

--------------------------------

Інший приклад:

type Events = {
  "orders:loaded": {
    count: number;
    source: "api" | "cache";
  };
};

const emitter = createTypedEmitter<Events>();

emitter.on("orders:loaded", (payload) => {
  console.log('Loaded payload.count orders from payload.source');
});

emitter.emit("orders:loaded", {
  count: 25,
  source: "api",
});

Якщо написати:
emitter.emit("orders:loaded", {
  count: "25",
  source: "api",
});

TypeScript видасть помилку, бо count має бути number, а не string

TypedEmitter допомагає різним частинам коду спілкуватися через події,
але TypeScript контролює, щоб назва події і payload були правильними
`;
  }, []);

  return (
    <div className="meta-programming-page">
      <div className="meta-programming-page__header">
        <h1 className="meta-programming-page__title">Metaprogramming demo</h1>
        <div className="meta-programming-page__subtitle">
          This page demonstrates JavaScript/TypeScript metaprogramming: runtime
          behavior via Proxy/wrappers + type-level utilities (mapped/conditional
          types).
        </div>
      </div>

      <div className="meta-programming-page__card">
        <div className="meta-programming-page__card-head">
          <div className="meta-programming-page__card-title">
            Runtime: Proxy-based instrumentation
          </div>
          <div className="meta-programming-page__card-subtitle">
            We wrap an API object in a Proxy and automatically log method calls,
            arguments, durations, and errors without modifying the original
            implementation.
          </div>
        </div>

        <div className="meta-programming-page__status-row">
          <div className="meta-programming-page__status-label">Statuses:</div>

          {ALL_STATUSES.map((status) => (
            <label
              key={status}
              className="meta-programming-page__status-option"
            >
              <input
                type="checkbox"
                checked={statuses.includes(status)}
                onChange={() => toggleStatus(status)}
              />
              <span className="meta-programming-page__status-text">
                {status}
              </span>
            </label>
          ))}
        </div>

        <div className="meta-programming-page__actions">
          <button
            onClick={runProxyDemo}
            disabled={isProxyLoading}
            className="meta-programming-page__button meta-programming-page__button--primary"
          >
            {isProxyLoading ? "Loading…" : "Run proxy demo"}
          </button>

          <button
            onClick={clearLogs}
            className="meta-programming-page__button meta-programming-page__button--ghost"
          >
            Clear logs
          </button>
        </div>

        <div className="meta-programming-page__result">
          <div className="meta-programming-page__result-title">
            Proxy result
          </div>
          <pre className="meta-programming-page__result-pre">
            {proxyResult || "No result yet."}
          </pre>
        </div>
      </div>

      <div className="meta-programming-page__card">
        <div className="meta-programming-page__card-head">
          <div className="meta-programming-page__card-title">
            Runtime: Memoization wrapper
          </div>
          <div className="meta-programming-page__card-subtitle">
            We wrap a heavy function with a generic memoizer. The wrapper
            provides cache stats (hits/misses) and demonstrates how
            metaprogramming reduces repeated work.
          </div>
        </div>

        <div className="meta-programming-page__controls">
          <div className="meta-programming-page__control-label">Runs:</div>
          <input
            value={String(memoRuns)}
            onChange={handleMemoRunsChange}
            inputMode="numeric"
            className="meta-programming-page__control-input"
          />

          <button
            onClick={runMemoDemo}
            disabled={isMemoLoading}
            className="meta-programming-page__button meta-programming-page__button--primary"
          >
            {isMemoLoading ? "Running…" : "Run memo benchmark"}
          </button>

          <button
            onClick={clearMemoCache}
            className="meta-programming-page__button meta-programming-page__button--ghost"
          >
            Clear memo cache
          </button>

          <div className="meta-programming-page__tip">
            Tip: run twice with same dataset to see cache hits grow.
          </div>
        </div>

        <div className="meta-programming-page__result">
          <div className="meta-programming-page__result-title">Memo result</div>
          <pre className="meta-programming-page__result-pre">
            {memoResult || "No result yet."}
          </pre>

          <div className="meta-programming-page__note-hint">
            Cached calls should be noticeably faster. If you increase the
            dataset size in the Proxy demo (it’s random each time), the
            difference becomes more visible.
          </div>
        </div>
      </div>

      <div className="meta-programming-page__card">
        <button
          type="button"
          className="meta-programming-page__card-head meta-programming-page__accordion-header"
          onClick={() => setTypeAccordionOpen((value) => !value)}
          aria-expanded={typeAccordionOpen}
        >
          <div className="meta-programming-page__card-title">
            Type-level: mapped/conditional types{" "}
            <span
              aria-hidden="true"
              className={`meta-programming-page__accordion-arrow${typeAccordionOpen ? " meta-programming-page__accordion-arrow--open" : ""}`}
            >
              ▶
            </span>
          </div>
          <div className="meta-programming-page__card-subtitle">
            This section is TypeScript metaprogramming: types that transform
            other types. It improves safety and developer experience
            (autocomplete + compile-time guarantees).
          </div>
        </button>
        {typeAccordionOpen && (
          <>
            <pre className="meta-programming-page__code-pre">
              {typeLevelSnippet}
            </pre>
            <div className="meta-programming-page__note">
              <div className="meta-programming-page__note-title">
                Що згадати в PeeX
              </div>
              <div className="meta-programming-page__note-body">
                <div className="meta-programming-page__bullet">
                  - Proxy обгортка: cross-cutting concerns (логування/метрики)
                  без змін бізнес-логіки.
                </div>
                <div className="meta-programming-page__bullet">
                  - Memoize обгортка: функція вищого порядку, яка генерично
                  змінює runtime поведінку (кеш).
                </div>
                <div className="meta-programming-page__bullet">
                  - Type-level утиліти: забезпечення інваріантів на етапі
                  компіляції (DeepReadonly/DeepPartial/PickByValue/Brand).
                </div>
                <div className="meta-programming-page__bullet">
                  - Типізований event emitter: type-safe pub/sub
                  (метапрограмування через generic обмеження).
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="meta-programming-page__card">
        <div className="meta-programming-page__card-title">Live log</div>
        <div className="meta-programming-page__card-subtitle">
          This is produced automatically by Proxy + typed emitter.
        </div>

        <div className="meta-programming-page__log">
          {logs.length === 0 ? (
            <div className="meta-programming-page__log-empty">No logs yet.</div>
          ) : (
            <div className="meta-programming-page__log-list">
              {logs.map(({ id, ts, text }) => (
                <div key={id} className="meta-programming-page__log-item">
                  <div className="meta-programming-page__log-time">{ts}</div>
                  <div className="meta-programming-page__log-text">{text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="meta-programming-page__log-footer">
          Last proxy call time is visible in log lines like: <b>123.45 ms</b>
        </div>
      </div>
    </div>
  );
}
