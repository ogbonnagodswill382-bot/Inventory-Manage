"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  History,
  BarChart3,
  Bell,
  Users,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  Menu,
  Boxes,
  Sparkles,
  Sun,
  Moon,
  CheckCheck,
  Trash2,
  X,
  UserPlus,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Info,
  ExternalLink,
  ShieldAlert,
  Mail,
  Building2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getAuthUser, isAuthenticated, isRouteAllowed, logoutUser, getRegisteredCompanySlug } from "@/lib/auth";
import { applyTheme, getStoredTheme, formatCurrency, getAppSettings } from "@/lib/theme";
import { getProducts, getCategories, getSuppliers, getMovements, getTransfers, getContactRequests } from "@/lib/api";
import { ProductIcon } from "@/components/product-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/categories", label: "Categories", icon: FolderTree, group: "Inventory" },
  { href: "/products", label: "Products", icon: Package, group: "Inventory" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, group: "Inventory" },
  { href: "/stock-in", label: "Stock In", icon: ArrowDownToLine, group: "Stock" },
  { href: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine, group: "Stock" },
  { href: "/transfers", label: "Transfers & Returns", icon: ArrowLeftRight, group: "Stock" },
  { href: "/stock-history", label: "Stock History", icon: History, group: "Stock" },
  { href: "/reports", label: "Reports", icon: BarChart3, group: "Insights" },
  { href: "/alerts", label: "Alerts", icon: Bell, group: "Insights", danger: true },
  { href: "/users", label: "Users", icon: Users, group: "Admin" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Admin" },
];

