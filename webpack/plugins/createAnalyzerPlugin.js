// Це "готовий" плагін, який Webpack може підключити в plugins
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

/**
 * Режими:
 * - "off"    → плагін не підключається
 * - "static" → генерує HTML-звіт (dist/bundle-report.html)
 * - "server" → запускає локальний сервер з UI аналізатора
 * - "json"   → генерує JSON (dist/bundle-report.json)
 * - "stats"  → генерує stats.json (корисно для інших інструментів)
 */
class AnalyzerPlugin extends BundleAnalyzerPlugin {
  constructor(options = {}) {
    // Нормалізуємо опції й задаємо дефолти
    const mode = options.mode ?? "static";

    // Базова конфігурація, яку ми "успадковуємо" + підсилюємо
    // Це внутрішній режим, який розуміє BundleAnalyzerPlugin
    let analyzerMode = "disabled"; // disabled (тобто UI/HTML не генеримо)
    if (mode === "server") {
      analyzerMode = "server"; // server → буде UI-сервер
    } else if (mode === "static") {
      analyzerMode = "static"; // static → буде HTML-звіт
    }

    const base = {
      analyzerMode,
      openAnalyzer: options.openAnalyzer ?? false, // Чи відкривати звіт/сервер автоматично в браузері. Дефолт false, бо в CI це точно не потрібно
      reportFilename: options.reportFilename ?? "bundle-report.html", // Імʼя HTML звіту у режимі static
      generateStatsFile: false, // Чи генерувати stats файл (.json) взагалі. Тут дефолт false, бо для static/server часто хочуть тільки UI/HTML
      statsFilename: options.statsFilename ?? "stats.json",
      // Налаштування того, що саме потрапляє у stats
      statsOptions: options.statsOptions ?? {
        source: false, // означає: не включати вихідний код модулів, щоб файл був менший і був безпечніший (менше шансів “засвітити” шматки коду)
      },
    };

    // Якщо режим json/stats — налаштовуємо stats-файл
    if (mode === "json") {
      base.analyzerMode = "disabled";
      base.generateStatsFile = true;
      base.statsFilename = options.statsFilename ?? "bundle-report.json";
    }

    if (mode === "stats") {
      base.analyzerMode = "disabled";
      base.generateStatsFile = true;
      base.statsFilename = options.statsFilename ?? "stats.json";
    }

    // Якщо режим off — ми НЕ будемо інстанціювати цей плагін через фабрику (нижче)
    // Викликаємо батьківський конструктор
    // Це ключове: ми передаємо base в BundleAnalyzerPlugin
    // Тобто наш плагін фактично створюється як BundleAnalyzerPlugin з нашими опціями
    super(base);

    // Зберігаємо режим для логіки/дебагу
    this._mode = mode;
  }

  // Це стандартний метод будь-якого Webpack-плагіна. Webpack викликає його під час збірки і передає compiler
  apply(compiler) {
    // Можемо додати власний лог у консоль, щоб у CI було видно режим
    // Ми підʼєднуємось до хуку beforeRun — момент перед стартом збірки
    // Виводимо лог, щоб у CI/терміналі одразу було видно, який режим використовується
    compiler.hooks.beforeRun.tap("AnalyzerPlugin", () => {
      console.log(`[AnalyzerPlugin] mode="${this._mode}"`);
    });

    // Викликаємо базову реалізацію BundleAnalyzerPlugin, apply батьківського плагіна
    // Ми не “переписуємо” логіку аналізатора.
    // Ми лише додаємо свій лог, а основна робота робиться всередині BundleAnalyzerPlugin
    super.apply(compiler);
  }
}

// Фабрика: повертає плагін або null
// mode можна передавати напряму або брати з ENV (ANALYZE_MODE)

// Це функція, яка вирішує: створювати плагін чи ні
function createAnalyzerPlugin(options = {}) {
  const mode = options.mode ?? process.env.ANALYZE_MODE ?? "off";

  // Якщо off → плагіна немає
  if (mode === "off" || mode === "" || mode == null) {
    return null;
  }

  return new AnalyzerPlugin({
    mode,
    openAnalyzer: options.openAnalyzer,
    reportFilename: options.reportFilename,
    statsFilename: options.statsFilename,
    statsOptions: options.statsOptions,
  });
}

module.exports = { AnalyzerPlugin, createAnalyzerPlugin };
