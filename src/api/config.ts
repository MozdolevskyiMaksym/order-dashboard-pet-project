export const API_URL = process.env.API_URL ?? "";

export function buildApiUrl(path: string) {
  return `${API_URL}${path}`;
}
