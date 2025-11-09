const BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  `http://localhost:${process.env.PORT || "3000"}/api/_proxy`;

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status} GET ${path}`);
  return res.json();
}
