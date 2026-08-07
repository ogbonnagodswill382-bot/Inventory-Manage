"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, FolderTree } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useState([]);
  const [search, setSearch] = useState("");
  
  // Add / Edit Modal states
  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const apiData = await getCategories();
    if (apiData && Array.isArray(apiData)) {
      setCategoryList(apiData);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditCategory(null);
    setName("");
    setDescription("");
    setOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditCategory(c);
    setName(c.name);
    setDescription(c.description || "");
    setOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      status: editCategory ? editCategory.status : "active",
    };

    let res;
    if (editCategory) {
      res = await updateCategory(editCategory.id, payload);
      if (res) toast.success("Category updated successfully!");
    } else {
      res = await createCategory(payload);
      if (res) toast.success("Category created successfully!");
    }

    if (res) {
      setOpen(false);
      await loadData();
    } else {
      toast.error("Failed to save category");
    }
    setSubmitting(false);
  };

  const handleDeleteCategory = async (id, catName) => {
    await deleteCategory(id);
    toast.success(`Deleted category "${catName}"`);
    await loadData();
  };

  const filteredCategories = categoryList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group your products for easier browsing and reporting."
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add category
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSaveCategory}>
            <DialogHeader>
              <DialogTitle>{editCategory ? "Edit category" : "New category"}</DialogTitle>
              <DialogDescription>
                {editCategory ? "Update category attributes in Django database." : "Create a new category to group related products."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Electronics, Home Appliances"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Description</Label>
                <Input
                  id="cat-desc"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editCategory ? "Save changes" : "Create category"}
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
              placeholder="Search categories…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <FolderTree className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No categories found in database. Click "+ Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.productCount ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">{c.created_at || "Just now"}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditModal(c)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(c.id, c.name)}>
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
        </CardContent>
      </Card>
    </div>
  );
}
