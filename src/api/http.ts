type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions<TBody> = {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
};

type ClientOptions = Readonly<{
  token?: string;
  headers?: Readonly<Record<string, string>>;
}>;

export class HttpError extends Error {
  public readonly status: number;
  public readonly bodyText: string;

  constructor(status: number, bodyText: string) {
    super(bodyText);
    this.status = status;
    this.bodyText = bodyText;
  }
}

// Універсальна функція для виконання HTTP-запитів
// Автоматично додає Content-Type: application/json
// Серіалізує body через JSON.stringify
// Перевіряє res.ok і кидає HttpError з текстом відповіді, якщо статус не ок
export async function http<TResponse, TBody = unknown>(
  url: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new HttpError(res.status, text);
  }

  return res.json() as Promise<TResponse>;
}

// Це більш високорівнева обгортка над http
// Додає підтримку Authorization: Bearer token
// Автоматично формує headers
// Має зручні методи get і post
export const apiClient = {
  get<TResponse>(url: string, options: ClientOptions = {}) {
    const headers: Record<string, string> = {};
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    if (typeof options.token === "string" && options.token.length > 0) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    return http<TResponse>(url, { method: "GET", headers });
  },

  post<TResponse, TBody>(
    url: string,
    body: TBody,
    options: ClientOptions = {},
  ) {
    const headers: Record<string, string> = {};
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    if (typeof options.token === "string" && options.token.length > 0) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    return http<TResponse, TBody>(url, { method: "POST", body, headers });
  },
};

// Я створив централізований HTTP-клієнт, який забезпечує типізовану взаємодію з API.
// Він підтримує generics для строгого типізування відповіді,
// обробляє HTTP-помилки через власний клас HttpError та дозволяє безпечно додавати Bearer-токен для захищених запитів.
