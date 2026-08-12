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
import { getReports, getProducts, getMovements, getCategories, getSuppliers } from "@/lib/api";
import { formatCurrency, getAppSettings } from "@/lib/theme";
import { cn } from "@/lib/utils";

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const s = getAppSettings();
    if (s && s.companyName) setCompanyName(s.companyName);

    async function loadData() {
      const [rep, prods, moves, cats, sups] = await Promise.all([
        getReports(),
        getProducts(),
        getMovements(),
        getCategories(),
        getSuppliers(),
      ]);

      const prodList = (prods && Array.isArray(prods)) ? prods : [];
      const catList = (cats && Array.isArray(cats)) ? cats : [];
      const supList = (sups && Array.isArray(sups)) ? sups : [];

      const calculatedTotalStock = prodList.reduce((sum, p) => sum + Number(p.stock || 0), 0);
      const calculatedLowStock = prodList.filter(p => Number(p.stock || 0) <= Number(p.threshold || 0) && Number(p.stock || 0) > 0).length;
      const calculatedOutOfStock = prodList.filter(p => Number(p.stock || 0) === 0).length;
      const calculatedValuation = prodList.reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.price || 0)), 0);

      const mergedMetrics = {
        total_products: (rep && !rep.error && rep.total_products !== undefined && rep.total_products > 0) ? rep.total_products : prodList.length,
        total_categories: (rep && !rep.error && rep.total_categories !== undefined && rep.total_categories > 0) ? rep.total_categories : catList.length,
        total_suppliers: (rep && !rep.error && rep.total_suppliers !== undefined && rep.total_suppliers > 0) ? rep.total_suppliers : supList.length,
        total_stock: (rep && !rep.error && rep.total_stock !== undefined && rep.total_stock > 0) ? rep.total_stock : calculatedTotalStock,
        low_stock_count: (rep && !rep.error && rep.low_stock_count !== undefined) ? rep.low_stock_count : calculatedLowStock,
        out_of_stock_count: (rep && !rep.error && rep.out_of_stock_count !== undefined) ? rep.out_of_stock_count : calculatedOutOfStock,
        inventory_valuation: (rep && !rep.error && rep.inventory_valuation !== undefined && rep.inventory_valuation > 0) ? rep.inventory_valuation : calculatedValuation,
      };

      setMetrics(mergedMetrics);

      if (prodList.length > 0) {
        setProductsList(prodList);
        setCategoryMix(buildCategoryMixData(prodList));
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
        title={companyName ? `${companyName} — Inventory Overview` : "Inventory Overview"}
        description={
          companyName
            ? `Real-time stock levels, movement trends, and alert monitoring for ${companyName}.`
            : "Real-time stock levels, movement trends, and alert monitoring."
        }
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
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden transition-all hover:border-primary/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className={cn("grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl font-bold", kpi.tint)}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-2 py-0.5",
                      kpi.up ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                    )}
                  >
                    {kpi.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {kpi.trend}
                  </span>
                </div>
                <div className="mt-3 sm:mt-4">
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{kpi.value}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{kpi.label}</span>
                    <span className="truncate max-w-[120px]">{kpi.sub}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Stock Movement Trends Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Stock Movement Trends</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Weekly Inbound vs Outbound inventory activity</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Stock In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-chart-4" />
                <span className="text-muted-foreground">Stock Out</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[240px] sm:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-chart-4)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="in" name="Stock In" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="out" name="Stock Out" stroke="var(--color-chart-4)" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Share Mix Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Category Inventory Share</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Stock volume distribution by product category</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[200px] sm:h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--color-background)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {categoryMix.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate font-medium text-foreground">{c.name}</span>
                  <span className="text-muted-foreground text-[11px]">({c.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Low Stock Alert & Recent Activity */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Urgent Low Stock Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Low Stock & Reorder Alerts
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Products requiring immediate reordering</p>
            </div>
            <Button asChild variant="ghost" size="xs" className="text-xs font-semibold text-primary">
              <Link href="/alerts">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {productsList.filter((p) => p.stock <= p.threshold).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-success text-sm">🟢 All inventory levels healthy</div>
                <div>No items currently below reorder thresholds.</div>
              </div>
            ) : (
              <div className="divide-y text-xs">
                {productsList
                  .filter((p) => p.stock <= p.threshold)
                  .slice(0, 4)
                  .map((p) => {
                    const isOut = p.stock === 0;
                    return (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ProductIcon name={p.name} categoryName={p.category_name} emoji={p.emoji} className="h-8 w-8 rounded-lg" iconClassName="h-4 w-4" />
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-foreground">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{p.sku}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <StatusBadge status={isOut ? "out_of_stock" : "low_stock"} />
                          <div className="text-right">
                            <div className="font-bold text-foreground">{p.stock} left</div>
                            <div className="text-[10px] text-muted-foreground">Min: {p.threshold}</div>
                          </div>
                          <Button asChild size="xs" variant="outline" className="h-7 px-2">
                            <Link href={`/stock-in?product=${p.id}`}>Reorder</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Stock Movement History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Recent Stock Movements</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest warehouse transactions & dispatches</p>
            </div>
            <Button asChild variant="ghost" size="xs" className="text-xs font-semibold text-primary">
              <Link href="/stock-history">Full Audit →</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {recentMovements.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No recent stock movement logs found.
              </div>
            ) : (
              <div className="divide-y text-xs">
                {recentMovements.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-foreground">{m.product_name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>By {m.user}</span>
                        <span>•</span>
                        <span>{m.date}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={cn(
                          "font-bold text-sm",
                          m.type === "in" ? "text-success" : "text-destructive"
                        )}
                      >
                        {m.type === "in" ? "+" : "-"}{m.quantity} units
                      </div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {m.type === "in" ? "Stock Inbound" : "Dispatched Out"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
