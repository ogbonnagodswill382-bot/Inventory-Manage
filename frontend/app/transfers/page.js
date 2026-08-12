"use client";

import { useState, useEffect } from "react";
import { Truck, RotateCcw, CheckCircle, Clock, ShieldCheck, CornerDownLeft, Lock, Search, ChevronLeft, ChevronRight, Filter, Calendar } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTransfers, approveTransferReturn } from "@/lib/api";
import { getAuthUser, canApproveReturns } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search & Pagination for 1000+ high-volume records
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadData() {
    const data = await getTransfers();
    if (data && Array.isArray(data)) {
      setTransfers(data);
    }
  }

  useEffect(() => {
    loadData();
    const activeUser = getAuthUser();
    setCurrentUser(activeUser);
    if (activeUser) setApproverName(activeUser.name);
  }, []);

  const isApprover = canApproveReturns(currentUser?.role);
  const dispatchedList = transfers.filter((t) => t.status === "dispatched");
  const returnedList = transfers.filter((t) => t.status === "returned_to_stock");

  // Filter transfers list by search query & status
  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      (t.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.product_sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.destination || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.dispatched_by || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.approved_by || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "dispatched" && t.status === "dispatched") ||
      (statusFilter === "returned" && t.status === "returned_to_stock");

    return matchesSearch && matchesStatus;
  });

  // Calculate pagination boundaries for high-capacity lists (1000+ items)
  const totalItems = filteredTransfers.length;
  const effectivePageSize = pageSize === "all" ? Math.max(totalItems, 1) : Number(pageSize);
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * effectivePageSize;
  const paginatedTransfers = filteredTransfers.slice(startIndex, startIndex + effectivePageSize);

  const handleOpenApproveModal = (transfer) => {
    if (!isApprover) {
      toast.error("Access Restricted!", {
        description: `Your role (${currentUser?.role || "Staff"}) is Read-Only. Only Administrator and Inventory Manager can approve returned stock.`,
      });
      return;
    }

    setSelectedTransfer(transfer);
    const activeUser = getAuthUser();
    setApproverName(activeUser?.name || "Administrator");
    setReturnNotes("");
  };

  const handleApproveReturn = async (e) => {
    e.preventDefault();
    if (!isApprover) {
      toast.error("Access Restricted!", {
        description: `Your role (${currentUser?.role || "Staff"}) is Read-Only. Only Administrator and Inventory Manager can approve returned stock.`,
      });
      return;
    }

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
        description="Audit outbound shipments to secondary branches or suppliers with full Date & Time tracking. Scalable for 1000+ audit logs."
      />

      {/* KPI Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Currently Dispatched Out</div>
              <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                {dispatchedList.length} items
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Awaiting branch/supplier return</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium font-semibold">Returned & Restocked</div>
              <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {returnedList.length} items
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Restocked back into main inventory</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Total Transfer Audits</div>
              <div className="text-2xl font-bold mt-1">{transfers.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Tracked transfer logs</div>
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

      {/* HIGH-VOLUME SEARCH & FILTER CONTROLS */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, SKU, destination, or staff..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px] text-xs sm:text-sm">
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses ({transfers.length})</SelectItem>
                  <SelectItem value="dispatched">Dispatched Out ({dispatchedList.length})</SelectItem>
                  <SelectItem value="returned">Returned & Restocked ({returnedList.length})</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(val === "all" ? "all" : Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px] text-xs sm:text-sm">
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                  <SelectItem value="all">All ({totalItems})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE & MOBILE LIST */}
      <Card>
        <CardHeader className="py-4 px-4 sm:px-6 flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-base font-semibold">Transfers & Returns Audit Log</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {paginatedTransfers.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + effectivePageSize, totalItems)} of {totalItems} total transfer logs
            </p>
          </div>
          {!isApprover && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Read-Only Mode ({currentUser?.role})
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {/* MOBILE CARD LIST (< md) */}
          <div className="block md:hidden divide-y">
            {paginatedTransfers.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No branch transfers or supplier returns found matching your search.
              </div>
            ) : (
              paginatedTransfers.map((t) => {
                const isReturned = t.status === "returned_to_stock";
                return (
                  <div key={t.id} className="p-4 space-y-2.5 hover:bg-muted/40 transition">
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
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                        Dispatched: <span className="text-muted-foreground">{t.date || t.created_at || "Just now"}</span> by {t.dispatched_by}
                      </div>
                      {isReturned && (
                        <div className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 pt-0.5">
                          <CheckCircle className="h-3 w-3 shrink-0" />
                          Restocked: <span className="underline">{t.returned_date || t.returned_at || "Just now"}</span> (Approved by: {t.approved_by || "Administrator"})
                        </div>
                      )}
                    </div>

                    {!isReturned && isApprover && (
                      <div className="pt-2">
                        <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleOpenApproveModal(t)}>
                          <CornerDownLeft className="mr-1.5 h-3.5 w-3.5" /> Approve & Restock Return
                        </Button>
                      </div>
                    )}
                    {!isReturned && !isApprover && (
                      <div className="pt-1 text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Lock className="h-3 w-3 text-muted-foreground" /> Approval restricted to Admin & Manager
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
                  <TableHead>Dispatch Date & Time</TableHead>
                  <TableHead>Status & Approval Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      No branch transfers or supplier returns found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransfers.map((t) => {
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
                        <TableCell className="text-sm">
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {t.date || t.created_at || "Just now"}
                          </div>
                          <div className="text-xs text-muted-foreground">By {t.dispatched_by}</div>
                        </TableCell>
                        <TableCell>
                          {isReturned ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="h-3 w-3" /> Returned & Restocked
                              </span>
                              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-emerald-600" />
                                {t.returned_date || t.returned_at || "Recently"} (By: {t.approved_by || "Administrator"})
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Clock className="h-3 w-3" /> Dispatched Out
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isReturned && isApprover && (
                            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleOpenApproveModal(t)}>
                              <CornerDownLeft className="mr-1.5 h-3.5 w-3.5" /> Approve & Restock
                            </Button>
                          )}
                          {!isReturned && !isApprover && (
                            <span className="text-xs text-muted-foreground font-medium flex items-center justify-end gap-1">
                              <Lock className="h-3.5 w-3.5" /> Read-Only
                            </span>
                          )}
                          {isReturned && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              ✓ Complete
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION CONTROLS FOR HIGH VOLUME (1000+ items) */}
          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs">
              <div className="text-muted-foreground text-center sm:text-left">
                Page <strong className="text-foreground">{validCurrentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong> ({totalItems} total logs)
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && validCurrentPage > 3) {
                    pageNum = validCurrentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={validCurrentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="h-8 w-8 text-xs p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
