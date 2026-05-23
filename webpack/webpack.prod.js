// Імпортуємо функцію merge, яка обʼєднує кілька webpack-конфігурацій в одну
const { merge } = require("webpack-merge");

// Підтягуємо базову (спільну) конфігурацію
const common = require("./webpack.common");

// Плагін, який у production-режимі виносить CSS в окремий .css файл, замість вставки стилів у <style>
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Плагін для аналізу бандла — показує, які залежності є в збірці та скільки вони важать
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { createAnalyzerPlugin } = require("./plugins/createAnalyzerPlugin");

// Плагін, який зчитує змінні з .env файлу і підставляє їх у код на етапі збірки.
const Dotenv = require("dotenv-webpack");

// Кастомний плагін, який генерує файл build-meta.json з метаданими збірки (час, хеші, розміри файлів тощо)
const BuildMetaPlugin = require("./plugins/BuildMetaPlugin");

// Кастомний плагін для оптимізованого аналізу бандла.
// Створює звіт про структуру бандла, але активується тільки якщо ANALYZE=true у середовищі (наприклад, у CI).
const analyzer = createAnalyzerPlugin({
  // Можна не передавати mode, тоді читається з process.env.ANALYZE_MODE
  mode: process.env.CI ? "stats" : (process.env.ANALYZE_MODE ?? "off"),
  openAnalyzer: false,
  reportFilename: "bundle-report.html",
  statsFilename: "stats.json",
  statsOptions: { source: false },
});

module.exports = merge(common, {
  // Production режим (мінімізація коду, tree-shaking, оптимізації для продакшена)
  mode: "production",

  // Source maps для продакшена (можна замінити на "hidden-source-map" за потреби)
  // Source maps створюються, але не підключаються автоматично в браузері.
  devtool: "hidden-source-map",

  module: {
    // Тут описано, як обробляти різні типи файлів — це зона відповідальності loader’ів
    rules: [
      {
        // У prod CSS/SCSS виноситься в окремий файл
        test: /\.(sa|sc|c)ss$/, // Правило застосовується до всіх CSS/SCSS/SASS-файлів
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        // css-loader — читає CSS, розбирає @import і url(...)
        // MiniCssExtractPlugin.loader — передає CSS плагіну, який винесе його в окремий файл
        // sass-loader — компілює SCSS/SASS у CSS

        // У результаті:
        //   у prod CSS не в JS
        //   CSS лежить у власному .css файлі
      },
    ],
  },

  plugins: [
    //Плагіни керують процесом збірки в цілому, а не окремими файлами
    // Підтягуємо змінні оточення для prod
    new Dotenv({
      path: ".env.production", // Підтягує змінні з .env.production. Значення підставляються під час збірки
    }),

    // Окремий CSS-файл з хешем
    new MiniCssExtractPlugin({
      filename: "assets/[name].[contenthash].css", // Генерує CSS-файли у папці dist/assets/.
      // [name] — імʼя чанка
      // [contenthash] — хеш від вмісту CSS для коректного кешування
    }),

    // Генерує файл build-meta.json з метаданими збірки (час, хеші, розміри файлів тощо)
    new BuildMetaPlugin({
      filename: "build-meta.json", // Імʼя файлу, який буде згенеровано у папці dist/
      includeAssets: true, // включає інформацію про згенеровані файли (імена, розміри) у метадані збірки
      includeAssetSizes: true, // включає розміри згенерованих файлів у метадані збірки
      pretty: true, // Форматування JSON для зручного читання
    }),

    // Аналіз розміру бандла. Створює HTML-звіт про структуру бандла
    // new BundleAnalyzerPlugin({
    //   analyzerMode: "static", // генерує статичний файл
    //   openAnalyzer: false, // не відкриває браузер автоматично
    //   reportFilename: "bundle-report.html", // імʼя звіту
    // }),

    // Підключається тільки якщо ANALYZE=true
    ...(analyzer ? [analyzer] : []),
  ],

  optimization: {
    // Code splitting для кращого кешування. Налаштування оптимізації production-збірки. (менші файли, кращий кеш, швидші оновлення при зміні коду)
    splitChunks: { chunks: "all" }, // Дозволяє Webpack автоматично виносити спільні частини коду в окремі чанки
    runtimeChunk: "single", // Виносить runtime-код Webpack в окремий файл (runtime.*.js).
  },
});
