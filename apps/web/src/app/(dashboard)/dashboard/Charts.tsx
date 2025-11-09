"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

export default function Charts() {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const [trend, setTrend] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [category, setCategory] = useState<any[]>([]);
  const [cash, setCash] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${base}/invoice-trends`).then(r => r.json()),
      fetch(`${base}/vendors/top10`).then(r => r.json()),
      fetch(`${base}/category-spend`).then(r => r.json()),
      fetch(`${base}/cash-outflow`).then(r => r.json()),
    ]).then(([t, v, c, co]) => {
      setTrend(t);
      setVendors(v);
      setCategory(c);
      setCash(co);
    });
  }, [base]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="p-4 rounded-xl border">
        <div className="font-medium mb-2">Invoice Volume + Value Trend</div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString()} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="invoiceCount" />
              <Line type="monotone" dataKey="spend" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 rounded-xl border">
        <div className="font-medium mb-2">Cash Outflow Forecast</div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={cash}>
              <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString()} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 rounded-xl border">
        <div className="font-medium mb-2">Top 10 Vendors by Spend</div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={vendors}>
              <XAxis dataKey="vendorName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="spend" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 rounded-xl border">
        <div className="font-medium mb-2">Spend by Category</div>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={category} dataKey="spend" nameKey="category" outerRadius={90}>
                {category.map((_e, i) => <Cell key={i} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
