import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const data = await prisma.lineItem.groupBy({
    by: ["category"],
    _sum: { unitPrice: true },
  });

  const formatted = data.map((row) => ({
    category: row.category ?? "Unknown",
    spend: Number(row._sum.unitPrice ?? 0),
  }));

  return NextResponse.json(formatted);
}
