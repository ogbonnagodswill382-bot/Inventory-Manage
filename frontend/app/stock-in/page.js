"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownToLine, Save, Package } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getProducts, getSuppliers, getMovements, recordStockIn } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { toast } from "sonner";

function StockInForm() {
  const searchParams = useSearchParams();
  const preSelectedProdId = searchParams.get("product");

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  
  const [selectedProductId, setSelectedProductId] = useState(preSelectedProdId || "");
  const [quantity, setQuantity] = useState("1");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [reference, setReference] = useState(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [pData, sData, mData] = await Promise.all([
      getProducts(),
      getSuppliers(),
      getMovements(),
    ]);
    if (pData && Array.isArray(pData)) {
      setProducts(pData);
      if (preSelectedProdId && pData.some(p => String(p.id) === String(preSelectedProdId))) {
        setSelectedProductId(String(preSelectedProdId));
      }
    }
    if (sData && Array.isArray(sData)) setSuppliers(sData);
    if (mData && Array.isArray(mData)) setMovements(mData.filter(m => m.type === "in"));
  }

  useEffect(() => {
    loadData();
  }, [preSelectedProdId]);

  const selectedProduct = products.find(p => String(p.id) === String(selectedProductId));

  const handleResetForm = () => {
    setSelectedProductId("");
    setQuantity("1");
    setSelectedSupplierId("");
    setReference(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
    setNotes("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity to add");
      return;
    }

    setSubmitting(true);
    const activeUser = getAuthUser();
    const res = await recordStockIn({
      product_id: selectedProductId,
      quantity: Number(quantity),
      reference: reference.trim() || `PO-${Date.now().toString().slice(-4)}`,
      notes,
      user: activeUser?.name || "Administrator",
    });

    if (res && res.message) {
      toast.success("Stock In recorded successfully! ✅", {
        description: `New balance for ${selectedProduct?.name || 'product'}: ${res.new_stock} units. Form reset for next entry.`,
      });

      // AUTO-REFRESH & RESET FORM TO INITIAL CLEAN STATE
      handleResetForm();
      await loadData();
    } else {
      toast.error(res?.error || "Failed to add stock");
    }
    setSubmitting(false);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-success" /> New stock in receipt
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
                      {p.emoji || "📦"} {p.name} — {p.sku} ({p.stock} in stock)
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
              <Label>Quantity to add</Label>
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
              <Label>Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference # (PO/Invoice)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO-8822" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes / Delivery details</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional details about this delivery shipment" rows={3} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={handleResetForm}>Reset Form</Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" /> {submitting ? "Processing..." : "Save Stock In"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Stock In Log</CardTitle></CardHeader>
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
                    No stock in entries recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                movements.slice(0, 8).map(m => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{m.product_name}</div>
                      <div className="text-xs text-muted-foreground">{m.reference || "PO"} · {m.user} · {m.date}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">+{m.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StockInPage() {
  return (
    <div>
      <PageHeader
        title="Stock In Receipts"
        description="Receive incoming inventory shipments and auto-update stock balances."
      />
      <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Loading stock in form...</div>}>
        <StockInForm />
      </Suspense>
    </div>
  );
}
