// Ця функція імітує важку обчислювальну задачу, яка виконується для кожного елемента.

export default function heavyCalc(i: number) {
  let acc = 0;

  for (let j = 0; j < 450; j += 1) {
    acc += Math.sqrt((i * j) % 1000);
  }

  return acc;
}
