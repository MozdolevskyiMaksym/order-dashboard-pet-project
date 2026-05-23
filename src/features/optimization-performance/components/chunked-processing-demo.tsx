import { useState } from "react";
import type { Logger } from "../types";

import "./chunked-processing-demo.scss";
import { heavyCalc } from "../utils";

// Це демо показує, як можна виконувати велику кількість роботи (5 мільйонів ітерацій) без блокування UI,
// розбиваючи її на невеликі шматки і дозволяючи браузеру обробляти інші події між ними.
// Це імітує ситуацію, коли у вас є важкі обчислення або рендеринг, які потрібно виконати,
// але ви не хочете, щоб ваш інтерфейс зависав під час цього процесу.

// Загальна кількість "роботи", яку ми хочемо виконати.
// У цьому випадку це просто велика кількість ітерацій, але в реальному житті це може бути будь-яка важка задача,
// наприклад, обробка великого масиву даних або складний рендеринг.
const ITEMS = 5000000;

// Головний компонент демо, який приймає logger для виведення інформації про виконання.
export default function ChunkedProcessingDemo(
  props: Readonly<{ logger: Logger }>,
) {
  const [progress, setProgress] = useState(0); // Стан для відображення прогресу виконання
  const [mode, setMode] = useState<"naive" | "chunked">("chunked"); // Режим виконання: "naive" виконує все одразу, "chunked" розбиває на шматки
  const [isRunning, setIsRunning] = useState(false); // Чи виконується зараз якась задача

  // Ця функція виконує всю роботу одразу, блокуючи UI, поки не завершиться.
  const runNaive = () => {
    setIsRunning(true);
    setProgress(0);

    const t0 = performance.now(); // Запускаємо таймер для вимірювання часу виконання

    // Виконуємо важку задачу для кожного елемента.
    // Це заблокує UI, і користувач не зможе взаємодіяти з інтерфейсом, поки це не завершиться.
    for (let i = 0; i < ITEMS; i++) {
      heavyCalc(i);
      setProgress(Math.round((i / ITEMS) * 100)); // Оновлюємо прогрес, але це не буде відображатися в UI, поки цикл не завершиться
    }

    const t1 = performance.now(); // Зупиняємо таймер і виводимо час виконання в лог

    props.logger.info(`Naive done in ${(t1 - t0).toFixed(2)} ms`);
    setIsRunning(false);
  };

  // Ця функція виконує роботу порціями, дозволяючи браузеру обробляти інші події між ними.
  const runChunked = () => {
    setIsRunning(true);
    setProgress(0);

    let i = 0; // Лічильник для відстеження, скільки елементів вже оброблено
    const t0 = performance.now(); // Запускаємо таймер для вимірювання часу виконання

    // Ця функція виконує один "шматок" роботи, а потім планує наступний шматок через setTimeout,
    // що дозволяє браузеру обробляти інші події (наприклад, оновлення UI або взаємодію користувача) між шматками.
    const step = () => {
      const start = performance.now(); // Запускаємо таймер для вимірювання часу виконання поточного шматка

      // Виконуємо роботу, поки не досягнемо кінця або не вичерпаємо виділений час (наприклад, 8 ms),
      // щоб не блокувати UI надто довго.
      while (i < ITEMS && performance.now() - start < 8) {
        heavyCalc(i);
        i++;
      }

      setProgress(Math.round((i / ITEMS) * 100));

      // Якщо ми ще не обробили всі елементи, плануємо наступний шматок роботи.
      if (i < ITEMS) {
        setTimeout(step, 0); // Плануємо наступний виклик step, дозволяючи браузеру обробляти інші події між ними
      } else {
        const t1 = performance.now(); // Зупиняємо таймер і виводимо час виконання в лог
        props.logger.info(`Chunked done in ${(t1 - t0).toFixed(2)} ms`);
        setIsRunning(false);
      }
    };

    step(); // Запускаємо перший шматок роботи
  };

  return (
    <div className="chunked-demo">
      <div className="chunked-demo__row">
        <button
          className="chunked-demo__btn chunked-demo__btn--primary"
          onClick={() => setMode(mode === "naive" ? "chunked" : "naive")}
        >
          Mode: {mode}
        </button>

        <button
          className="chunked-demo__btn"
          disabled={isRunning}
          onClick={mode === "naive" ? runNaive : runChunked}
        >
          Run
        </button>

        <div className="chunked-demo__hint">
          Naive blocks UI. Chunked yields to event loop.
        </div>
      </div>

      <div className="chunked-demo__bar">
        <div
          className="chunked-demo__progress"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
