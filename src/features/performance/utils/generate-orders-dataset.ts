import { ALL_CITIES, ALL_STATUSES } from "@/features/orders/constants";
import { Order } from "@/shared/types/order";
import { buildIsoDateTime } from "@/shared/utils";

// Тип псевдослучайного генератора: має метод next(), який повертає число 0..1
type SeededRng = Readonly<{
  next: () => number;
}>;

// Параметри генерації датасету: кількість записів і опціональний seed
type GenerateOrdersOptions = Readonly<{
  size: number;
  seed?: number;
}>;

type CityGeo = Readonly<{ city: string; lat: number; lng: number }>;

// Координати міст для реалістичного вигляду даних
const CITY_GEO: ReadonlyArray<CityGeo> = [
  { city: "Kyiv", lat: 50.4501, lng: 30.5234 },
  { city: "Lviv", lat: 49.8397, lng: 24.0297 },
  { city: "Dnipro", lat: 48.4647, lng: 35.0462 },
  { city: "Odesa", lat: 46.4825, lng: 30.7233 },
  { city: "Kharkiv", lat: 49.9935, lng: 36.2304 },
  { city: "Zaporizhzhia", lat: 47.8388, lng: 35.1396 },
  { city: "Poltava", lat: 49.5883, lng: 34.5514 },
  { city: "Cherkasy", lat: 49.4444, lng: 32.0598 },
  { city: "Kremenchuk", lat: 49.068, lng: 33.42 },
];

// Це генератор тестових даних (orders) для бенчмарку
// Генерує детермінований масив тестових замовлень для бенчмарку продуктивності
export function generateOrdersDataset(
  options: GenerateOrdersOptions,
): ReadonlyArray<Order> {
  // Якщо seed не передано — використовуємо дефолтний
  const rng = createSeededRng(options.seed ?? 12345);

  // Базова дата для всіх згенерованих замовлень
  const orders: Order[] = [];
  const baseYear = 2026;
  const baseMonth = 2;

  // Генеруємо рівно options.size замовлень
  for (let i = 0; i < options.size; i += 1) {
    const status = pick(rng, ALL_STATUSES); // Випадковий статус замовлення
    const city = pick(rng, ALL_CITIES); // Випадкове місто з глобального списку
    const geo = geoForCity(city);

    const day = 1 + (i % 28); // Дні циклічно повторюються 1..28 (щоб уникнути проблем з довжиною місяця)
    const createdAt = buildIsoDateTime(baseYear, baseMonth, day);

    const amountBase = 50 + Math.floor(rng.next() * 2500); // Генеруємо базову суму від 50 до 2550
    // Відмінені замовлення мають зменшену суму (реалістичність)
    const amount =
      status === "cancelled" ? Math.floor(amountBase * 0.2) : amountBase;

    // Унікальний ідентифікатор замовлення
    const id = `ORD-${1000 + i}`;

    // Формуємо об'єкт Order і додаємо в масив
    orders.push({
      id,
      createdAt,
      status,
      amount,
      city,
      lat: geo.lat,
      lng: geo.lng,
    });
  }

  // Повертаємо згенерований датасет
  return orders;
}

// Повертає координати для заданого міста або 0,0 якщо місто не знайдено
function geoForCity(city: string): CityGeo {
  const found = CITY_GEO.find(({ city: cityName }) => cityName === city);
  if (found) {
    return found;
  }
  return { city, lat: 0, lng: 0 };
}

// Створює детермінований генератор псевдовипадкових чисел на основі seed
function createSeededRng(seed: number): SeededRng {
  // Seed дозволяє отримувати однаковий набір “випадкових” даних для однакових параметрів.
  // Це важливо для коректного порівняння продуктивності.
  let s = seed;

  return {
    next: () => {
      // Лінійний конгруентний генератор (детермінований)
      // кожне нове число залежить від попереднього, при однаковому seed → однакова послідовність
      // Параметри (1664525, 1013904223, 4294967296) вибрані емпірично для хорошого розподілу
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    },
  };
}

// Повертає випадковий елемент із переданого масиву
function pick<T>(rng: SeededRng, list: ReadonlyArray<T>): T {
  // rng.next() → число 0..1
  // множимо на довжину масиву
  // округляємо вниз
  // повертаємо елемент
  const idx = Math.floor(rng.next() * list.length);
  return list[idx];
}
