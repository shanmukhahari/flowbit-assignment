import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const now = new Date();
  const ytd = new Date(now.getFullYear(), 0, 1);

  const [{ _sum: ytdSum }, totalInvoices, { _avg: avgVal }] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { issueDate: { gte: ytd } },
    }),
    prisma.invoice.count(),
    prisma.invoice.aggregate({ _avg: { totalAmount: true } }),
  ]);

  const documentsUploaded = totalInvoices; // no docs column -> mirror invoices

  return NextResponse.json({
    totalSpendYTD: Number(ytdSum.totalAmount ?? 0),
    totalInvoices,
    documentsUploaded,
    avgInvoiceValue: Number(avgVal.totalAmount ?? 0),
  });
}
