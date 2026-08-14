"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpFromLine, Save, Package, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { PageHeader, pushSystemNotification } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getMovements, recordStockOut } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StockOutPage() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("sale");
  const [reference, setReference] = useState(`SO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [pData, mData] = await Promise.all([
      getProducts(),
      getMovements(),
    ]);
    if (pData && Array.isArray(pData)) setProducts(pData);
    if (mData && Array.isArray(mData)) setMovements(mData.filter(m => m.type === "out"));
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));
  const numQty = Number(quantity || 0);
  const isExceedingStock = selectedProduct ? numQty > selectedProduct.stock : false;

  const handleResetForm = () => {
    setSelectedProductId("");
    setQuantity("1");
    setDestination("");
    setReason("sale");
    setReference(`SO-${Math.floor(1000 + Math.random() * 9000)}`);
    setNotes("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!quantity || numQty <= 0) {
      toast.error("Please enter a valid quantity to remove");
      return;
    }
    if (isExceedingStock) {
      toast.error("Insufficient Stock!", {
        description: `Cannot remove ${quantity} units. Only ${selectedProduct.stock} units available in stock.`,
      });
      return;
    }

    setSubmitting(true);
    const activeUser = getAuthUser();
    const fullNotes = `Reason: ${reason}. ${destination ? `Destination: ${destination}. ` : ""}${notes}`;

    const res = await recordStockOut({
      product_id: selectedProductId,
      quantity: numQty,
      reference: reference.trim() || `SO-${Date.now().toString().slice(-4)}`,
      notes: fullNotes,
      destination: destination.trim(),
      reason: reason,
      user: activeUser?.name || "Administrator",
      company_slug: activeUser?.company_slug || "default",
    });

    if (res && res.message) {
      toast.success("Stock Out recorded successfully! ✅", {
        description: reason === "transfer" || reason === "return" || destination
          ? `Stock Out recorded & added to Transfers & Returns Log! Track returns at /transfers.`
          : `New balance for ${selectedProduct?.name || 'product'}: ${res.new_stock} units. Form reset for next entry.`,
      });

      pushSystemNotification({
        title: `Stock Dispatched (-${numQty})`,
        sub: `${selectedProduct?.name || 'Item'} · Ref: ${reference.trim() || 'SO'}`,
        message: `${numQty} units of "${selectedProduct?.name || 'Item'}" were dispatched out of warehouse stock by ${activeUser?.name || 'Administrator'}. Reference: ${reference.trim() || 'SO'}.`,
        type: "info",
        category: "activity",
        link: "/stock-history",
      });

      // AUTO-REFRESH & RESET FORM TO INITIAL CLEAN STATE
      handleResetForm();
      await loadData();
    } else {
      toast.error(res?.error || "Failed to deduct stock");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Stock Out Dispatches"
        description="Record outbound inventory leaving your warehouse for sales, transfers, or damage."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/transfers">
              <ArrowLeftRight className="h-4 w-4 text-primary" /> Transfers & Returns Audit Log
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-destructive" /> New stock out dispatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {products.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.emoji || "📦"} {p.name} — {p.sku} ({p.stock} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Current stock balance</Label>
                <div className={cn(
                  "flex items-center gap-2 rounded-md border px-3 h-10 text-sm font-medium transition-colors",
                  selectedProduct && selectedProduct.stock === 0
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : selectedProduct && selectedProduct.stock <= selectedProduct.threshold
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-muted/40"
                )}>
                  <Package className="h-4 w-4 shrink-0" />
                  {selectedProduct ? `${selectedProduct.stock} units remaining` : "Select a product above"}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={cn(isExceedingStock && "text-destructive font-semibold")}>
                  Quantity to remove
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={cn(
                    "transition-all duration-150",
                    isExceedingStock && "border-destructive text-destructive bg-destructive/10 focus-visible:ring-destructive font-bold"
                  )}
                  required
                />
                {isExceedingStock && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold mt-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Insufficient stock! Maximum available is {selectedProduct.stock} units.
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Destination / Customer / Branch</Label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Store #204, Downtown" />
              </div>

              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale / Order Fulfillment</SelectItem>
                    <SelectItem value="transfer">Inter-warehouse Transfer</SelectItem>
                    <SelectItem value="damaged">Damaged / Expired</SelectItem>
                    <SelectItem value="return">Return to Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Reference # (SO/Dispatch)</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="SO-5511" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional dispatch details" rows={3} />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={handleResetForm}>Reset Form</Button>
                <Button type="submit" disabled={isExceedingStock || submitting}>
                  <Save className="mr-2 h-4 w-4" /> {submitting ? "Processing..." : "Save Stock Out"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Stock Out Log</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-xs text-muted-foreground">
                      No stock out entries recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.slice(0, 8).map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{m.product_name}</div>
                        <div className="text-xs text-muted-foreground">{m.reference || "SO"} · {m.user} · {m.date}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">−{m.quantity}</TableCell>
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
