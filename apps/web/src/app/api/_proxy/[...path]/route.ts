// apps/web/src/app/api/_proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001/api";

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  const targetPath = ctx.params.path.join("/");
  const url = `${BACKEND_URL}/${targetPath}${req.nextUrl.search || ""}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (e: any) {
    console.error("Proxy GET failed:", url, e?.message);
    return NextResponse.json({ error: "Proxy fetch failed", detail: e?.message }, { status: 502 });
  }
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  const targetPath = ctx.params.path.join("/");
  const url = `${BACKEND_URL}/${targetPath}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: await req.text(),
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (e: any) {
    console.error("Proxy POST failed:", url, e?.message);
    return NextResponse.json({ error: "Proxy fetch failed", detail: e?.message }, { status: 502 });
  }
}
