"use client";

import { useState, useEffect } from "react";
import { ArrowUpFromLine, Save, Package } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getMovements, recordStockOut } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
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
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity to remove");
      return;
    }
    if (selectedProduct && Number(quantity) > selectedProduct.stock) {
      toast.error("Insufficient Stock", {
        description: `Cannot remove ${quantity} units. Only ${selectedProduct.stock} available in stock.`,
      });
      return;
    }

    setSubmitting(true);
    const activeUser = getAuthUser();
    const fullNotes = `Reason: ${reason}. ${destination ? `Destination: ${destination}. ` : ""}${notes}`;

    const res = await recordStockOut({
      product_id: selectedProductId,
      quantity: Number(quantity),
      reference: reference.trim() || `SO-${Date.now().toString().slice(-4)}`,
      notes: fullNotes,
      user: activeUser?.name || "Administrator",
    });

    if (res && res.message) {
      toast.success("Stock Out recorded successfully! ✅", {
        description: `New balance for ${selectedProduct?.name || 'product'}: ${res.new_stock} units. Form reset for next entry.`,
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
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 h-10 text-sm font-medium">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  {selectedProduct ? `${selectedProduct.stock} units` : "Select a product above"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity to remove</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Destination / Customer</Label>
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
                <Button type="submit" disabled={submitting}>
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
