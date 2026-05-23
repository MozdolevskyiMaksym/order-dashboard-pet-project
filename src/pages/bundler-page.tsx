import React, { useEffect, useMemo, useState } from "react";

const Heavy = React.lazy(() => import("@/features/bundler/Heavy"));

type BuildMeta = Readonly<{
  mode?: string;
  builtAt?: string;
  node?: string;
  assetsCount?: number;
  totalBytes?: number;
}>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function BundlerDemoPage() {
  const [showHeavy, setShowHeavy] = useState<boolean>(false);

  const [meta, setMeta] = useState<BuildMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setMetaLoading(true);
      setMetaError(null);

      try {
        // Читаємо build-meta.json зі статичного хостингу (prod build)
        const res = await fetch("/build-meta.json", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`Failed to load build-meta.json (${res.status})`);
        }

        const data = (await res.json()) as BuildMeta;

        if (alive) {
          setMeta(data);
        }
      } catch (e) {
        if (alive) {
          setMetaError(e instanceof Error ? e.message : "Unknown error");
          setMeta(null);
        }
      } finally {
        if (alive) {
          setMetaLoading(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const totalSizeText = useMemo(() => {
    if (!meta?.totalBytes && meta?.totalBytes !== 0) {
      return null;
    }
    return formatBytes(meta.totalBytes);
  }, [meta]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Bundler demo</h1>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div>NODE_ENV: {process.env.NODE_ENV}</div>
        <div>API_URL: {process.env.API_URL}</div>
      </div>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Build meta</div>

        {metaLoading ? (
          <div>Loading build info…</div>
        ) : metaError ? (
          <div
            style={{ border: "1px solid #f99", borderRadius: 8, padding: 8 }}
          >
            Error: {metaError}
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
              Tip: run <code>npm run build</code> and serve <code>dist</code> as
              static files.
            </div>
          </div>
        ) : meta ? (
          <div style={{ display: "grid", gap: 4 }}>
            <div>Mode: {meta.mode ?? "unknown"}</div>
            <div>Built at: {meta.builtAt ?? "unknown"}</div>
            <div>Node: {meta.node ?? "unknown"}</div>
            <div>Assets: {meta.assetsCount ?? "unknown"}</div>
            <div>Total size: {totalSizeText ?? "unknown"}</div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Note: this info is generated during production build.
            </div>
          </div>
        ) : (
          <div>No build metadata found.</div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <button onClick={() => setShowHeavy((v) => !v)}>
          {showHeavy ? "Hide" : "Show"} heavy chunk
        </button>

        {showHeavy ? (
          <React.Suspense fallback={<p>Loading…</p>}>
            <Heavy />
          </React.Suspense>
        ) : null}
      </div>
    </div>
  );
}
