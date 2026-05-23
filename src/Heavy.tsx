import React from "react";

export function Heavy() {
  // ✅ Імітуємо "важкий" модуль (у реальному житті тут могла б бути велика бібліотека)
  const items = Array.from({ length: 2000 }, (_, i) => `Item ${i + 1}`);

  return (
    <div>
      <h2>Heavy module</h2>
      <p>Цей компонент підвантажується динамічно (окремим chunk).</p>
      <ul>
        {items.slice(0, 50).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
