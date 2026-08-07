"use client";

import { useState, useEffect } from "react";
import { Plus, Mail, Phone, MapPin, MoreHorizontal, Edit, Trash2, Truck } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/api";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [supplierList, setSupplierList] = useState([]);
  
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
    if (!name.trim()) {
      toast.error("Please enter a supplier name");
      return;
    }
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      contact: contact.trim() || "Main Contact",
      email: email.trim() || "supplier@example.com",
      phone: phone.trim() || "+1 555-0000",
      address: address.trim() || "Primary Warehouse Address",
      status: editSupplier ? editSupplier.status : "active",
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

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description={`${supplierList.length} active partners providing your inventory.`}
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
                {editSupplier ? "Update supplier partner details in Django." : "Add a new supplier partner into Django database."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-sm">
              <div className="space-y-1">
                <Label htmlFor="sup-name">Company Name</Label>
                <Input id="sup-name" placeholder="e.g. NorthWind Traders" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sup-contact">Contact Person</Label>
                <Input id="sup-contact" placeholder="e.g. Alice Chen" value={contact} onChange={(e) => setContact(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="sup-email">Email</Label>
                  <Input id="sup-email" type="email" placeholder="alice@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sup-phone">Phone</Label>
                  <Input id="sup-phone" placeholder="+1 555-0199" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sup-address">Address</Label>
                <Input id="sup-address" placeholder="San Francisco, CA" value={address} onChange={(e) => setAddress(e.target.value)} />
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

      {supplierList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="font-semibold text-base text-foreground">No suppliers found in database</p>
            <p className="text-xs text-muted-foreground mt-1">Click "+ Add Supplier" to register your first partner.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplierList.map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-semibold">
                      {s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.contact}</div>
                    </div>
                  </div>
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
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{s.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{s.address}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Products supplied</div>
                    <div className="text-lg font-semibold">{s.productCount ?? 0}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
