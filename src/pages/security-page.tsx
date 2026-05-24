import { useMemo, useState } from "react";
import { apiClient, HttpError } from "@/api/http";

import "./security-page.scss";

type PublicResponse = Readonly<{
  ok: boolean;
  message: string;
}>;

type SecureProfileResponse = Readonly<{
  ok: boolean;
  user: Readonly<{
    id: string;
    role: string;
  }>;
}>;

export default function SecurityPage() {
  const [tokenEnabled, setTokenEnabled] = useState<boolean>(false);
  const [token, setToken] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const effectiveToken = useMemo(() => {
    if (!tokenEnabled) {
      return undefined;
    }

    const t = token.trim();
    if (!t) {
      return "";
    }

    return t;
  }, [tokenEnabled, token]);

  async function callPublic() {
    setIsLoading(true);
    setError(null);
    setResult("");

    try {
      const data = await apiClient.get<PublicResponse>("/api/public");
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      if (isHttpError(e)) {
        setError(`${e.status}: ${e.message}`);
      } else {
        setError("Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function callProtected() {
    setIsLoading(true);
    setError(null);
    setResult("");

    try {
      const data = await apiClient.get<SecureProfileResponse>(
        "/api/secure/profile",
        {
          token: effectiveToken,
        },
      );
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      if (isHttpError(e)) {
        setError(`${e.status}: ${e.message}`);
      } else {
        setError("Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="security-page">
      <div className="security-page__header">
        <h1 className="security-page__title">Security demo</h1>
        <div className="security-page__subtitle">
          This page demonstrates secured network interaction using a bearer
          token: public endpoint works without auth, protected endpoint requires
          Authorization header.
        </div>
      </div>

      <div className="security-page__panel">
        <label className="security-page__toggle">
          <input
            type="checkbox"
            checked={tokenEnabled}
            onChange={(e) => {
              setTokenEnabled(e.target.checked);
              setError(null);
              setResult("");
            }}
          />
          <span className="security-page__toggle-text">
            Attach Authorization token to protected request
          </span>
        </label>

        {tokenEnabled ? (
          <div className="security-page__token">
            <div className="security-page__token-label">Token</div>
            <input
              className="security-page__token-input"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
              }}
              placeholder="Paste token here"
              autoComplete="off"
            />
            <div className="security-page__token-tip">
              Tip: set API_TOKEN on the server, then paste the same token here.
            </div>
          </div>
        ) : null}

        <div className="security-page__actions">
          <button
            type="button"
            onClick={() => {
              callPublic();
            }}
            disabled={isLoading}
          >
            Call public endpoint
          </button>

          <button
            type="button"
            onClick={() => {
              callProtected();
            }}
            disabled={isLoading}
          >
            Call protected endpoint
          </button>
        </div>
      </div>

      <div className="security-page__panel">
        <div className="security-page__response-title">Response</div>

        {isLoading ? (
          <div className="security-page__loading">Loading…</div>
        ) : null}

        {error ? (
          <div className="security-page__error">Error: {error}</div>
        ) : null}

        {result ? (
          <pre className="security-page__result">{result}</pre>
        ) : (
          <div className="security-page__empty">No response yet.</div>
        )}
      </div>
    </div>
  );
}

function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "message" in error
  );
}
