import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";

  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [
        { invoiceNo: { contains: q, mode: "insensitive" } },
        { vendor: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: {
      vendor: true,
      customer: true,
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(
    invoices.map((inv) => ({
      id: inv.id,
      vendor: inv.vendor.name,
      customer: inv.customer.name,
      date: inv.issueDate,
      invoiceNo: inv.invoiceNo,
      amount: Number(inv.totalAmount ?? 0),
      status: inv.status,
    }))
  );
}
