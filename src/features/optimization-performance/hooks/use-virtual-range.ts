// Цей хук просто обчислює, що саме зараз видно
import { useMemo } from "react";

export type VirtualRange = Readonly<{
  start: number;
  end: number;
  offsetTop: number;
}>;

export default function useVirtualRange({
  count,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan,
}: Readonly<{
  count: number; // скільки всього елементів у списку
  rowHeight: number; // висота рядка
  viewportHeight: number; // висота видимої частини списка
  scrollTop: number; // скільки пікселей прокрутили вниз
  overscan: number; // запас строк знизу і зверху(щоб не було видно, що рендер відстає від скролу, щоб скрол був плавнішим)
}>): VirtualRange {
  return useMemo(() => {
    // Якщо дані некоректні, поки контейнер ще не виміряний, нічого не рендеримо
    if (count <= 0 || rowHeight <= 0 || viewportHeight <= 0) {
      return { start: 0, end: 0, offsetTop: 0 };
    }

    // Це номер першого видимого рядка без overscan(без запасу)
    const rawStart = Math.floor(scrollTop / rowHeight);

    // Скільки рядків реально поміщається у viewport
    const visible = Math.ceil(viewportHeight / rowHeight);

    // Починаємо трохи раніше рендерити в DOM, ніж реально видно, щоб скрол був плавнішим
    const start = Math.max(0, rawStart - overscan);

    // Закінчуємо трохи пізніше
    const end = Math.min(count, rawStart + visible + overscan);

    // На скільки треба зсунути видимий шматок вниз усередині spacer щоб перший видимий ряд був на своєму місці
    const offsetTop = start * rowHeight;

    return { start, end, offsetTop };
  }, [count, rowHeight, viewportHeight, scrollTop, overscan]);
}

// Простий приклад

// Уявімо:
// 	count = 12000
// 	rowHeight = 34
// 	viewportHeight = 340
// 	scrollTop = 680
// 	overscan = 8

// Тоді:

// rawStart(старт без запасу)
// 680 / 34 = 20

// visible
// 340 / 34 = 10

// start(з запасом)
// 20 - 8 = 12

// end(з запасом)
// 20 + 10 + 8 = 38

// offsetTop(на скільки зсунути вниз щоб 12-й ряд був першим видимим)
// 12 * 34 = 408

// Тобто:
// 	в DOM не буде 12000 рядків
// 	буде тільки items[12..38]
// 	а контейнер з ними буде зсунутий вниз на 408px

// У чому головна різниця між naive і virtual

// Naive (rows.map(...))
// 	рендерить всі 12 000 елементів
// 	великий DOM
// 	важкий initial render
// 	поганий scroll performance

// Virtual (slice.map(...))
// рендерить тільки 20–40 елементів
// 	DOM маленький
// 	scroll плавніший
// 	page performance набагато краща
