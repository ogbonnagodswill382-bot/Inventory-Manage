"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, Truck, User } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [supplierList, setSupplierList] = useState([]);
  const [search, setSearch] = useState("");
  
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
    };

    let res;
    if (editSupplier) {
      res = await updateSupplier(editSupplier.id, payload);
      if (res) toast.success("Supplier updated successfully!");
    } else {
      res = await createSupplier(payload);
      if (res) toast.success("Supplier created successfully!");
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

  const filteredSuppliers = supplierList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage vendor profiles, contact details, and procurement sources."
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add supplier
          </Button>
        }
      />

      {/* CREATE / EDIT SUPPLIER MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveSupplier}>
            <DialogHeader>
              <DialogTitle>{editSupplier ? "Edit supplier" : "Add new supplier"}</DialogTitle>
              <DialogDescription>
                {editSupplier ? "Update vendor details and contact information." : "Create a new supplier profile for inventory reordering."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-sm">
              <div className="space-y-1">
                <Label>Supplier / Company Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corporation" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Contact Person</Label>
                  <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Jane Doe" required />
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@acme.com" required />
              </div>
              <div className="space-y-1">
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Industrial Way, Suite 400" required />
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers or contact…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No suppliers found in database. Click "+ Add Supplier" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.address}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{s.contact}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3 text-primary" /> {s.created_by || "Administrator"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{s.productCount ?? 0}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditModal(s)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit supplier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSupplier(s.id, s.name)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete supplier
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
        </CardContent>
      </Card>
    </div>
  );
}
