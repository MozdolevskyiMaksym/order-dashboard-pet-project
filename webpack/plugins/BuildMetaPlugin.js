// RawSource — це “обгортка” для звичайного тексту/рядка, щоб Webpack міг сприймати його як asset (файл, який треба покласти в dist/).
const { RawSource } = require("webpack").sources;

class BuildMetaPlugin {
  constructor(options = {}) {
    // Опції плагіна
    this.options = {
      filename: options.filename ?? "build-meta.json", // назва файлу, який ми створюємо в dist/. Дефолт: build-meta.json
      includeAssets: options.includeAssets ?? true, // чи додавати у метадані список усіх asset-файлів (JS/CSS/PNG…)
      includeAssetSizes: options.includeAssetSizes ?? true,
      pretty: options.pretty ?? true, // чи робити JSON “красивим” (з відступами)
    };
  }

  apply(compiler) {
    // compiler.hooks.thisCompilation спрацьовує коли створюється compilation (тобто коли Webpack починає збірку конкретного білда).
    // tap означає: “підпишися на цей хук під ім’ям BuildMetaPlugin”
    // compilation — це об’єкт, який представляє конкретну збірку (набір assets, chunks тощо).
    compiler.hooks.thisCompilation.tap("BuildMetaPlugin", (compilation) => {
      // processAssets — хук, який спрацьовує тоді, коли Webpack вже сформував assets і їх можна читати, змінювати, додавати нові. Це саме той момент, коли ми хочемо додати наш build-meta.json як asset.
      compilation.hooks.processAssets.tap(
        // Налаштування підписки на хук + stage
        {
          name: "BuildMetaPlugin", // ім’я нашого підписника
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE, //  на якому етапі processAssets ми хочемо виконатися
          // PROCESS_ASSETS_STAGE_SUMMARIZE означає “коли assets уже сформовані, і можна робити підсумкові речі/додавати файли”
        },
        (assets) => {
          // Формуємо метадані збірки
          const meta = {
            mode: compiler.options.mode, // development або production (те, що в webpack config).
            builtAt: new Date().toISOString(), // час збірки у форматі ISO (зручно порівнювати й логувати).
            node: process.version, // версія Node.js, на якій збирали (корисно, якщо збірка різна на різних машинах/CI).
          };

          // Додаємо список assets (умовно)
          const assetNames = Object.keys(assets).sort();

          if (this.options.includeAssets) {
            // беремо всі назви файлів: Object.keys(assets)
            // сортуємо .sort() щоб порядок був стабільний
            // записуємо в meta.assets
            meta.assets = assetNames;
          }

          if (this.options.includeAssetSizes) {
            let totalBytes = 0;

            for (const name of assetNames) {
              const asset = assets[name];
              if (asset && typeof asset.size === "function") {
                totalBytes += asset.size();
              }
            }

            meta.assetsCount = assetNames.length;
            meta.totalBytes = totalBytes;
          }

          // Перетворюємо meta у JSON
          const json = this.options.pretty
            ? JSON.stringify(meta, null, 2) // JSON.stringify(meta, null, 2) робить JSON з відступами (читабельно).
            : JSON.stringify(meta); // JSON буде в одну строку (менший розмір).

          // ДОДАЄМО файл як asset (а не пишемо через fs)
          compilation.emitAsset(
            // "додай новий файл до результату збірки"
            this.options.filename, // ім’я файлу (наприклад, build-meta.json)
            new RawSource(json), // "вміст файлу" (рядок JSON) у форматі, який Webpack розуміє
          );
        },
      );
    });
  }
}

module.exports = BuildMetaPlugin;

// Цей плагін можна використовувати в webpack.prod.js,
// щоб при кожній збірці генерувався файл build-meta.json з інформацією про збірку (режим, час, версія Node, список згенерованих файлів і їх розміри).
// Це корисно для аналізу та моніторингу збірок, особливо в CI/CD.
