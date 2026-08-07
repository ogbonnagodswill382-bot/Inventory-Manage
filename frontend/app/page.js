"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductIcon } from "@/components/product-icon";
import { getReports, getProducts, getMovements } from "@/lib/api";
import { formatCurrency } from "@/lib/theme";

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

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

function buildCategoryMixData(products = []) {
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];
  const catMap = {};

  if (products && Array.isArray(products) && products.length > 0) {
    products.forEach((p) => {
      const cName = p.category_name || "Uncategorized";
      catMap[cName] = (catMap[cName] || 0) + Number(p.stock || 0);
    });
  }

  const keys = Object.keys(catMap);
  if (keys.length === 0) {
    return [{ name: "Catalog Items", value: 1, color: colors[0] }];
  }

  return keys.map((k, idx) => ({
    name: k,
    value: catMap[k],
    color: colors[idx % colors.length],
  }));
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    total_products: 0,
    total_categories: 0,
    total_suppliers: 0,
    total_stock: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    inventory_valuation: 0,
  });

  const [productsList, setProductsList] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [stockTrend, setStockTrend] = useState([]);
  const [categoryMix, setCategoryMix] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [rep, prods, moves] = await Promise.all([
        getReports(),
        getProducts(),
        getMovements(),
      ]);
      if (rep) setMetrics(rep);
      if (prods && Array.isArray(prods)) {
        setProductsList(prods);
        setCategoryMix(buildCategoryMixData(prods));
      }
      if (moves && Array.isArray(moves)) {
        setRecentMovements(moves.slice(0, 5));
        setStockTrend(buildStockTrendData(moves));
      }
    }
    loadData();
  }, []);

  const kpis = [
    {
      label: "Total Products",
      value: metrics.total_products,
      sub: "Active catalog items",
      trend: "+12.4%",
      up: true,
      icon: Package,
      tint: "text-primary bg-primary/10",
    },
    {
      label: "Low Stock Items",
      value: metrics.low_stock_count,
      sub: "Below threshold",
      trend: "-2.1%",
      up: false,
      icon: AlertTriangle,
      tint: "text-warning bg-warning/10",
    },
    {
      label: "Out of Stock",
      value: metrics.out_of_stock_count,
      sub: "Urgent reorder needed",
      trend: "0%",
      up: true,
      icon: XCircle,
      tint: "text-destructive bg-destructive/10",
    },
    {
      label: "Total Units in Stock",
      value: metrics.total_stock.toLocaleString(),
      sub: `Valued at ${formatCurrency(metrics.inventory_valuation)}`,
      trend: "+8.2%",
      up: true,
      icon: Boxes,
      tint: "text-success bg-success/10",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inventory Overview"
        description="Real-time stock levels, movement trends, and alert monitoring."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/stock-out">Stock Out</Link>
            </Button>
            <Button asChild>
              <Link href="/stock-in">
                <Plus className="mr-2 h-4 w-4" /> Stock In
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`inline-flex items-center text-xs font-semibold ${
                      k.up ? "text-success" : "text-destructive"
                    }`}
                  >
                    {k.up ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
                    {k.trend}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold tracking-tight">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1 font-medium">{k.sub}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Stock Movement Trend (Live Database)</CardTitle>
            <span className="text-xs text-muted-foreground font-medium">Aggregated Records</span>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockTrend} margin={{ left: -20, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="in" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#inGrad)" name="Stock In (+)" />
                  <Area type="monotone" dataKey="out" stroke="var(--color-chart-4)" strokeWidth={2} fillOpacity={1} fill="url(#outGrad)" name="Stock Out (-)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryMix}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryMix.map((entry) => (
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

      {/* Tables Row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Inventory Products</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/products">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsList.slice(0, 5).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductIcon name={p.name} categoryName={p.category_name} emoji={p.emoji} />
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(p.price)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{p.stock}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Audit Movements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Movements</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/stock-history">Full log <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movement</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                      No stock movements recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{m.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.type === "in" ? "Stock In" : "Stock Out"} · {m.user} · {m.date}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${m.type === "in" ? "text-success" : "text-destructive"}`}>
                        {m.type === "in" ? `+${m.quantity}` : `-${m.quantity}`}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-muted-foreground">{m.balance}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
