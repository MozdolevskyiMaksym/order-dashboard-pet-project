// Це демо показує, як можна оптимізувати фільтрацію великого набору даних з дорогими обчисленнями,
// використовуючи useMemo для попередньої обробки та useDeferredValue для відкладеного оновлення результатів пошуку.

import { useDeferredValue, useMemo, useState } from "react";
import type { Logger } from "../types";

import "./expensive-filter-demo.scss";

// Це тип одного елемента в наборі даних
type Item = Readonly<{
  id: string;
  name: string;
  amount: number;
  city: string;
}>;

// Тип елемента після expensive preprocessing
// expensive preprocessing - це коли ми рахуємо важкий score для кожного item, який не залежить від запиту, а тільки від amount
type ScoredItem = Item &
  Readonly<{
    score: number; // Це результат дорогого обчислення, який залежить від amount та фіксованого seed
    searchable: string; // Це поле, яке містить текст для пошуку (наприклад, name + city), і також не залежить від запиту
  }>;

// Тип результату пошуку, який показує самі результати та метрики по часу виконання,
// кількості дорогих обчислень, ефективному запиту та чи було оновлення відкладеним
type DemoResult = Readonly<{
  response: ReadonlyArray<ScoredItem>; // Відфільтровані та відсортовані результати пошуку
  ms: number; // Скільки часу зайняв пошук у мілісекундах
  expensiveRuns: number; // Скільки разів було виконано дороге обчислення (heavyScore) для всього набору даних
  effectiveQuery: string; // Який запит реально був використаний для фільтрації (для оптимізованого варіанту це може бути відкладений query)
  deferred: boolean; // Чи було оновлення результатів відкладеним через useDeferredValue
}>;

// Це головний компонент, який відповідає за керування режимами пошуку (naive та optimized),
// кількістю елементів у наборі даних та відображення інтерфейсу для керування цими параметрами,
// а також за рендеринг відповідного компонента пошуку залежно від вибраного режиму
export default function ExpensiveFilterDemo(
  props: Readonly<{ logger: Logger }>,
) {
  const [count, setCount] = useState(20000); // Скільки елементів генерувати у наборі даних, за замовчуванням 20 000
  const [query, setQuery] = useState(""); // Поточний запит, який вводить користувач для пошуку
  const [mode, setMode] = useState<"naive" | "optimized">("optimized"); // Який режим пошуку показувати: naive (без оптимізацій) чи optimized (з оптимізаціями)

  // Генеруємо набір даних з count елементів за допомогою функції makeItems,
  // і використовуємо useMemo, щоб не генерувати заново при кожному рендері, а тільки коли змінюється count

  const items = useMemo(() => makeItems(count), [count]);

  // Ця функція обробляє перемикання режимів пошуку, оновлюючи стан mode та логуючи інформацію про новий режим
  const handleToggleMode = () => {
    const nextMode = mode === "naive" ? "optimized" : "naive";
    setMode(nextMode);
    props.logger.info(`ExpensiveFilterDemo: mode=${nextMode}`);
  };

  // Ця функція обробляє зміну кількості елементів у наборі даних, оновлюючи стан count та логуючи інформацію про нову кількість
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = Number(e.target.value);

    // Перевіряємо, чи введене значення є числом, і якщо так, то оновлюємо count,
    // обмежуючи його від 5 000 до 50 000 та округляючи до цілого числа
    if (Number.isFinite(number)) {
      const nextCount = Math.max(5000, Math.min(50000, Math.floor(number)));
      setCount(nextCount);
      props.logger.info(
        `ExpensiveFilterDemo: count=${nextCount.toLocaleString()}`,
      );
    }
  };

  return (
    <div className="expensive-filter-demo">
      <div className="expensive-filter-demo__row">
        <button
          type="button"
          className="expensive-filter-demo__btn expensive-filter-demo__btn--primary"
          onClick={handleToggleMode}
        >
          Toggle mode: {mode}
        </button>

        <input
          className="expensive-filter-demo__input"
          placeholder="Search by order or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)} // Оновлюємо стан query при зміні вхідного поля, що викликає перерендер та оновлення результатів пошуку
        />

        <input
          className="expensive-filter-demo__input"
          value={String(count)}
          inputMode="numeric"
          onChange={handleCountChange}
        />
      </div>

      <div className="expensive-filter-demo__hint">
        Naive mode recalculates heavy score for the whole dataset on every
        keystroke. Optimized mode precomputes expensive data once and filters it
        using deferred input to keep typing responsive.
      </div>

      <div className="expensive-filter-demo__metrics">
        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">Dataset</div>
          <div className="expensive-filter-demo__metric-value">
            {items.length}
          </div>
        </div>

        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">Mode</div>
          <div className="expensive-filter-demo__metric-value">{mode}</div>
        </div>

        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">Typed query</div>
          <div className="expensive-filter-demo__metric-value">
            {/* Показуємо ефективний запит, який був використаний для фільтрації, або "—", якщо запит порожній */}
            {query || "—"}
          </div>
        </div>
      </div>

      {mode === "naive" ? (
        // Виводимо компонент NaiveSearch, який виконує пошук без оптимізацій,
        // що може призвести до повільної роботи при великій кількості елементів та складних запитах
        <NaiveSearch items={items} query={query} />
      ) : (
        // Виводимо компонент OptimizedSearch, який виконує пошук з оптимізаціями,
        // використовуючи попередню обробку та відкладене оновлення, що дозволяє зберегти інтерфейс більш чуйним при наборі запиту
        <OptimizedSearch items={items} query={query} />
      )}
    </div>
  );
}

