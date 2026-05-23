import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualRange } from "../hooks";

import "./virtual-list.scss";

export default function VirtualList<T>({
  items,
  rowHeight,
  overscan = 6,
  renderRow,
  className,
}: Readonly<{
  items: ReadonlyArray<T>;
  rowHeight: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  className?: string;
}>) {
  const rootRef = useRef<HTMLDivElement | null>(null); // Посилання на кореневий елемент списку для вимірювання та обробки прокрутки
  const [viewportHeight, setViewportHeight] = useState(0); // Висота видимої області списку
  const [scrollTop, setScrollTop] = useState(0); // Поточна вертикальна прокрутка списку

  useLayoutEffect(() => {
    const element = rootRef.current;

    if (!element) {
      return;
    }

    // Використовуємо ResizeObserver для відстеження змін розміру кореневого елемента та оновлення висоти видимої області
    const resizeObserver = new ResizeObserver(() => {
      setViewportHeight(element.clientHeight);
    });

    resizeObserver.observe(element); // Починаємо спостереження за змінами розміру елемента
    setViewportHeight(element.clientHeight); // Встановлюємо початкову висоту видимої області

    return () => {
      resizeObserver.disconnect(); // Зупиняємо спостереження при розмонтуванні компонента
    };
  }, []);

  // Використовуємо кастомний хук useVirtualRange для обчислення діапазону видимих елементів на основі поточної прокрутки та висоти рядка
  const range = useVirtualRange({
    count: items.length,
    rowHeight,
    viewportHeight,
    scrollTop,
    overscan,
  });

  // Виводимо лише ті елементи, які знаходяться в обчисленому діапазоні видимості
  const slice = useMemo(
    () => items.slice(range.start, range.end),
    [items, range.start, range.end],
  );

  return (
    <div
      ref={rootRef}
      className={`virtual-list${className ? ` ${className}` : ""}`}
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop); // Оновлюємо стан scrollTop при прокрутці списку
      }}
    >
      <div
        className="virtual-list__spacer"
        style={
          {
            "--vl-total-h": `${items.length * rowHeight}px`,
          } as React.CSSProperties
        }
      >
        <div
          className="virtual-list__window"
          style={
            // Зсуваємо видимий шматок вниз усередині spacer на offsetTop, щоб перший видимий ряд був на своєму місці
            // --vl-offset-top - це кастомна CSS-змінна, яка використовується для зсуву видимого вікна всередині spacer
            { "--vl-offset-top": `${range.offsetTop}px` } as React.CSSProperties
          }
        >
          {slice.map((item, i) => {
            const index = range.start + i;

            return (
              <div
                key={index}
                className="virtual-list__row"
                style={
                  // --vl-row-h - це кастомна CSS-змінна, яка використовується для встановлення висоти рядка
                  { "--vl-row-h": `${rowHeight}px` } as React.CSSProperties
                }
              >
                {renderRow(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
