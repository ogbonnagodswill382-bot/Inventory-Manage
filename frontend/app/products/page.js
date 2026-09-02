"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, MoreHorizontal, Edit, Trash2, Package, ChevronLeft, ChevronRight, User } from "lucide-react";
import { PageHeader, StatusBadge, pushSystemNotification } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductIcon, PRODUCT_ICON_OPTIONS } from "@/components/product-icon";
import { getProducts, getCategories, getSuppliers, createProduct, updateProduct, deleteProduct } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { exportToCSV } from "@/lib/export";
import { formatCurrency, getCurrencySymbol, getAppSettings } from "@/lib/theme";
import { toast } from "sonner";

export default function ProductsPage() {
  const [productList, setProductList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  
  // Filter states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add / Edit Modal states
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [price, setPrice] = useState("99.99");
  const [stock, setStock] = useState("10");
  const [threshold, setThreshold] = useState("5");
  const [emoji, setEmoji] = useState("package");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setCurrencySymbol(getCurrencySymbol());
    const [pData, cData, sData] = await Promise.all([
      getProducts(),
      getCategories(),
      getSuppliers(),
    ]);
    if (pData && Array.isArray(pData)) setProductList(pData);
    if (cData && Array.isArray(cData)) setCategories(cData);
    if (sData && Array.isArray(sData)) setSuppliers(sData);
  }

  useEffect(() => {
    loadData();
  }, []);

  const generateSequentialSKU = (existingProducts = []) => {
    let highestNum = 1000;
    if (Array.isArray(existingProducts)) {
      existingProducts.forEach((p) => {
        if (p.sku) {
          const matches = p.sku.match(/\d+/g);
          if (matches) {
            const num = parseInt(matches[matches.length - 1], 10);
            if (!isNaN(num) && num > highestNum) {
              highestNum = num;
            }
          }
        }
      });
    }
    const nextNum = highestNum + 1;
    return `PRD-${nextNum}`;
  };

  const handleOpenAddModal = () => {
    const appSettings = getAppSettings();
    setEditProduct(null);
    setName("");
    setSku(generateSequentialSKU(productList));
    setCategoryId(categories.length > 0 ? String(categories[0].id) : "");
    setSupplierId(suppliers.length > 0 ? String(suppliers[0].id) : "");
    setPrice("99.99");
    setStock("10");
    setThreshold(String(appSettings.lowStockThreshold || 10));
    setEmoji("package");
    setOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(String(p.category || categories[0]?.id || ""));
    setSupplierId(String(p.supplier || suppliers[0]?.id || ""));
    setPrice(String(p.price));
    setStock(String(p.stock));
    setThreshold(String(p.threshold));
    setEmoji(p.emoji || "package");
    setOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name || !categoryId || !supplierId) {
      toast.error("Please fill in required product fields");
      return;
    }

    setSubmitting(true);
    const finalSku = sku.trim() || generateSequentialSKU(productList);
    const activeUser = getAuthUser();

    const payload = {
      name,
      sku: finalSku,
      category: Number(categoryId),
      supplier: Number(supplierId),
      price: parseFloat(price),
      stock: parseInt(stock),
      threshold: parseInt(threshold),
      emoji,
      created_by: activeUser?.name || "Administrator",
      company_slug: activeUser?.company_slug || "default",
    };

    if (editProduct) {
      const res = await updateProduct(editProduct.id, payload);
      if (res && res.id) {
        toast.success(`Updated "${name}" successfully!`);
        setOpen(false);
        await loadData();
      } else {
        toast.error("Failed to update product");
      }
    } else {
      const res = await createProduct(payload);
      if (res && res.id) {
        toast.success(`Product "${name}" added to inventory!`);
        pushSystemNotification({
          title: `New Product Added: ${name}`,
          sub: `SKU: ${finalSku} · ${stock} units`,
          message: `Product "${name}" (SKU: ${finalSku}) was added to catalog with ${stock} initial units by ${activeUser?.name || 'Administrator'}.`,
          type: "success",
          category: "activity",
          link: "/products",
        });
        setOpen(false);
        await loadData();
      } else {
        toast.error(res?.error || "Failed to create product");
      }
    }
    setSubmitting(false);
  };

  const handleDeleteProduct = async (id, pName) => {
    const activeUser = getAuthUser();
    const res = await deleteProduct(id);
    if (res && res.success) {
      toast.success(`Product "${pName}" deleted`);
      pushSystemNotification({
        title: `Product Deleted: ${pName}`,
        sub: "Catalog Item Removed",
        message: `Product "${pName}" was deleted from inventory catalog by ${activeUser?.name || 'Administrator'}.`,
        type: "danger",
        category: "activity",
        link: "/products",
      });
      await loadData();
    } else {
      toast.error("Failed to delete product");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "SKU", "Category", "Supplier", `Price (${currencySymbol})`, "Stock", "Threshold", "Status", "Created By"];
    const rows = filteredProducts.map(p => [
      p.id,
      p.name,
      p.sku,
      p.category_name || "",
      p.supplier_name || "",
      p.price,
      p.stock,
      p.threshold,
      p.status,
      p.created_by || "Administrator",
    ]);
    exportToCSV("products_catalog.csv", headers, rows);
    toast.success("Downloaded products_catalog.csv");
  };

  const filteredProducts = productList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === "all" || String(p.category) === String(selectedCategoryFilter);
    const matchesSupplier =
      selectedSupplierFilter === "all" || String(p.supplier) === String(selectedSupplierFilter);
    const matchesStatus =
      selectedStatusFilter === "all" || p.status === selectedStatusFilter;

    return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div>
      <PageHeader
        title="Products Catalog"
        description="Manage your product catalog, stock balances, and author attribution."
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={handleOpenAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Add product
            </Button>
          </>
        }
      />

      {/* CREATE / EDIT PRODUCT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveProduct}>
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit product" : "Add new product"}</DialogTitle>
              <DialogDescription>
                {editProduct ? "Update product details and stock thresholds." : "Create a new product item in your inventory catalog."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-sm">
              <div className="space-y-1">
                <Label>Product Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Heavy Duty Steel Bolts" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Product Icon</Label>
                  <Select value={emoji} onValueChange={setEmoji}>
                    <SelectTrigger><SelectValue placeholder="Select Icon" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {PRODUCT_ICON_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Product Number / SKU (Auto-Generated)</Label>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. PRD-1001" />
                  <p className="text-[11px] text-muted-foreground">Auto-assigned sequentially (PRD-1001, PRD-1002...). You can edit manually if needed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <Label>Unit Price ({currencySymbol})</Label>
                  <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 1000" required />
                  {price && !isNaN(Number(price)) && Number(price) > 0 && (
                    <p className="text-xs text-muted-foreground font-medium pt-0.5">
                      Amount: <span className="font-semibold text-foreground">{formatCurrency(price)}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label>Initial Stock Qty</Label>
                  <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label>Low Stock Alert Level</Label>
                  <Input type="number" min="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editProduct ? "Save changes" : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* FILTER & SEARCH BAR */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            <div>
              <Select value={selectedCategoryFilter} onValueChange={(val) => { setSelectedCategoryFilter(val); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Category: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Category: All</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedSupplierFilter} onValueChange={(val) => { setSelectedSupplierFilter(val); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Supplier: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Supplier: All</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedStatusFilter} onValueChange={(val) => { setSelectedStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Status: All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRODUCT LIST TABLE */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No products found matching your filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductIcon name={p.name} categoryName={p.category_name} emoji={p.emoji} />
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.category_name || "Uncategorized"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.supplier_name || "Direct Supplier"}</TableCell>
                      <TableCell className="text-sm font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3 text-primary" /> {p.created_by || "Administrator"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.price)}</TableCell>
                      <TableCell className="text-right font-semibold">{p.stock}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEditModal(p)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit product
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(p.id, p.name)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete product
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

          {/* TABLE PAGINATION BAR */}
          {totalItems > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-2 font-medium">
                  Showing {startIndex + 1}-{endIndex} of {totalItems} items
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="mr-2 font-medium">
                  Page {validCurrentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
