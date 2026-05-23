// Імпортуємо стандартний Node.js-модуль path.
// Він потрібен, щоб коректно працювати з шляхами до файлів незалежно від ОС (macOS / Windows / Linux)
const path = require("node:path");
// Генерує index.html, автоматично підключає всі згенеровані JS та CSS файли.
const HtmlWebpackPlugin = require("html-webpack-plugin");
// Плагін для копіювання файлів як є, без обробки loader’ами. Використовується для “чистої” статики (robots.txt, favicon тощо)
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  // Вказуємо точку входу застосунку.
  // Це файл, з якого Webpack починає будувати dependency graph і аналізує всі import і залежності
  entry: path.resolve(__dirname, "../src/main.tsx"),

  // Вихідні файли збірки.
  // Налаштування того як, куди і з якими іменами Webpack має виводити згенеровані файли після збірки.
  output: {
    // Папка, куди Webpack складе всі згенеровані файли після збірки
    path: path.resolve(__dirname, "../dist"),
    // Шаблон імені JS-файлів. [name] — імʼя entry або чанка. [contenthash] — хеш від вмісту файлу.
    // Це забезпечує правильне кешування в браузері
    filename: "assets/[name].[contenthash].js",
    // Перед кожною новою збіркою папка dist повністю очищається, щоб не залишалося старих файлів
    clean: true, // очищає dist перед новою збіркою
    // Шаблон імені для asset-ів (зображень, шрифтів тощо), якщо вони не перевизначені окремо
    assetModuleFilename: "assets/[name].[hash][ext][query]",
  },

  // Дозволені розширення імпортів
  // Налаштування того, як Webpack шукає імпортовані файли
  resolve: {
    extensions: [".tsx", ".ts", ".js"], // Дозволяє імпортувати файли без вказування розширення

    // Аліаси для зручних імпортів без ../../..
    // Створює скорочений шлях @ для папки src
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },

  // Тут описано, як обробляти різні типи файлів
  module: {
    rules: [
      // ✅ Transpilation TypeScript / TSX (окремий tsconfig для webpack)
      {
        test: /\.(ts|tsx)$/, // правило застосовується до .ts та .tsx
        use: {
          loader: "ts-loader", // компілює TypeScript → JavaScript
          options: {
            configFile: path.resolve(
              // окремий tsconfig спеціально для Webpack
              __dirname,
              "../tsconfig.webpack.json",
            ),
          },
        },
        exclude: /node_modules/, //  не обробляємо node_modules (швидше і правильно)
      },

      // Статичні asset-и (зображення):
      // маленькі файли → inline (base64), великі файли → окремий файл
      // Це правило обробляє зображення
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024, // до 4 KB → inline
          },
        },
        // Контролює папку (assets/media), імʼя файлу, хеш для кешування
        generator: {
          filename: "assets/media/[name].[hash][ext][query]",
        },
      },
    ],
  },

  // Плагіни працюють на рівні всієї збірки, а не окремих файлів
  plugins: [
    // Генерація HTML з автоматичним підключенням бандлів
    // бере HTML-шаблон -> автоматично підключає всі JS і CSS -> створює фінальний dist/index.html
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "../public/index.html"),
    }),

    // Копіювання статичних файлів без обробки loader’ами
    // копіює файли з public/static -> у dist/static -> без обробки loader’ами
    // Використовується для файлів, які не є частиною JS-логіки
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "../public/static"),
          to: "static",
        },
      ],
    }),
  ],
};
