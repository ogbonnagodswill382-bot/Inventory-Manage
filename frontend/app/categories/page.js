"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, FolderTree, User, Clock, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { PageHeader, StatusBadge, pushSystemNotification } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useState([]);
  
  // Search & Pagination for 1000+ high-volume records
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
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
    } else {
      setCategoryList([]);
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
    const activeUser = getAuthUser();

    const payload = {
      name: name.trim(),
      description: description.trim(),
      status: editCategory ? editCategory.status : "active",
      created_by: activeUser?.name || "Administrator",
    };

    let res;
    if (editCategory) {
      res = await updateCategory(editCategory.id, payload);
      if (res) toast.success("Category updated successfully!");
    } else {
      res = await createCategory(payload);
      if (res && res.id) {
        toast.success("Category created successfully!");
        pushSystemNotification({
          title: `New Category Created: ${name.trim()}`,
          sub: description.trim() || 'Category created',
          message: `Category "${name.trim()}" was created by ${activeUser?.name || 'Administrator'}.`,
          type: "info",
          category: "activity",
          link: "/categories",
        });
      }
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

  // Filter categories list by search query
  const filteredCategories = categoryList.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.created_by || "").toLowerCase().includes(search.toLowerCase())
  );

  // Calculate pagination boundaries for high-capacity lists (1000+ items)
  const totalItems = filteredCategories.length;
  const effectivePageSize = pageSize === "all" ? Math.max(totalItems, 1) : Number(pageSize);
  const totalPages = Math.ceil(totalItems / effectivePageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * effectivePageSize;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + effectivePageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Group your products into organized categories with real-time tracking."
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
                {editCategory ? "Update category details and attributes." : "Create a new category for your products."}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories by name or creator..."
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
                  <TableHead>Category Name</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead>Created Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <FolderTree className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No categories found. Click "+ Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <div className="font-semibold text-foreground">{c.name}</div>
                        {c.description && <div className="text-xs text-muted-foreground font-normal">{c.description}</div>}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3 text-primary" /> {c.created_by || "Administrator"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{c.productCount ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <div className="font-medium text-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {c.date || c.created_at || "Just now"}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={c.status || "active"} /></TableCell>
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

          {/* PAGINATION CONTROLS FOR HIGH VOLUME (1000+ items) */}
          {pageSize !== "all" && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 border-t text-xs">
              <div className="text-muted-foreground text-center sm:text-left">
                Page <strong className="text-foreground">{validCurrentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong> ({totalItems} total categories)
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
