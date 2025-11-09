import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const data = await prisma.invoice.groupBy({
    by: ["issueDate"],
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { issueDate: "asc" },
  });

  const formatted = data.map((row) => ({
    date: row.issueDate,
    invoiceCount: row._count.id,
    spend: Number(row._sum.totalAmount ?? 0),
  }));

  return NextResponse.json(formatted);
}
