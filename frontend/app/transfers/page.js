"use client";

import { useState, useEffect } from "react";
import { Truck, RotateCcw, CheckCircle, Clock, Check, ArrowRight, ShieldCheck, CornerDownLeft } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTransfers, approveTransferReturn } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const data = await getTransfers();
    if (data && Array.isArray(data)) {
      setTransfers(data);
    }
  }

  useEffect(() => {
    loadData();
    const activeUser = getAuthUser();
    if (activeUser) setApproverName(activeUser.name);
  }, []);

  const dispatchedList = transfers.filter((t) => t.status === "dispatched");
  const returnedList = transfers.filter((t) => t.status === "returned_to_stock");

  const handleOpenApproveModal = (transfer) => {
    setSelectedTransfer(transfer);
    const activeUser = getAuthUser();
    setApproverName(activeUser?.name || "Administrator");
    setReturnNotes("");
  };

  const handleApproveReturn = async (e) => {
    e.preventDefault();
    if (!selectedTransfer) return;
    if (!approverName.trim()) {
      toast.error("Please enter the Approver Name");
      return;
    }

    setSubmitting(true);
    const res = await approveTransferReturn(selectedTransfer.id, {
      approved_by: approverName.trim(),
      notes: returnNotes.trim(),
    });

    if (res && res.message) {
      toast.success("Goods Returned & Restocked! ↩️", {
        description: `${selectedTransfer.quantity} units of "${selectedTransfer.product_name}" added back to warehouse inventory. Approved by ${approverName.trim()}.`,
      });
      setSelectedTransfer(null);
      await loadData();
    } else {
      toast.error(res?.error || "Failed to approve return");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inter-Branch Transfers & Supplier Returns"
        description="Audit outbound shipments to secondary branches or suppliers, and approve restock returns back to warehouse stock."
      />

      {/* KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Currently Dispatched</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{dispatchedList.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Out at branches / suppliers</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Returned & Restocked</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{returnedList.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Approved back to stock</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Total Audit Records</div>
              <div className="text-2xl font-bold">{transfers.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Tracked transfers & returns</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* APPROVE RETURN DIALOG MODAL */}
      <Dialog open={!!selectedTransfer} onOpenChange={(v) => !v && setSelectedTransfer(null)}>
        {selectedTransfer && (
          <DialogContent className="max-w-md">
            <form onSubmit={handleApproveReturn}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Approve & Restock Returned Goods
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Approve return of goods back into main warehouse stock balance.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-sm">
                <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>{selectedTransfer.product_name}</span>
                    <span className="font-mono text-muted-foreground">{selectedTransfer.product_sku}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-1 border-t">
                    <span>Qty to Restock: <strong className="text-emerald-600 font-bold">+{selectedTransfer.quantity} units</strong></span>
                    <span>Origin: <strong>{selectedTransfer.destination}</strong></span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="app-name">Approver Name (Administrator / Manager)</Label>
                  <Input
                    id="app-name"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="e.g. Sarah Kim"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ret-notes">Return Inspection Notes (Optional)</Label>
                  <Textarea
                    id="ret-notes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="e.g. Returned in original undamaged condition from Store #204."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setSelectedTransfer(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CornerDownLeft className="mr-1.5 h-4 w-4" /> {submitting ? "Restocking..." : "Approve & Restock (+Qty)"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* TABLE & MOBILE LIST */}
      <Card>
        <CardHeader className="py-4 px-4 sm:px-6">
          <CardTitle className="text-base font-semibold">Transfers & Returns Audit Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* MOBILE CARD LIST (< md) */}
          <div className="block md:hidden divide-y">
            {transfers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No branch transfers or supplier returns recorded yet.
              </div>
            ) : (
              transfers.map((t) => {
                const isReturned = t.status === "returned_to_stock";
                return (
                  <div key={t.id} className="p-4 space-y-2 hover:bg-muted/40 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm text-foreground truncate">{t.product_name}</div>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0",
                        isReturned
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      )}>
                        {isReturned ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {isReturned ? "Returned & Restocked" : "Dispatched Out"}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-muted-foreground">
                      <div>Quantity: <strong className="text-foreground">{t.quantity} units</strong> · {t.type === "supplier_return" ? "Return to Supplier" : "Inter-warehouse Transfer"}</div>
                      <div>Destination: <strong className="text-foreground">{t.destination}</strong></div>
                      <div>Dispatched by: <span>{t.dispatched_by}</span> on {t.date}</div>
                      {isReturned && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Approved by: <strong>{t.approved_by || "Administrator"}</strong> on {t.returned_date || "recently"}
                        </div>
                      )}
                    </div>

                    {!isReturned && (
                      <div className="pt-2">
                        <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleOpenApproveModal(t)}>
                          <CornerDownLeft className="mr-1.5 h-3.5 w-3.5" /> Approve & Restock Return
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE VIEW (≥ md) */}
          <div className="hidden md:block overflow-x-auto w-full scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product / SKU</TableHead>
                  <TableHead>Type & Destination</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Dispatched By</TableHead>
                  <TableHead>Status & Approver</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      No branch transfers or supplier returns recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((t) => {
                    const isReturned = t.status === "returned_to_stock";
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">{t.product_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{t.product_sku}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{t.destination}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.type === "supplier_return" ? "Return to Supplier" : "Inter-warehouse Transfer"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">{t.quantity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {t.dispatched_by}
                          <div className="text-[10px] text-muted-foreground">{t.date}</div>
                        </TableCell>
                        <TableCell>
                          {isReturned ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="h-3 w-3" /> Returned & Restocked
                              </span>
                              <div className="text-[11px] text-muted-foreground mt-1">
                                Approved by: <strong>{t.approved_by || "Administrator"}</strong>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Clock className="h-3 w-3" /> Dispatched Out
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isReturned ? (
                            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleOpenApproveModal(t)}>
                              <CornerDownLeft className="mr-1.5 h-3.5 w-3.5" /> Approve & Restock
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">Completed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