export function getStoredSystemNotifications() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("stockflow_custom_activity_notifications");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushSystemNotification({ title, sub, message, type = "info", category = "activity", link = "/" }) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredSystemNotifications();
    const now = new Date();
    const newId = `custom-act-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const newNotification = {
      id: newId,
      title,
      sub,
      message,
      type,
      category,
      link,
      time: `${formattedDate}, ${formattedTime}`,
      timestamp: now.getTime(),
    };
    list.unshift(newNotification);
    localStorage.setItem("stockflow_custom_activity_notifications", JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.error("Failed to push notification:", e);
  }
}

function getStoredClearedNotifications() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("stockflow_cleared_notifications");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addStoredClearedNotification(id) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredClearedNotifications();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem("stockflow_cleared_notifications", JSON.stringify(list));
    }
  } catch {}
}

function addAllStoredClearedNotifications(ids) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredClearedNotifications();
    ids.forEach((id) => {
      if (!list.includes(id)) list.push(id);
    });
    localStorage.setItem("stockflow_cleared_notifications", JSON.stringify(list));
  } catch {}
}

function getStoredReadNotifications() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("stockflow_read_notifications");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addStoredReadNotification(id) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredReadNotifications();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem("stockflow_read_notifications", JSON.stringify(list));
    }
  } catch {}
}

function addAllStoredReadNotifications(ids) {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredReadNotifications();
    ids.forEach((id) => {
      if (!list.includes(id)) list.push(id);
    });
    localStorage.setItem("stockflow_read_notifications", JSON.stringify(list));
  } catch {}
}

function SidebarContent({ onNavigate, collapsed = false, onToggleCollapse }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState({
    name: "User",
    role: "Warehouse Staff",
    avatar: "US",
  });
  const [userTier, setUserTier] = useState(null); // Dynamic usage tier (ACTIVE | PRO | ENTERPRISE)

  useEffect(() => {
    const user = getAuthUser();
    if (user) setCurrentUser(user);

    async function calculateUsageTier() {
      const [prods, moves] = await Promise.all([getProducts(), getMovements()]);
      const prodCount = (prods && Array.isArray(prods)) ? prods.length : 0;
      const moveCount = (moves && Array.isArray(moves)) ? moves.length : 0;
      const totalActivity = prodCount + moveCount;

      if (totalActivity >= 50) {
        setUserTier("ENTERPRISE");
      } else if (totalActivity >= 15) {
        setUserTier("PRO");
      } else if (totalActivity >= 5) {
        setUserTier("ACTIVE");
      } else {
        setUserTier(null); // Clean view for new users until activity builds up!
      }
    }
    calculateUsageTier();
  }, []);

  const allowedNav = nav.filter((n) => isRouteAllowed(currentUser.role, n.href));
  const groups = Array.from(new Set(allowedNav.map((n) => n.group)));

  return (
    <div className="flex h-full min-h-full w-full flex-col bg-sidebar text-sidebar-foreground select-none">
      {/* Brand Header */}
      <div className={cn("flex items-center justify-between py-4 border-b border-sidebar-border/80", collapsed ? "px-3 flex-col gap-3" : "px-5")}>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 min-w-0 group">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Boxes className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-sidebar-foreground truncate flex items-center gap-1.5">
                StockFlow
                {userTier && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary animate-in fade-in">
                    {userTier}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-primary font-medium truncate flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{currentUser?.company_name || "Inventory Suite"}</span>
              </div>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Fold back sidebar"}
            className="hidden lg:grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sidebar-accent/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer border border-sidebar-border/60 shadow-2xs"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4 text-primary" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5 scrollbar-thin scrollbar-thumb-sidebar-border">
        {groups.map((g) => (
          <div key={g} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {g}
              </div>
            )}
            <div className="space-y-0.5">
              {allowedNav.filter((n) => n.group === g).map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-150",
                      collapsed ? "px-2.5 justify-center" : "px-3",
                      active
                        ? "bg-primary/10 text-primary font-semibold shadow-xs"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              <span className="font-semibold text-base tracking-tight text-sidebar-foreground truncate block">StockFlow</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Inventory Manager</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition cursor-pointer"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
                collapsed ? "justify-center h-10 w-10 mx-auto px-0" : "px-3 py-2.5",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* TIER STATUS BADGE CARD */}
      {!collapsed && userTier && (
        <div className="px-3 py-2">
          <div className="rounded-xl border bg-sidebar-accent/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace Tier</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                userTier === "ENTERPRISE" ? "bg-amber-500/20 text-amber-500" :
                userTier === "PRO" ? "bg-primary/20 text-primary" :
                "bg-emerald-500/20 text-emerald-500"
              )}>
                {userTier}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Authorized permissions active.</p>
          </div>
        </div>
      )}

      {/* Footer User Profile */}
      <div className={cn("mt-auto shrink-0 border-t border-sidebar-border p-3 flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/profile" onClick={onNavigate} className="flex items-center gap-2.5 min-w-0 flex-1 hover:bg-sidebar-accent/60 p-1.5 rounded-lg transition">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">{currentUser.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{currentUser.role}</div>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onRequestLogout}
            title="Logout"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);

  useEffect(() => {
    async function loadCatalog() {
      const [prods, cats, sups] = await Promise.all([
        getProducts(),
        getCategories(),
        getSuppliers(),
      ]);
      if (prods && Array.isArray(prods)) setAllProducts(prods);
      if (cats && Array.isArray(cats)) setAllCategories(cats);
      if (sups && Array.isArray(sups)) setAllSuppliers(sups);
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matchingProducts = q ? allProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) : [];
  const matchingCategories = q ? allCategories.filter(c => c.name.toLowerCase().includes(q)) : [];
  const matchingSuppliers = q ? allSuppliers.filter(s => s.name.toLowerCase().includes(q)) : [];
  const hasResults = matchingProducts.length > 0 || matchingCategories.length > 0 || matchingSuppliers.length > 0;

  const handleSubmitSearch = (e) => {
    e?.preventDefault();
    if (!q) return;
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectProduct = (p) => {
    setOpen(false);
    setQuery("");
    router.push(`/products?search=${encodeURIComponent(p.name)}`);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[130px] min-w-0 xs:max-w-[180px] sm:max-w-md">
      <form onSubmit={handleSubmitSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-8 bg-muted/50 border-transparent focus-visible:bg-background text-xs sm:text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* LIVE SEARCH RESULTS DROPDOWN POPOVER */}
      {open && q && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto text-xs p-2 space-y-3 animate-in fade-in slide-in-from-top-1">
          {!hasResults ? (
            <div className="p-4 text-center text-muted-foreground">
              No matches found for <span className="font-semibold">"{query}"</span>
            </div>
          ) : (
            <>
              {/* PRODUCTS */}
              {matchingProducts.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3 text-primary" /> Products ({matchingProducts.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingProducts.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <ProductIcon name={p.name} categoryName={p.category_name} emoji={p.emoji} className="h-7 w-7 rounded-md" iconClassName="h-3.5 w-3.5" />
                          <div className="min-w-0">
                            <div className="font-medium truncate text-foreground">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-foreground">{formatCurrency(p.price)}</div>
                          <div className="text-[10px] text-muted-foreground font-medium">{p.stock} in stock</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORIES */}
              {matchingCategories.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                    <FolderTree className="h-3 w-3 text-primary" /> Categories ({matchingCategories.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingCategories.slice(0, 3).map((c) => (
                      <Link
                        key={c.id}
                        href="/categories"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 transition"
                      >
                        <span className="font-medium text-foreground">{c.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* SUPPLIERS */}
              {matchingSuppliers.length > 0 && (
                <div>
                  <div className="px-2 py-1 font-semibold uppercase tracking-wider text-[10px] text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3 text-primary" /> Suppliers ({matchingSuppliers.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {matchingSuppliers.slice(0, 3).map((s) => (
                      <Link
                        key={s.id}
                        href="/suppliers"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 transition"
                      >
                        <span className="font-medium text-foreground">{s.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1 border-t">
                <button
                  type="button"
                  onClick={handleSubmitSearch}
                  className="w-full text-center text-xs font-semibold text-primary py-1.5 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  View all results for "{query}" <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [configuredEmail, setConfiguredEmail] = useState("");

  useEffect(() => {
    const s = getAppSettings();
    if (s && s.contactEmail) {
      setConfiguredEmail(s.contactEmail);
    }
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      const activeUser = getAuthUser();
      const isAdmin = activeUser?.role === "Administrator";
      const clearedList = getStoredClearedNotifications();
      const readList = getStoredReadNotifications();
      setReadIds(readList);

      const [prods, moves, contactReqs, transfersList] = await Promise.all([
        getProducts(),
        getMovements(),
        isAdmin ? getContactRequests() : Promise.resolve([]),
        getTransfers(),
      ]);
      
      const list = [];

      // Admin Contact Requests Notifications
      if (isAdmin && contactReqs && Array.isArray(contactReqs)) {
        contactReqs.forEach((r) => {
          const id = `contact-${r.id}`;
          if (!clearedList.includes(id)) {
            const reqTimestamp = r.created_at ? new Date(r.created_at).getTime() : Date.now();
            list.push({
              id,
              title: `Staff Access Request: ${r.name}`,
              sub: `${r.email} — "${r.message}"`,
              message: r.message,
              applicantName: r.name,
              applicantEmail: r.email,
              time: r.date || "Just now",
              timestamp: reqTimestamp,
              type: "contact",
              category: "requests",
              link: `/users?name=${encodeURIComponent(r.name)}&email=${encodeURIComponent(r.email)}`,
            });
          }
        });
      }

      // Returned & Approved Goods Notifications
      if (transfersList && Array.isArray(transfersList)) {
        transfersList.forEach((t) => {
          if (t.status === "returned_to_stock") {
            const id = `transfer-ret-${t.id}`;
            if (!clearedList.includes(id)) {
              const retTimestamp = t.returned_date ? new Date(t.returned_date).getTime() : Date.now();
              list.push({
                id,
                title: `Goods Returned & Approved: ${t.product_name}`,
                sub: `+${t.quantity} units from ${t.destination} · Approved by ${t.approved_by || 'Administrator'}`,
                message: `Goods Return Audit Approved: ${t.quantity} units of "${t.product_name}" (SKU: ${t.product_sku}) were returned back from ${t.destination} and restocked directly into warehouse inventory. Approved by ${t.approved_by || 'Administrator'}.`,
                time: t.returned_date || "Recently",
                timestamp: retTimestamp,
                type: "success",
                category: "activity",
                link: "/transfers",
              });
            }
          }
        });
      }

      if (prods && Array.isArray(prods)) {
        prods.forEach((p) => {
          if (p.stock === 0) {
            const id = `out-${p.id}`;
            if (!clearedList.includes(id)) {
              list.push({
                id,
                title: `${p.name} is out of stock!`,
                sub: `SKU: ${p.sku} · 0 units remaining (Threshold: ${p.threshold})`,
                message: `Critical Inventory Alert: "${p.name}" (SKU: ${p.sku}) has reached 0 units in warehouse stock. Reorder minimum threshold is ${p.threshold} units.`,
                productName: p.name,
                sku: p.sku,
                stock: p.stock,
                threshold: p.threshold,
                time: "Urgent Alert",
                timestamp: Date.now() + 5000, // Urgent live alerts pinned near top
                type: "danger",
                category: "urgent",
                link: `/stock-in?product=${p.id}`,
              });
            }
          } else if (p.stock <= p.threshold) {
            const id = `low-${p.id}`;
            if (!clearedList.includes(id)) {
              list.push({
                id,
                title: `${p.name} low stock warning`,
                sub: `${p.stock} units remaining (Threshold: ${p.threshold})`,
                message: `Low Stock Warning: "${p.name}" (SKU: ${p.sku}) currently has ${p.stock} units remaining, which is below or equal to your warning threshold of ${p.threshold} units.`,
                productName: p.name,
                sku: p.sku,
                stock: p.stock,
                threshold: p.threshold,
                time: "Warning",
                timestamp: Date.now() + 1000,
                type: "warning",
                category: "urgent",
                link: `/stock-in?product=${p.id}`,
              });
            }
          }
        });
      }

      if (moves && Array.isArray(moves)) {
        moves.slice(0, 5).forEach((m) => {
          const id = `move-${m.id}`;
          if (!clearedList.includes(id)) {
            const moveTimestamp = m.date ? new Date(m.date).getTime() : Date.now();
            list.push({
              id,
              title: `Stock ${m.type === "in" ? "Received (+)" : "Dispatched (-)"}`,
              sub: `${m.product_name} · ${m.quantity} units by ${m.user}`,
              message: `Audit Record: ${m.quantity} units of "${m.product_name}" were ${m.type === "in" ? "received into stock" : "dispatched out of stock"} by ${m.user}. Reference: ${m.reference || 'PO/SO'}.`,
              time: m.date || "Recently",
              timestamp: moveTimestamp,
              type: m.type === "in" ? "success" : "info",
              category: "activity",
              link: "/stock-history",
            });
          }
        });
      }

      const customList = getStoredSystemNotifications();
      if (customList && Array.isArray(customList)) {
        customList.forEach((c) => {
          if (!clearedList.includes(c.id)) {
            const cTimestamp = c.timestamp || Date.now();
            // Staff Access Requests are restricted EXCLUSIVELY to Company Administrators
            if (c.category === "requests" || c.type === "contact" || c.title?.includes("Staff Access Request")) {
              if (isAdmin) list.push({ ...c, timestamp: cTimestamp });
            } else {
              list.push({ ...c, timestamp: cTimestamp });
            }
          }
        });
      }

      // SORT ALL NOTIFICATIONS REVERSE-CHRONOLOGICALLY (NEWEST AT THE TOP, PREVIOUS ONES AT THE BOTTOM)
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setNotifications(list);
    }
    loadNotifications();
  }, []);

  const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "urgent") return n.category === "urgent";
    if (activeTab === "requests") return n.category === "requests";
    if (activeTab === "activity") return n.category === "activity";
    return true;
  });

  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    addAllStoredReadNotifications(allIds);
    setReadIds(allIds);
    toast.success("All notifications marked as read");
  };

  const handleDeleteNotification = (id, e) => {
    e?.stopPropagation();
    e?.preventDefault();
    addStoredClearedNotification(id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    if (selectedNotification?.id === id) setSelectedNotification(null);
    toast.success("Notification deleted permanently");
  };

  const handleClearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    addAllStoredClearedNotifications(allIds);
    addAllStoredReadNotifications(allIds);
    setNotifications([]);
    setReadIds(allIds);
    setSelectedNotification(null);
    toast.success("All notifications cleared permanently");
  };

  const handleOpenNotificationDetail = (n) => {
    addStoredReadNotification(n.id);
    setReadIds((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));
    setSelectedNotification(n);
  };

  const handleResolveAction = (n) => {
    setSelectedNotification(null);
    router.push(n.link);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative shrink-0">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 p-0 shadow-2xl rounded-2xl border">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllNotifications}
                  title="Clear all notifications permanently"
                  className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Read All
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex items-center gap-1 border-b px-2 py-1.5 bg-muted/20 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium cursor-pointer",
                activeTab === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("urgent")}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium cursor-pointer",
                activeTab === "urgent" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Urgent ({notifications.filter(n => n.category === "urgent").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium cursor-pointer",
                activeTab === "requests" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Requests ({notifications.filter(n => n.category === "requests").length})
            </button>
          </div>

          {configuredEmail && (
            <div className="bg-primary/10 border-b px-3.5 py-2 text-[11px] text-primary flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                Email Digest: <strong className="font-semibold text-foreground truncate">{configuredEmail}</strong>
              </span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-background border-primary/30 shrink-0">
                Dispatched ✉️
              </Badge>
            </div>
          )}

          {/* LIST */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <Bell className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                <div className="font-medium text-foreground">No notifications here</div>
                <div>Your inbox is clean for this category.</div>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isRead = readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleOpenNotificationDetail(n)}
                    className={cn(
                      "group relative flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/60 transition cursor-pointer",
                      !isRead && "bg-primary/5 font-semibold",
                      n.type === "contact" && "border-l-2 border-l-primary"
                    )}
                  >
                    <span className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.type === "contact" && "bg-primary",
                      n.type === "danger" && "bg-destructive",
                      n.type === "warning" && "bg-warning",
                      n.type === "info" && "bg-info",
                      n.type === "success" && "bg-success"
                    )} />
                    
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5 text-foreground">
                        {n.type === "contact" && <UserPlus className="h-3.5 w-3.5 text-primary" />}
                        {n.title}
                        {!isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{n.sub}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-2">
                        <span>{n.time}</span>
                        <span className="text-primary font-medium group-hover:underline">Open message →</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      title="Delete notification"
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t p-2 bg-muted/20">
            <Button asChild variant="ghost" className="w-full text-xs font-semibold">
              <Link href="/alerts">View full alerts dashboard →</Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* FULL NOTIFICATION MESSAGE DETAIL DIALOG MODAL */}
      <Dialog open={!!selectedNotification} onOpenChange={(v) => !v && setSelectedNotification(null)}>
        {selectedNotification && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                {selectedNotification.type === "contact" && <UserPlus className="h-5 w-5 text-primary" />}
                {selectedNotification.type === "danger" && <ShieldAlert className="h-5 w-5 text-destructive" />}
                {selectedNotification.type === "warning" && <AlertTriangle className="h-5 w-5 text-warning" />}
                {selectedNotification.type === "info" && <Info className="h-5 w-5 text-info" />}
                {selectedNotification.type === "success" && <CheckCheck className="h-5 w-5 text-success" />}
                <DialogTitle className="text-base font-semibold">{selectedNotification.title}</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Received: {selectedNotification.time}
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-3 text-sm">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Issue / Message Detail
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.applicantEmail && (
                <div className="rounded-lg border p-3 text-xs space-y-1 bg-primary/5 border-primary/20">
                  <div className="font-semibold text-primary">Applicant Contact Info:</div>
                  <div>Name: <span className="font-medium text-foreground">{selectedNotification.applicantName}</span></div>
                  <div>Email: <span className="font-medium text-foreground">{selectedNotification.applicantEmail}</span></div>
                </div>
              )}

              {configuredEmail && (
                <div className="rounded-lg border p-3 text-xs space-y-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Company Contact Email Alert Status:
                  </div>
                  <div>
                    An instant notification alert for this event was auto-dispatched to <strong className="underline text-foreground">{configuredEmail}</strong>.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteNotification(selectedNotification.id)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedNotification(null)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => handleResolveAction(selectedNotification)}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Resolve Issue
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState("dark");

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
  }, []);

  const toggle = () => {
    const next = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(next);
    applyTheme(next);
    toast.success(`Switched to ${next === "dark" ? "Dark Mode 🌙" : "Light Mode ☀️"}`);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title="Toggle Dark/Light Mode" className="shrink-0">
      {currentTheme === "dark" ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
    </Button>
  );
}

function UserMenu({ onRequestLogout }) {
  const [currentUser, setCurrentUser] = useState({
    name: "User",
    role: "Warehouse Staff",
    avatar: "US",
  });

  useEffect(() => {
    const user = getAuthUser();
    if (user) setCurrentUser(user);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 pl-2 pr-3 shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <div className="text-sm font-medium leading-none">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{currentUser.role}</div>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onRequestLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeCompanyName, setActiveCompanyName] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  
  const isPublicPage = pathname === "/login" || pathname === "/landing";

  useEffect(() => {
    applyTheme(getStoredTheme());

    if (isPublicPage) {
      if (pathname === "/landing" && isAuthenticated()) {
        router.replace("/");
        return;
      }
      setCheckingAuth(false);
      return;
    }

    if (!isAuthenticated()) {
      router.push("/landing");
      return;
    }

    const activeUser = getAuthUser();
    if (activeUser) {
      if (activeUser.company_name) setActiveCompanyName(activeUser.company_name);
      if (!isRouteAllowed(activeUser.role, pathname)) {
        toast.error("Access Restricted", {
          description: `Your role (${activeUser.role}) does not have permission to view ${pathname}.`,
        });
        router.push("/");
        return;
      }
    }

    setCheckingAuth(false);
  }, [pathname, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-3 animate-pulse">
          <Boxes className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">Verifying role permissions...</p>
      </div>
    );
  }

  const handleRequestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logoutUser();
  };

  return (
    <div className="min-h-screen w-full bg-muted/30">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 h-full border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} onRequestLogout={handleRequestLogout} />
      </aside>

      {/* Main Workspace Area */}
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 border-b bg-background/80 px-3 sm:px-6 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 max-w-[85vw] p-0 bg-sidebar border-r border-sidebar-border overflow-hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>StockFlow inventory workspace navigation links.</SheetDescription>
              </SheetHeader>
              <SidebarContent onNavigate={() => setOpen(false)} onRequestLogout={handleRequestLogout} />
            </SheetContent>
          </Sheet>

          <GlobalSearch />

          {activeCompanyName && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shrink-0 ml-1">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{activeCompanyName}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Notifications />
            <UserMenu onRequestLogout={handleRequestLogout} />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>

        <footer className="border-t px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <div>
            © 2026 StockFlow. Created by{" "}
            <a
              href="https://swivex-personal.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold tracking-tight text-foreground hover:text-primary underline decoration-primary/40 underline-offset-4 transition-all duration-200"
            >
              Swivex
            </a>. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">Dashboard Overview</Link>
            <span>v2.4.1</span>
            <span>Support</span>
          </div>
        </footer>
      </div>

      {/* LOGOUT CONFIRMATION MODAL DIALOG */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" /> Confirm Logout
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to log out of StockFlow? You will need to enter your password to sign back into your account.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button variant="outline" type="button" onClick={() => setShowLogoutConfirm(false)}>
              No, Stay Logged In
            </Button>
            <Button variant="destructive" type="button" onClick={handleConfirmLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Yes, Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-snug">{title}</h1>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    in_stock: { label: "In Stock", cls: "bg-success/10 text-success border-success/20" },
    low_stock: { label: "Low Stock", cls: "bg-warning/15 text-warning-foreground border-warning/30 [color:oklch(0.5_0.15_65)]" },
    out_of_stock: { label: "Out of Stock", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    active: { label: "Active", cls: "bg-success/10 text-success border-success/20" },
    inactive: { label: "Inactive", cls: "bg-muted text-muted-foreground border-border" },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", s.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
