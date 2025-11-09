import Charts from "./Charts";
import InvoicesTable from "./InvoicesTable";
import { getJSON } from "@/lib/api";

type Stats = {
  totalSpendYTD: number;
  totalInvoices: number;
  documentsUploaded: number;
  avgInvoiceValue: number;
};

export default async function DashboardPage() {
  const stats = await getJSON<Stats>("/stats");
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Total Spend (YTD)" value={fmt(stats.totalSpendYTD)} />
        <Card title="Invoices Processed" value={stats.totalInvoices} />
        <Card title="Documents Uploaded" value={stats.documentsUploaded} />
        <Card title="Avg Invoice Value" value={fmt(stats.avgInvoiceValue)} />
      </div>

      {/* Charts */}
      <Charts />

      {/* Table */}
      <InvoicesTable />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl border">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
