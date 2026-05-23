import React, {
  useCallback, // для мемоізації функцій, щоб їх посилання залишалося стабільним
  useLayoutEffect, // для виконання логіки одразу після commit у DOM, до paint браузера
  useMemo, // для мемоізації значень, щоб не створювати їх заново на кожен рендер
  useRef, // для зберігання змінних між рендерами без повторного рендеру
  useState,
} from "react";
import type { Logger } from "../types";

import "./rerender-demo.scss";

type CellProps = Readonly<{
  value: number; // числове значення кнопки, яке буде показано в UI
  onPick: (v: number) => void; // callback, який викликається при кліку на кнопку
  label: string; // текстова частина кнопки, наприклад "Pick"
  selected: boolean; // прапорець, чи є ця кнопка зараз вибраною
  onRender?: () => void; // необов’язковий callback, який використовується для підрахунку child rerenders
}>;

// Компонент Cell відповідає за рендер окремої кнопки. Він приймає пропси, які визначають його поведінку та вигляд.
function Cell({ value, onPick, label, selected, onRender }: CellProps) {
  onRender?.(); // викликаємо onRender, якщо він переданий, для відстеження ререндерів дочірніх компонентів

  return (
    <button
      className={`rerender-demo__btn rerender-demo__btn--ghost rerender-demo__cell-btn${
        selected ? " rerender-demo__cell-btn--active" : ""
      }`}
      onClick={() => onPick(value)} // при кліку викликаємо onPick з поточним значенням кнопки
    >
      {label}: {value}
    </button>
  );
}

// MemoCell - це оптимізована версія Cell, яка використовує React.memo для запобігання непотрібних ререндерів, якщо пропси не змінилися
const MemoCell = React.memo(Cell);

// Головний компонент RerenderDemo демонструє різницю між "наївним" підходом,
// де всі кнопки ререндеряться при оновленні батьківського компонента,
// та оптимізованим підходом з використанням React.memo та стабільних колбеків.
export default function RerenderDemo(props: Readonly<{ logger: Logger }>) {
  // Стан для відстеження поточного режиму (наївний або оптимізований),
  // вибраного елемента, кількості оновлень батьківського компонента та кількості ререндерів дочірніх компонентів
  const [mode, setMode] = useState<"naive" | "optimized">("optimized");
  const [selected, setSelected] = useState<number | null>(null); // зберігає значення вибраної кнопки
  const [parentRerenders, setParentRerenders] = useState(0); // лічильник оновлень батьківського компонента
  const [childRerenders, setChildRerenders] = useState(0); // лічильник ререндерів дочірніх компонентів

  // Генеруємо масив чисел від 1 до 180 для рендеру кнопок
  const items = useMemo(
    () => Array.from({ length: 180 }).map((_, i) => i + 1),
    [],
  );

  const isTrackingChildRendersRef = useRef(false); // реф для відстеження, чи потрібно рахувати ререндери дочірніх компонентів
  const childRenderCountRef = useRef(0); // реф для зберігання кількості ререндерів дочірніх компонентів

  // Функція для відстеження ререндерів дочірніх компонентів.
  // Вона збільшує лічильник кожного разу, коли дочірній компонент ререндериться.
  const trackChildRender = useCallback(() => {
    if (!isTrackingChildRendersRef.current) {
      return;
    }
    childRenderCountRef.current += 1; // збільшуємо лічильник ререндерів дочірніх компонентів
  }, []);

  // Використовуємо useLayoutEffect для оновлення лічильника ререндерів дочірніх компонентів після кожного оновлення батьківського
  // компонента, але до того, як браузер виконає paint. Це дозволяє точно відстежувати кількість ререндерів
  // без впливу на візуальне відображення.
  useLayoutEffect(() => {
    // Якщо ми не відстежуємо ререндери дочірніх компонентів, то нічого не робимо
    if (!isTrackingChildRendersRef.current) {
      return;
    }
    // Оновлюємо стан з кількістю ререндерів дочірніх компонентів,
    // а потім скидаємо лічильник і вимикаємо відстеження до наступного оновлення батьківського компонента
    setChildRerenders((prev) => prev + childRenderCountRef.current);
    isTrackingChildRendersRef.current = false;
  }, [parentRerenders]);

  // Функція для обробки вибору кнопки в наївному режимі.
  // Вона просто оновлює стан selected, що призводить до ререндеру всіх дочірніх компонентів.
  const onPickNaive = (value: number) => {
    setSelected(value);
  };

  // Функція для обробки вибору кнопки в оптимізованому режимі.
  // Вона мемоізована за допомогою useCallback, щоб її посилання залишалося стабільним між рендерами,
  const onPickStable = useCallback((value: number) => {
    setSelected(value);
  }, []);

  const isNaive = mode === "naive";

  // Вибираємо, яку функцію використовувати для обробки вибору кнопки, залежно від поточного режиму.
  const onPick = isNaive ? onPickNaive : onPickStable;
  // Вибираємо, який компонент використовувати для рендеру кнопок, залежно від поточного режиму.
  const Component = isNaive ? Cell : MemoCell;

  return (
    <div className="rerender-demo">
      <div className="rerender-demo__row">
        <button
          className="rerender-demo__btn rerender-demo__btn--primary"
          onClick={() => {
            // При перемиканні режиму ми просто оновлюємо стан mode, що призводить до ререндеру компонента з новими налаштуваннями.
            const next = isNaive ? "optimized" : "naive";
            setMode(next);
            props.logger.info(`RerenderDemo: mode=${next}`); // Логування зміни режиму для відстеження в Logger
          }}
        >
          Toggle mode: {mode}
        </button>

        <button
          className="rerender-demo__btn rerender-demo__btn--ghost"
          onClick={() => {
            // скидаємо лічильник ререндерів дочірніх компонентів перед оновленням батьківського компонента
            childRenderCountRef.current = 0;
            // вмикаємо відстеження ререндерів дочірніх компонентів, щоб підрахувати їх кількість після оновлення батьківського компонента
            isTrackingChildRendersRef.current = true;

            // оновлюємо стан, що призводить до ререндеру батьківського компонента і, залежно від режиму, до ререндеру дочірніх компонентів
            setParentRerenders((prev) => prev + 1);
          }}
        >
          Trigger parent update
        </button>

        <div className="rerender-demo__hint">
          Naive mode recreates unstable props, so all child buttons rerender on
          a parent update. Optimized mode uses React.memo + stable callback.
        </div>
      </div>

      <div className="rerender-demo__metrics">
        <div className="rerender-demo__metric">
          <div className="rerender-demo__metric-label">Parent rerenders</div>
          <div className="rerender-demo__metric-value">{parentRerenders}</div>
        </div>

        <div className="rerender-demo__metric">
          <div className="rerender-demo__metric-label">
            Child rerenders total
          </div>
          <div className="rerender-demo__metric-value">{childRerenders}</div>
        </div>
      </div>

      <div className="rerender-demo__panel">
        {items.map((item) => (
          <Component
            key={item}
            value={item}
            label="Pick"
            onPick={onPick}
            selected={selected === item}
            onRender={trackChildRender}
          />
        ))}
      </div>
    </div>
  );
}
