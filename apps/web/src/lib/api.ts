const BASE = process.env.NEXT_PUBLIC_API_BASE!;
console.log("WEB BASE =", BASE);

export async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status} GET ${path}`);
  return res.json();
}
