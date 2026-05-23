// Імпортуємо функцію merge, яка обʼєднує кілька webpack-конфігурацій в одну.
const { merge } = require("webpack-merge");
// Підтягуємо базову конфігурацію
const common = require("./webpack.common");
// Імпортуємо плагін, який читає .env файл і підставляє змінні середовища під час збірки
const Dotenv = require("dotenv-webpack");

module.exports = merge(common, {
  // Режим розробки (код не мінімізується, зберігаються зрозумілі імена змінних, 	збірка оптимізована для швидкості, а не для розміру)
  mode: "development",

  // Швидкі source maps для dev, Налаштування source maps для dev
  // Швидка перебудова при зміні коду, можливість бачити оригінальні .ts / .tsx файли у DevTools, точні номери рядків для дебагу
  devtool: "eval-cheap-module-source-map",

  // Тут описано, як Webpack має обробляти певні типи файлів
  module: {
    rules: [
      {
        // У dev CSS/SCSS вбудовується у <style> для швидкого HMR
        test: /\.(sa|sc|c)ss$/, // Це правило застосовується до всіх .css/.scss/.sass файлів
        use: ["style-loader", "css-loader", "sass-loader"],
        // css-loader - Читає CSS-файл, розбирає @import, url(...) і дозволяє імпортувати CSS у JavaScript
        // style-loader - Вставляє CSS у <style> тег прямо в браузері. CSS підʼєднується миттєво. підтримується швидке оновлення стилів без перезавантаження сторінки (HMR)
        // sass-loader - Компілює SCSS/SASS у CSS
      },
    ],
  },

  plugins: [
    // Підтягуємо змінні оточення для dev. Плагіни керують процесом збірки в цілому, а не окремими файлами
    new Dotenv({
      path: ".env.development", // взяти змінні з файлу .env.development - зробити їх доступними у коді під час dev-збірки
    }),
  ],

  // Налаштування вбудованого dev-сервера Webpack
  devServer: {
    port: 3000, // Dev-сервер буде доступний на http://localhost:3000
    open: true, // Після запуску dev-сервера браузер відкриється автоматично
    hot: true, // Вмикає Hot Module Replacement (HMR)
    // зміни в коді підвантажуються без повного перезавантаження сторінки, стан застосунку може зберігатися

    // При оновленні сторінки браузер робить прямий HTTP GET-запит (наприклад, /create).
    // Сервер не знає про client-side routing React і намагається знайти файл за цим шляхом.
    // historyApiFallback змушує dev-сервер у разі відсутності файлу завжди повертати index.html.
    // Далі index.html підвантажує main.js, React Router зчитує поточний URL
    // і сам вирішує, яку сторінку відрендерити.
    // Це обовʼязкова конфігурація для SPA з client-side routing.
    historyApiFallback: true,

    // Проксі для API-запитів у dev-режимі.
    // Усі запити на /api з фронтенду перенаправляються на backend-сервер.
    // Це дозволяє викликати API як з того ж домену, уникнути CORS
    // і не хардкодити URL бекенду у фронтенд-коді.
    // Потрібен для локальної розробки, коли фронт і бек працюють на різних портах (3000 і 4000). маскує backend як той самий origin
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    ],
  },
});
