"use client";

import { useEffect, useState } from "react";

type Row = { vendor: string; date: string; invoiceNo: string; amount: number; status: string };

export default function InvoicesTable() {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${base}/invoices?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setRows(Array.isArray(data.data) ? data.data : data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // initial

  return (
    <div className="p-4 rounded-xl border mt-4">
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Search vendor, invoice no, status…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="border rounded px-3 py-2" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="p-2">Vendor</th>
              <th className="p-2">Date</th>
              <th className="p-2">Invoice #</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{r.vendor}</td>
                <td className="p-2">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-2">{r.invoiceNo}</td>
                <td className="p-2">{new Intl.NumberFormat("en-IN").format(Number(r.amount))}</td>
                <td className="p-2">{r.status}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-2 text-gray-500" colSpan={5}>No invoices</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
