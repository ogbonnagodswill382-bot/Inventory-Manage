"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, XCircle, RefreshCw, CheckCircle2, ShieldAlert, Filter } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProducts } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      const apiData = await getProducts();
      if (apiData && Array.isArray(apiData)) {
        setProducts(apiData);
      }
    }
    loadData();
  }, []);

  const criticalProducts = products.filter((p) => p.status !== "in_stock");
  const outOfStockList = criticalProducts.filter((p) => p.status === "out_of_stock");
  const lowStockList = criticalProducts.filter((p) => p.status === "low_stock");

  const displayedAlerts =
    activeFilter === "out_of_stock"
      ? outOfStockList
      : activeFilter === "low_stock"
      ? lowStockList
      : criticalProducts;

  return (
    <div>
      <PageHeader
        title="Low Stock & Critical Alerts"
        description={`${criticalProducts.length} products require immediate replenishment.`}
      />

      {/* KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Out of Stock (Urgent)</div>
              <div className="text-2xl font-bold text-destructive">{outOfStockList.length}</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Low Stock Warnings</div>
              <div className="text-2xl font-bold text-warning-foreground [color:oklch(0.5_0.15_65)]">{lowStockList.length}</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-warning/15 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Total Action Required</div>
              <div className="text-2xl font-bold">{criticalProducts.length}</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4">
        <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted">
          <TabsList className="inline-flex sm:grid sm:grid-cols-3 w-max sm:w-full min-w-full h-auto p-1 border bg-muted/40 rounded-xl gap-1">
            <TabsTrigger value="all" className="py-2 text-xs sm:text-sm">All Alerts ({criticalProducts.length})</TabsTrigger>
            <TabsTrigger value="out_of_stock" className="py-2 text-xs sm:text-sm">Out of Stock ({outOfStockList.length})</TabsTrigger>
            <TabsTrigger value="low_stock" className="py-2 text-xs sm:text-sm">Low Stock ({lowStockList.length})</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Alerts Grid */}
      {displayedAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-base text-foreground">All stock levels healthy!</p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeFilter === "all"
                ? "No low stock or out-of-stock items detected in your database."
                : `No items matching filter "${activeFilter.replace("_", " ")}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedAlerts.map((p) => {
            const isOut = p.status === "out_of_stock";
            return (
              <Card
                key={p.id}
                className={cn(
                  "border-l-4 hover:shadow-md transition-all",
                  isOut ? "border-l-destructive bg-destructive/5" : "border-l-warning"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-xl">
                        {p.emoji || "📦"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0",
                        isOut
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-warning/20 [color:oklch(0.45_0.15_65)] border border-warning/30"
                      )}
                    >
                      {isOut ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {isOut ? "Out of Stock" : "Low Stock"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm rounded-lg border bg-background/60 p-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-medium">Current Stock</div>
                      <div
                        className={cn(
                          "text-xl font-bold mt-0.5",
                          isOut ? "text-destructive" : "[color:oklch(0.5_0.15_65)]"
                        )}
                      >
                        {p.stock} units
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-medium">Alert Minimum</div>
                      <div className="text-xl font-bold mt-0.5">{p.threshold} units</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Category: {p.category_name || "General"}</span>
                    <span>Supplier: {p.supplier_name || "Partner"}</span>
                  </div>

                  <Button asChild className="mt-4 w-full" variant={isOut ? "default" : "outline"}>
                    <Link href={`/stock-in?product=${p.id}`}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Restock Product Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
