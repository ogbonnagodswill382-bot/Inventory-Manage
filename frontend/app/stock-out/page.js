"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpFromLine, Save, Package, AlertTriangle, ArrowLeftRight, Hash, Tag, Info } from "lucide-react";
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
  const [reason, setReason] = useState("");
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
    setReason("");
    setReference(`SO-${Math.floor(1000 + Math.random() * 9000)}`);
    setNotes("");
  };

  const getReasonLabel = (notesStr = "") => {
    if (!notesStr) return "Dispatched Out";
    const lower = notesStr.toLowerCase();
    if (lower.includes("transfer")) return "🚚 Inter-Branch Transfer";
    if (lower.includes("damaged") || lower.includes("expired")) return "⚠️ Damaged / Expired";
    if (lower.includes("return")) return "↩️ Return to Supplier";
    if (lower.includes("sale")) return "🛒 Customer Sale";
    return "📦 Dispatched Out";
  };

  const getDestinationText = (notesStr = "") => {
    if (!notesStr) return null;
    const match = notesStr.match(/Destination:\s*([^.]+)/i);
    return match && match[1] ? match[1].trim() : null;
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
    if (!reason) {
      toast.error("Please select a reason for stock out", {
        description: "Choose why stock is leaving (e.g. Sale, Transfer, Damaged, or Return).",
      });
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
        message: `${numQty} units of "${selectedProduct?.name || 'Item'}" (SKU: ${selectedProduct?.sku || 'N/A'}) were dispatched out of warehouse stock by ${activeUser?.name || 'Administrator'}. Action: ${getReasonLabel(fullNotes)}. Reference: ${reference.trim() || 'SO'}.`,
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
                <Label>Product Name / Select Item</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {products.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.emoji || "📦"} {p.name} — [SKU: {p.sku}] ({p.stock} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRODUCT NUMBER / SKU DISPLAY BADGE */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Product Code (SKU / Barcode)
                </Label>
                <div className="flex items-center gap-2 rounded-md border bg-primary/5 px-3 h-10 text-sm font-semibold text-primary">
                  <Hash className="h-4 w-4 text-primary" />
                  {selectedProduct ? selectedProduct.sku : "Select product to view SKU"}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" /> Current Stock Balance
                </Label>
                <div className={cn(
                  "flex items-center gap-2 rounded-md border px-3 h-10 text-sm font-medium transition-colors",
                  selectedProduct && selectedProduct.stock === 0
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : selectedProduct && selectedProduct.stock <= selectedProduct.threshold
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-muted/40"
                )}>
                  <Package className="h-4 w-4 shrink-0" />
                  {selectedProduct ? `${selectedProduct.stock} units remaining` : "Select product to view balance"}
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className={cn(isExceedingStock && "text-destructive font-semibold")}>
                  Quantity to Remove
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
                <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Store #204, Customer John" />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-foreground font-semibold">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason for stock out..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">🛒 Customer Sale / Fulfillment</SelectItem>
                    <SelectItem value="transfer">🚚 Inter-warehouse Transfer</SelectItem>
                    <SelectItem value="damaged">⚠️ Damaged / Expired Item</SelectItem>
                    <SelectItem value="return">↩️ Return to Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5">
                  <span>Dispatch / Order Reference # (SO / Voucher)</span>
                  <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                    <Info className="h-3 w-3 text-info" /> (Sales Order, Waybill, or Dispatch note number)
                  </span>
                </Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. SO-5511 or WB-3012" />
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
                  <TableHead>Product, SKU & Action</TableHead>
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
                      <TableCell className="py-2.5">
                        <div className="font-medium text-sm">{m.product_name}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] font-semibold text-foreground">
                            {m.product_sku || "SKU"}
                          </span>
                          <span>· {m.reference || "SO"}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive">
                            {getReasonLabel(m.notes)}
                          </span>
                          {getDestinationText(m.notes) && (
                            <span className="text-muted-foreground truncate">→ {getDestinationText(m.notes)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-destructive">−{m.quantity}</TableCell>
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
