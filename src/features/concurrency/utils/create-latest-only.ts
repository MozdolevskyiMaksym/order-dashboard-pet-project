// Це генерик, щоб працювало з будь-якою async-функцією
type LatestOnlyRunner<
  TArgs extends ReadonlyArray<unknown>,
  TResult,
> = Readonly<{
  // Обʼєкт, який повертається, має
  run: (...args: TArgs) => Promise<TResult>; // викликає функцію
  getActiveRunId: () => number; // повертає ID останнього запуску (для дебагу)
}>;

// Це обгортка над async-функцією, яка гарантує:
// Лише найновіший виклик має право повернути результат
// Старі результати будуть відхилені

// Це factory-функція
// Вона приймає будь-яку async-функцію fn і повертає обгортку з latest-only поведінкою
export default function createLatestOnly<
  TArgs extends ReadonlyArray<unknown>,
  TResult,
>(fn: (...args: TArgs) => Promise<TResult>): LatestOnlyRunner<TArgs, TResult> {
  // Це лічильник запусків
  // зберігається в замиканні (closure)
  // Живе між викликами
  let runId = 0;

  // Це нова функція, яка замінює оригінальний fn
  async function run(...args: TArgs): Promise<TResult> {
    // Крок 1: інкремент runId

    runId += 1; // кожен новий виклик run() збільшує runId
    const currentId = runId; // ID саме цього запуску

    // Крок 2: виконуємо оригінальну async-функцію
    const result = await fn(...args);
    // Тут можливі ситуації:
    // slow виклик почався першим
    // fast виклик почався другим
    // fast завершився раніше
    // slow завершився пізніше

    // Крок 3: перевірка "чи ран ще актуальний?"
    if (currentId !== runId) {
      throw new Error("Stale result ignored");
    }
    // Це головний захист
    // Що це означає?
    // якщо після старту цього виклику runId змінився,
    // значить зʼявився новіший запуск,
    // значить цей результат — застарілий

    // Тоді ми:
    // кидаємо помилку
    // не повертаємо результат
    // не дозволяємо йому оновити UI

    return result;
  }

  return {
    run,
    getActiveRunId: () => runId,
  };
}

// Повний сценарій slow vs fast

// Slow стартує першим:
// runId = 1
// currentId = 1

// Fast стартує другим:
// runId = 2
// currentId = 2

// Fast завершується першим
// currentId = 2
// runId = 2
// 2 === 2 → все ок
// fast повертає результат
// UI оновлюється

// Slow завершується другим
// currentId = 1
// runId = 2
// 1 !== 2 → stale
// кидається Error(“Stale result ignored”)

// Тобто slow не має права оновити UI.

// Це працює бо змінна runId живе в замиканні і доступна всім викликам run(). Вона є єдиним джерелом істини про те, який виклик є останнім.
