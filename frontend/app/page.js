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
import { cn } from "@/lib/utils";

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
      const rawDate = m.date || m.created_at;
      if (rawDate) {
        const isoString = String(rawDate).replace(" ", "T");
        const d = new Date(isoString);
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
      if (rep && !rep.error) setMetrics(rep);
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

  const safeTotalStock = Number(metrics?.total_stock ?? 0);
  const safeTotalProducts = Number(metrics?.total_products ?? 0);
  const safeLowStock = Number(metrics?.low_stock_count ?? 0);
  const safeOutOfStock = Number(metrics?.out_of_stock_count ?? 0);
  const safeValuation = Number(metrics?.inventory_valuation ?? 0);

  const kpis = [
    {
      label: "Total Products",
      value: safeTotalProducts.toLocaleString(),
      sub: "Active catalog items",
      trend: "+12.4%",
      up: true,
      icon: Package,
      tint: "text-primary bg-primary/10",
    },
    {
      label: "Low Stock Items",
      value: safeLowStock.toLocaleString(),
      sub: "Below threshold",
      trend: "-2.1%",
      up: false,
      icon: AlertTriangle,
      tint: "text-warning bg-warning/10",
    },
    {
      label: "Out of Stock",
      value: safeOutOfStock.toLocaleString(),
      sub: "Urgent reorder needed",
      trend: "0%",
      up: true,
      icon: XCircle,
      tint: "text-destructive bg-destructive/10",
    },
    {
      label: "Total Units in Stock",
      value: safeTotalStock.toLocaleString(),
      sub: `Valued at ${formatCurrency(safeValuation)}`,
      trend: "+8.2%",
      up: true,
      icon: Boxes,
      tint: "text-success bg-success/10",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inventory Overview"
        description="Real-time stock levels, movement trends, and alert monitoring."
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm">
              <Link href="/stock-out">Stock Out</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm">
              <Link href="/stock-in">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Stock In
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards (Optimized for Galaxy Z Fold 5 folded & unfolded screens) */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="relative overflow-hidden border-border/80 shadow-2xs">
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className={`grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl ${k.tint}`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
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
                <div className="mt-3 sm:mt-4">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{k.label}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1 font-medium truncate">{k.sub}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Stock Movement Trend (Live Database)</CardTitle>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Aggregated Records</span>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockTrend} margin={{ left: -25, right: 5, top: 10 }}>
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
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="in" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#inGrad)" name="Stock In (+)" />
                  <Area type="monotone" dataKey="out" stroke="var(--color-chart-4)" strokeWidth={2} fillOpacity={1} fill="url(#outGrad)" name="Stock Out (-)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Stock by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryMix}
                    innerRadius={45}
                    outerRadius={75}
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

      {/* Tables & Mobile Card Section (Dual Responsive Layout for Galaxy Z Fold 5 & Mobile Devices) */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* INVENTORY PRODUCTS CARD */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 sm:px-6 border-b">
            <CardTitle className="text-sm sm:text-base font-semibold">Inventory Products</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-8 px-2">
              <Link href="/products">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {/* MOBILE & Z FOLD 5 COVER SCREEN CARD LIST (< md) */}
            <div className="block md:hidden divide-y">
              {productsList.slice(0, 5).map((p) => (
                <div key={p.id} className="p-3.5 space-y-2 hover:bg-muted/40 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductIcon name={p.name} categoryName={p.category_name} emoji={p.emoji} className="h-8 w-8 shrink-0 rounded-lg" iconClassName="h-4 w-4" />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-foreground truncate">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">{p.sku}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-foreground">{formatCurrency(p.price)}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{p.stock} units</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <span className="text-muted-foreground font-medium">{p.category_name || "General"}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (≥ md) */}
            <div className="hidden md:block overflow-x-auto w-full scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-right text-xs">Price</TableHead>
                    <TableHead className="text-right text-xs">Stock</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsList.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ProductIcon name={p.name} categoryName={p.category_name} emoji={p.emoji} className="h-7 w-7 shrink-0" iconClassName="h-3.5 w-3.5" />
                          <div className="min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate max-w-[130px] lg:max-w-[180px]">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">{p.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm whitespace-nowrap">{p.stock}</TableCell>
                      <TableCell className="whitespace-nowrap"><StatusBadge status={p.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* RECENT MOVEMENTS CARD */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3.5 px-4 sm:px-6 border-b">
            <CardTitle className="text-sm sm:text-base font-semibold">Recent Movements</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs h-8 px-2">
              <Link href="/stock-history">Full log <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {/* MOBILE & Z FOLD 5 COVER SCREEN CARD LIST (< md) */}
            <div className="block md:hidden divide-y">
              {recentMovements.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No stock movements recorded yet.</div>
              ) : (
                recentMovements.map((m) => (
                  <div key={m.id} className="p-3.5 space-y-1.5 hover:bg-muted/40 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-xs text-foreground truncate">{m.product_name}</div>
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        m.type === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                      )}>
                        {m.type === "in" ? `+${m.quantity} Stock In` : `-${m.quantity} Stock Out`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="truncate">By {m.user} · {m.date}</span>
                      <span className="font-semibold text-foreground shrink-0 ml-2">Balance: {m.balance}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE VIEW (≥ md) */}
            <div className="hidden md:block overflow-x-auto w-full scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Movement</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Balance</TableHead>
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
                        <TableCell className="py-2.5">
                          <div className="font-medium text-xs sm:text-sm truncate max-w-[130px] lg:max-w-[180px]">{m.product_name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {m.type === "in" ? "Stock In" : "Stock Out"} · {m.user} · {m.date}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-semibold text-xs sm:text-sm whitespace-nowrap ${m.type === "in" ? "text-success" : "text-destructive"}`}>
                          {m.type === "in" ? `+${m.quantity}` : `-${m.quantity}`}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{m.balance}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
