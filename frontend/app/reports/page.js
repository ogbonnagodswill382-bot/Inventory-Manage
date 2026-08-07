"use client";

import { useState, useEffect } from "react";
import { FileDown, DollarSign, TrendingUp, Package, Truck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getReports, getProducts, getMovements } from "@/lib/api";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { formatCurrency } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tooltipStyle = { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 };

function buildStockTrendData(movements = []) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = {
    Mon: { in: 0, out: 0 },
    Tue: { in: 0, out: 0 },
    Wed: { in: 0, out: 0 },
    Thu: { in: 0, out: 0 },
    Fri: { in: 0, out: 0 },
    Sat: { in: 0, out: 0 },
    Sun: { in: 0, out: 0 },
  };

  if (movements && Array.isArray(movements) && movements.length > 0) {
    movements.forEach((m) => {
      let dayName = "Mon";
      if (m.date) {
        const d = new Date(m.date);
        if (!isNaN(d.getTime())) {
          dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        }
      }
      if (map[dayName]) {
        if (m.type === "in") map[dayName].in += Number(m.quantity || 0);
        if (m.type === "out") map[dayName].out += Number(m.quantity || 0);
      }
    });
  }

  return days.map((day) => ({
    day,
    in: map[day].in,
    out: map[day].out,
  }));
}

function buildSupplierMixData(products = []) {
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];
  const supMap = {};

  if (products && Array.isArray(products) && products.length > 0) {
    products.forEach((p) => {
      const sName = p.supplier_name || "Direct Supplier";
      supMap[sName] = (supMap[sName] || 0) + Number(p.stock || 0);
    });
  }

  const keys = Object.keys(supMap);
  if (keys.length === 0) {
    return [{ name: "Suppliers", value: 1, color: colors[0] }];
  }

  return keys.map((k, idx) => ({
    name: k,
    value: supMap[k],
    color: colors[idx % colors.length],
  }));
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [stockTrend, setStockTrend] = useState([]);
  const [supplierMix, setSupplierMix] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [rep, prods, moves] = await Promise.all([
        getReports(),
        getProducts(),
        getMovements(),
      ]);
      if (rep) setReportData(rep);
      if (prods && Array.isArray(prods)) {
        setProductsList(prods);
        setSupplierMix(buildSupplierMixData(prods));
      }
      if (moves && Array.isArray(moves)) {
        setStockTrend(buildStockTrendData(moves));
      }
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Catalog Products", reportData.total_products],
      ["Total Categories", reportData.total_categories],
      ["Total Suppliers", reportData.total_suppliers],
      ["Total Stock Units", reportData.total_stock],
      ["Low Stock Items", reportData.low_stock_count],
      ["Out of Stock Items", reportData.out_of_stock_count],
      ["Total Inventory Valuation", formatCurrency(reportData.inventory_valuation)],
    ];
    exportToCSV("inventory_valuation_report.csv", headers, rows);
    toast.success("Downloaded inventory_valuation_report.csv");
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const headers = ["Inventory Metric Name", "Value / Count"];
    const rows = [
      ["Total Catalog Products", `${reportData.total_products} items`],
      ["Total Product Categories", `${reportData.total_categories} categories`],
      ["Total Active Suppliers", `${reportData.total_suppliers} suppliers`],
      ["Total Stock Units in Warehouse", `${reportData.total_stock.toLocaleString()} units`],
      ["Low Stock Warning Items", `${reportData.low_stock_count} items`],
      ["Out of Stock Critical Items", `${reportData.out_of_stock_count} items`],
      ["Total Inventory Valuation", formatCurrency(reportData.inventory_valuation)],
    ];
    exportToPDF("StockFlow Inventory Valuation Summary Report", headers, rows);
    toast.success("Opening PDF Print Window for Valuation Report");
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive inventory valuation, movement audit logs, and supplier breakdown."
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" /> Export PDF
            </Button>
          </>
        }
      />

      {/* Summary KPI Highlights */}
      {reportData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Inventory Valuation</div>
                <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(reportData.inventory_valuation)}
                </div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Units in Stock</div>
                <div className="text-2xl font-bold mt-1">{reportData.total_stock.toLocaleString()}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Low Stock Warning</div>
                <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{reportData.low_stock_count}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">Active Suppliers</div>
                <div className="text-2xl font-bold mt-1">{reportData.total_suppliers}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info">
                <Truck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Movement Trend (Live Database)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockTrend} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="in" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} name="Stock In (+)" />
                  <Line type="monotone" dataKey="out" stroke="var(--color-chart-4)" strokeWidth={3} dot={{ r: 4 }} name="Stock Out (-)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Share by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={supplierMix} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {supplierMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="var(--color-card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
