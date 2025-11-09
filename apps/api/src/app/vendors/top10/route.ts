import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const data = await prisma.invoice.groupBy({
    by: ["vendorId"],
    _sum: { totalAmount: true },
  });

  const vendors = await prisma.vendor.findMany();
  const map = new Map(vendors.map((v) => [v.id, v.name]));

  const formatted = data
    .map((row) => ({
      vendorId: row.vendorId,
      vendorName: map.get(row.vendorId) ?? "Unknown",
      spend: Number(row._sum.totalAmount ?? 0),
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  return NextResponse.json(formatted);
}
