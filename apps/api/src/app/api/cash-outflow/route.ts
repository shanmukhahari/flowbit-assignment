import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const data = await prisma.payment.groupBy({
    by: ["paidDate"],
    _sum: { amount: true },
    orderBy: { paidDate: "asc" },
  });

  const formatted = data.map((row) => ({
    date: row.paidDate,
    amount: Number(row._sum.amount ?? 0),
  }));

  return NextResponse.json(formatted);
}
