"use client";

import { useState, useEffect } from "react";
import { Search, FileDown, Calendar, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMovements } from "@/lib/api";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HistoryPage() {
  const [movementList, setMovementList] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      const apiData = await getMovements();
      if (apiData && Array.isArray(apiData)) {
        setMovementList(apiData);
      }
    }
    loadData();
  }, []);

  const filteredMovements = movementList.filter((m) => {
    const matchesSearch =
      (m.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.reference || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.user || "").toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportPDF = () => {
    if (filteredMovements.length === 0) {
      toast.error("No movements to export");
      return;
    }
    const columns = ["Date", "Product", "SKU", "Type", "Quantity", "Stock Balance", "User", "Reference"];
    const rows = filteredMovements.map((m) => [
      m.date,
      m.product_name,
      m.product_sku || "N/A",
      m.type === "in" ? "Stock In" : "Stock Out",
      m.type === "in" ? `+${m.quantity}` : `-${m.quantity}`,
      m.product_stock !== undefined ? `${m.product_stock} units` : (m.balance || "N/A"),
      m.user,
      m.reference || "N/A",
    ]);
    exportToPDF("Stock History Audit Trail", columns, rows);
    toast.success("Opened print window for PDF export");
  };

  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      toast.error("No movements to export");
      return;
    }
    const headers = ["Date", "Product", "SKU", "Type", "Quantity", "Stock Balance", "User", "Reference"];
    const rows = filteredMovements.map((m) => [
      m.date,
      m.product_name,
      m.product_sku || "",
      m.type === "in" ? "Stock In" : "Stock Out",
      m.quantity,
      m.product_stock !== undefined ? m.product_stock : (m.balance || ""),
      m.user,
      m.reference || "",
    ]);
    exportToCSV("stock_history.csv", headers, rows);
    toast.success("Downloaded stock_history.csv");
  };

  return (
    <div>
      <PageHeader
        title="Stock History"
        description="Full audit trail of every inventory movement."
        actions={
          <>
            <Button variant="outline" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" /> Export Excel (CSV)
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search product, SKU, user or reference…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Movement Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Movements</SelectItem>
                <SelectItem value="in">Stock In (+)</SelectItem>
                <SelectItem value="out">Stock Out (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product & SKU</TableHead>
                  <TableHead className="text-right">In</TableHead>
                  <TableHead className="text-right">Out</TableHead>
                  <TableHead className="text-right">Stock Balance</TableHead>
                  <TableHead>Performed by</TableHead>
                  <TableHead>Reference #</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No stock movements recorded matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{m.date}</TableCell>
                      <TableCell>
                        <div className="font-medium">{m.product_name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-semibold">{m.product_sku || "SKU"}</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn("text-right", m.type === "in" ? "text-success font-semibold" : "text-muted-foreground")}>
                        {m.type === "in" ? <span className="inline-flex items-center gap-1"><ArrowDownRight className="h-3 w-3" />+{m.quantity}</span> : "—"}
                      </TableCell>
                      <TableCell className={cn("text-right", m.type === "out" ? "text-destructive font-semibold" : "text-muted-foreground")}>
                        {m.type === "out" ? <span className="inline-flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />−{m.quantity}</span> : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {m.product_stock !== undefined ? `${m.product_stock} units` : (m.balance ? `${m.balance} units` : "—")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.user}</TableCell>
                      <TableCell className="font-mono text-xs">{m.reference || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
