# Webpack + React + TypeScript — pet project (Bundler configuration)

Цей pet-проєкт створений як доказ для PeeX job **"Configures bundlers for application"**.
Тут налаштовано Webpack збірку для React + TypeScript з окремими конфігураціями для **development** та **production**, а також підключення CSS та статичних asset’ів (зображення).

- `CopyWebpackPlugin` — копіює статичні файли (наприклад, robots.txt) без обробки loader’ами
- `webpack-bundle-analyzer` — аналізує склад та розмір бандла для виявлення важких залежностей

## Bundle analysis

Для аналізу складу та розміру production-бандла використано `webpack-bundle-analyzer`.
Після збірки генерується файл `bundle-report.html`, який дозволяє:

- оцінити розмір entrypoint’ів
- побачити залежності у бандлі
- виявити потенційні точки для оптимізації

---

## Як запустити

### Development (dev server + HMR)

```bash
npm install
npm run dev
```
