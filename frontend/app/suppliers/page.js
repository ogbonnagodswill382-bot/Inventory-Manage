"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, Truck, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, StatusBadge, pushSystemNotification } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [supplierList, setSupplierList] = useState([]);
  
  // Search & Pagination for 1000+ high-volume records
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Add / Edit Modal states
  const [open, setOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const apiData = await getSuppliers();
    if (apiData && Array.isArray(apiData)) {
      setSupplierList(apiData);
    } else {
      setSupplierList([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditSupplier(null);
    setName("");
    setContact("");
    setEmail("");
    setPhone("");
    setAddress("");
    setOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditSupplier(s);
    setName(s.name);
    setContact(s.contact || "");
    setEmail(s.email || "");
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter supplier name and email");
      return;
    }

    setSubmitting(true);
    const activeUser = getAuthUser();

    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: editSupplier ? editSupplier.status : "active",
      created_by: activeUser?.name || "Administrator",
      company_slug: activeUser?.company_slug || "default",
    };

    let res;
    if (editSupplier) {
      res = await updateSupplier(editSupplier.id, payload);
      if (res) toast.success("Supplier updated successfully!");
    } else {
      res = await createSupplier(payload);
      if (res && res.id) {
        toast.success("Supplier registered successfully!");
        pushSystemNotification({
          title: `New Supplier Added: ${name.trim()}`,
          sub: email.trim() || contact.trim() || 'Supplier registered',
          message: `Supplier "${name.trim()}" (${email.trim()}) was registered by ${activeUser?.name || 'Administrator'}.`,
          type: "info",
          category: "activity",
          link: "/suppliers",
        });
      }
    }

    if (res) {
      setOpen(false);
      await loadData();
    } else {
      toast.error("Failed to save supplier");
    }
    setSubmitting(false);
  };

  const handleDeleteSupplier = async (id, sName) => {
    await deleteSupplier(id);
    toast.success(`Deleted supplier "${sName}"`);
    await loadData();
  };

  // Filter suppliers list by search query
  const filteredSuppliers = supplierList.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.contact || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.address || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.created_by || "").toLowerCase().includes(search.toLowerCase())
  );

  // Calculate pagination boundaries for high-capacity lists (1000+ items)
  const totalItems = filteredSuppliers.length;
  const effectivePageSize = pageSize === "all" ? Math.max(totalItems, 1) : Number(pageSize);
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * effectivePageSize;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + effectivePageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage vendor details, contacts, and supply history."
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add supplier
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveSupplier}>
            <DialogHeader>
              <DialogTitle>{editSupplier ? "Edit supplier" : "New supplier"}</DialogTitle>
              <DialogDescription>
                {editSupplier ? "Update vendor details and contact info." : "Add a new vendor or supplier."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <Label htmlFor="sup-name">Company / Vendor Name</Label>
                <Input
                  id="sup-name"
                  placeholder="e.g. Acme Components Inc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sup-contact">Contact Representative</Label>
                <Input
                  id="sup-contact"
                  placeholder="e.g. John Doe"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sup-email">Email Address</Label>
                  <Input
                    id="sup-email"
                    type="email"
                    placeholder="orders@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sup-phone">Phone Number</Label>
                  <Input
                    id="sup-phone"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sup-address">Warehouse / Headquarter Address</Label>
                <Input
                  id="sup-address"
                  placeholder="e.g. 100 Enterprise Way, Suite 400"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editSupplier ? "Save changes" : "Create supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, email, address..."
                className="pl-9 text-xs sm:text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(val === "all" ? "all" : Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[130px] text-xs sm:text-sm">
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

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Company</TableHead>
                  <TableHead>Contact Representative</TableHead>
                  <TableHead>Registered By</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Registered Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No suppliers found. Click "+ Add Supplier" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSuppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{s.contact || "Direct Contact"}</div>
                        {s.phone && <div className="text-muted-foreground">{s.phone}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3 text-primary" /> {s.created_by || "Administrator"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs">{s.productCount ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {s.date || s.created_at || "Just now"}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={s.status || "active"} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditModal(s)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSupplier(s.id, s.name)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION CONTROLS FOR HIGH VOLUME (1000+ items) */}
          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 border-t text-xs">
              <div className="text-muted-foreground text-center sm:text-left">
                Page <strong className="text-foreground">{validCurrentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong> ({totalItems} total suppliers)
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