// Функція для генерації великого набору даних з випадковими назвами, сумами та містами
function makeItems(count: number): ReadonlyArray<Item> {
  const cities = ["Kyiv", "Lviv", "Odesa", "Dnipro", "Kharkiv", "Poltava"];
  const items = []; // Тут ми будемо зберігати згенеровані елементи

  // Генеруємо count елементів, кожен з унікальним id, назвою, сумою та містом
  for (let i = 0; i < count; i += 1) {
    items.push({
      id: `it_${i}`,
      name: `Order ${i + 1}`,
      amount: Math.round(10 + ((i * 19) % 9500)),
      city: cities[i % cities.length], // Просто циклічно призначаємо міста з масиву
    });
  }

  return items;
}

// Ця функція імітує дороге обчислення, яке залежить від amount та деякого seed (який може бути довжиною запиту)
// seed - це просто число, яке ми використовуємо для того, щоб результат залежав від запиту,
// але був стабільним для однакових вхідних даних
function heavyScore(amount: number, seed: number): number {
  let x = amount + seed; // Це просто щоб залежало від amount та seed, але було стабільним для однакових вхідних даних
  let acc = 0; // Імітуємо дороге обчислення, яке виконує багато ітерацій та математичних операцій

  // Чим більше seed, тим довше виконується обчислення, що імітує ситуацію, коли результат залежить від запиту
  for (let i = 0; i < 900; i += 1) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    acc += Math.sqrt((x % 10000) + 1) * 0.0007;
  }

  return acc;
}

