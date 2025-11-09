import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const prisma = new PrismaClient();
const id = () => crypto.randomUUID();

type AnyObj = Record<string, any>;

function readJsonArrayOrThrow(jsonPath: string): AnyObj[] {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found at: ${jsonPath}`);
  }
  const raw = fs.readFileSync(jsonPath, "utf-8").trim();

  // Quick preview for debugging
  console.log("Reading JSON from:", jsonPath);
  console.log("First 200 chars:", raw.slice(0, 200));

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    console.error("❌ JSON.parse failed. Common causes: trailing commas, comments, invalid numbers.");
    throw e;
  }

  // Accept either an array OR an object with a known array key
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.invoices)) return parsed.invoices;
  if (Array.isArray(parsed.data)) return parsed.data;

  throw new Error(
    "JSON must be an array of invoices, or an object with `invoices` (or `data`) array. " +
    `Got type: ${typeof parsed}`
  );
}

async function main() {
  const jsonPath = path.resolve(__dirname, "../../../data/Analytics_Test_Data.json");
  const data: AnyObj[] = readJsonArrayOrThrow(jsonPath);

  const vendorIds = new Map<string, string>();
  const customerIds = new Map<string, string>();

  for (const inv of data) {
    // --- Vendor ---
    const vObj = inv.vendor ?? inv.supplier ?? {};
    const vKey = vObj.id || vObj.name || "unknown-vendor";
    let vendorId = vendorIds.get(vKey);
    if (!vendorId) {
      vendorId = vObj.id || id();
      await prisma.vendor.upsert({
        where: { id: vendorId },
        create: {
          id: vendorId,
          name: vObj.name ?? "Unknown Vendor",
          category: vObj.category ?? null,
        },
        update: {
          name: vObj.name ?? "Unknown Vendor",
          category: vObj.category ?? null,
        },
      });
      vendorIds.set(vKey, vendorId);
    }

    // --- Customer ---
    const cObj = inv.customer ?? {};
    const cKey = cObj.id || cObj.name || "unknown-customer";
    let customerId = customerIds.get(cKey);
    if (!customerId) {
      customerId = cObj.id || id();
      await prisma.customer.upsert({
        where: { id: customerId },
        create: {
          id: customerId,
          name: cObj.name ?? "Unknown Customer",
        },
        update: {
          name: cObj.name ?? "Unknown Customer",
        },
      });
      customerIds.set(cKey, customerId);
    }

    // --- Invoice ---
    const invoiceId = inv.id || id();
    const issue = inv.issue_date || inv.issueDate || inv.date;
    const due = inv.due_date || inv.dueDate;

    await prisma.invoice.create({
      data: {
        id: invoiceId,
        vendorId,
        customerId,
        invoiceNo: inv.invoice_no || inv.invoiceNo || invoiceId.slice(0, 8),
        issueDate: issue ? new Date(issue) : new Date(),
        dueDate: due ? new Date(due) : null,
        status: (inv.status || "pending").toString(),
        totalAmount: Number(inv.total_amount ?? inv.amount ?? 0),
        items: {
          create: (inv.line_items || inv.items || []).map((li: AnyObj) => ({
            id: li.id || id(),
            description: li.description || li.desc || "Item",
            quantity: Number(li.quantity ?? li.qty ?? 1),
            unitPrice: Number(li.unit_price ?? li.price ?? 0),
            category: li.category ?? null,
          })),
        },
        payments: {
          create: (inv.payments || []).map((p: AnyObj) => ({
            id: p.id || id(),
            paidDate: new Date(p.paid_date || p.date || due || issue || Date.now()),
            method: (p.method || "unknown").toString(),
            amount: Number(p.amount ?? 0),
          })),
        },
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