// Цей компонент відповідає за відображення результатів пошуку та метрик по продуктивності
function ResultView({ result }: Readonly<{ result: DemoResult }>) {
  return (
    <>
      <div className="expensive-filter-demo__metrics">
        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">Typed query</div>
          <div className="expensive-filter-demo__metric-value">
            {/* Показуємо ефективний запит, який був використаний для фільтрації, або "—", якщо запит порожній */}
            {result.effectiveQuery ? `"${result.effectiveQuery}"` : "—"}
          </div>
        </div>

        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">
            Compute time
          </div>
          <div className="expensive-filter-demo__metric-value">
            {/* Показуємо, скільки часу зайняв пошук у мілісекундах, з двома знаками після коми */}
            {result.ms.toFixed(2)} ms
          </div>
        </div>

        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">
            {/* Показуємо, скільки разів було виконано дороге обчислення для всього набору даних
            (у naive режимі це буде дорівнювати довжині вхідного масиву, а в оптимізованому режимі це буде 0,
            бо ми рахуємо score тільки один раз під час підготовки) */}
            Expensive runs
          </div>
          <div className="expensive-filter-demo__metric-value">
            {result.expensiveRuns.toLocaleString()}
          </div>
        </div>

        <div className="expensive-filter-demo__metric">
          <div className="expensive-filter-demo__metric-label">Deferred</div>
          <div className="expensive-filter-demo__metric-value">
            {/* Показуємо, чи було оновлення результатів відкладеним через useDeferredValue
            (у naive режимі це завжди "no", а в оптимізованому режимі це буде "yes",
            якщо deferredQuery відрізняється від props.query) */}
            {result.deferred ? "yes" : "no"}
          </div>
        </div>
      </div>

      <div className="expensive-filter-demo__panel">
        <div className="expensive-filter-demo__panel-title">Top results</div>

        <div className="expensive-filter-demo__results">
          {/* Показуємо перші 15 результатів пошуку (хоча в результаті може бути до 80 елементів,
          ми показуємо тільки топ 15 для наочності) */}
          {result.response.slice(0, 14).map((item) => (
            <div key={item.id} className="expensive-filter-demo__row-item">
              <div>
                {item.name} · {item.city}
              </div>

              <div className="expensive-filter-demo__kbd">
                {item.score.toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// Цей компонент відповідає за логіку пошуку у naive та optimized режимах,
// а також за відображення інтерфейсу для керування режимами та кількістю елементів
function NaiveSearch({
  query,
  items,
}: Readonly<{ items: ReadonlyArray<Item>; query: string }>) {
  const result = useMemo<DemoResult>(() => {
    const t0 = performance.now(); // Починаємо вимірювати час виконання пошуку
    const normalizedQuery = query.trim().toLowerCase(); // Нормалізуємо запит для пошуку (видаляємо зайві пробіли та приводимо до нижнього регістру)

    // Тут ми проходимо по всьому масиву items, для кожного item рахуємо дорогий score за допомогою heavyScore,
    // формуємо поле searchable для фільтрації, потім фільтруємо за запитом, сортуємо за score та беремо топ 80 результатів

    const response = items
      .map((item) => ({
        ...item,
        score: heavyScore(item.amount, normalizedQuery.length + 1), // Рахуємо дорогий score для кожного item, використовуючи довжину запиту як seed, щоб результат залежав від запиту
        searchable: `${item.name} ${item.city}`.toLowerCase(), // Формуємо поле searchable для фільтрації, яке містить name та city в нижньому регістрі
      }))
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return item.searchable.includes(normalizedQuery);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 80); // Після сортування беремо тільки топ 80 результатів, щоб не показувати занадто багато елементів у результаті

    const t1 = performance.now(); // Закінчуємо вимірювання часу виконання пошуку

    // Повертаємо результат пошуку разом з метриками по часу виконання,
    // кількості дорогих обчислень (яка дорівнює довжині вхідного масиву,
    // бо ми рахуємо score для кожного item), ефективному запиту та чи було оновлення відкладеним
    // (у naive режимі це завжди false)
    return {
      response,
      ms: t1 - t0,
      expensiveRuns: items.length,
      effectiveQuery: query,
      deferred: false, // У naive режимі оновлення не відкладене, тому це завжди false
    };
  }, [items, query]);

  return <ResultView result={result} />; // Відображаємо результати пошуку та метрики за допомогою ResultView
}

// Цей компонент відповідає за логіку пошуку у naive та optimized режимах,
// а також за відображення інтерфейсу для керування режимами та кількістю елементів
function OptimizedSearch({
  query,
  items,
}: Readonly<{ items: ReadonlyArray<Item>; query: string }>) {
  // input оновлюється миттєво при наборі, а ui оновлюється з затримкою
  const deferredQuery = useDeferredValue(query); // Використовуємо useDeferredValue для отримання відкладеного значення запиту, яке оновлюється з затримкою, щоб не блокувати інтерфейс під час набору

  // Тут ми використовуємо useMemo для попередньої обробки вхідного масиву items,
  // де для кожного item рахуємо дорогий score за допомогою heavyScore (з фіксованим seed, щоб не залежало від запиту),
  // формуємо поле searchable для фільтрації та сортуємо за score
  // Ця обробка виконується тільки тоді, коли змінюється вхідний масив items, і не залежить від запиту, тому вона не виконується на кожен рендер
  // Етап 1: expensive preprocessing - цей код залежить тільки від items, тому він виконується тільки тоді, коли змінюється вхідний масив, і не залежить від запиту(query)
  const preparedItems = useMemo<ReadonlyArray<ScoredItem>>(() => {
    return items
      .map((item) => ({
        ...item,
        score: heavyScore(item.amount, 1),
        searchable: `${item.name} ${item.city}`.toLowerCase(),
      }))
      .sort((a, b) => b.score - a.score);
  }, [items]);

  // Тут ми використовуємо useMemo для фільтрації та сортування під час пошуку,
  // але це виконується вже над підготовленим масивом preparedItems,
  // і залежить від deferredQuery, тому він оновлюється з затримкою,
  // коли користувач набирає запит, що дозволяє зберегти інтерфейс більш чуйним

  // Етап 2: cheap filtering.
  // Коли змінюється query, тут відбувається тільки filter, slice. Немає heavyScore, повторного map для expansive score, повторного sort
  const result = useMemo<DemoResult>(() => {
    const t0 = performance.now(); // Починаємо вимірювати час виконання пошуку
    const q = deferredQuery.trim().toLowerCase(); // Нормалізуємо відкладений запит для пошуку (видаляємо зайві пробіли та приводимо до нижнього регістру)

    // Тут ми проходимо по вже підготовленому масиву preparedItems, фільтруємо за запитом та беремо топ 80 результатів
    const response = preparedItems
      .filter((item) => {
        if (!q) {
          return true;
        }

        return item.searchable.includes(q);
      })
      .slice(0, 80);

    const t1 = performance.now(); // Закінчуємо вимірювання часу виконання пошуку

    // Повертаємо результат пошуку разом з метриками по часу виконання,
    // кількості дорогих обчислень (яка дорівнює довжині вхідного масиву preparedItems,
    // бо ми рахуємо score для кожного item під час підготовки), ефективному запиту та чи було оновлення відкладеним
    // (у оптимізованому режимі це true, якщо deferredQuery відрізняється від query)
    return {
      response,
      ms: t1 - t0,
      expensiveRuns: 0,
      effectiveQuery: deferredQuery,
      deferred: query !== deferredQuery,
    };
  }, [preparedItems, deferredQuery, query]);

  return <ResultView result={result} />;
}

// тобто різниця між двома режимами полягає в тому, що у naive режимі ми рахуємо дорогий score для кожного item на кожен рендер,
// що робить пошук повільним при великій кількості елементів та складних запитах,
// а в оптимізованому режимі ми рахуємо дорогий score тільки один раз під час підготовки, і потім просто фільтруємо вже підготовлений масив,
// що значно покращує продуктивність при наборі запиту, особливо якщо використовувати useDeferredValue для відкладеного оновлення результатів пошуку.
// У результаті ми отримуємо, що у naive режимі кількість дорогих обчислень дорівнює довжині вхідного масиву при кожному рендері,
// а в оптимізованому режимі кількість дорогих обчислень дорівнює довжині вхідного масиву тільки один раз під час підготовки, і 0 при фільтрації,
// що робить його набагато швидшим при великих наборах даних та складних запитах.
// Також у оптимізованому режимі ми показуємо, чи було оновлення результатів відкладеним через useDeferredValue,
// що дозволяє зберегти інтерфейс більш чуйним при наборі запиту, тоді як у naive режимі оновлення не відкладене,
// і це може призвести до затримок та поганої продуктивності при великих наборах даних та складних запитах.
