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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getAuthUser, isAuthenticated, isRouteAllowed, logoutUser } from "@/lib/auth";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { getProducts, getCategories, getSuppliers, getMovements, getContactRequests } from "@/lib/api";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/categories", label: "Categories", icon: FolderTree, group: "Inventory" },
  { href: "/products", label: "Products", icon: Package, group: "Inventory" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, group: "Inventory" },
  { href: "/stock-in", label: "Stock In", icon: ArrowDownToLine, group: "Stock" },
  { href: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine, group: "Stock" },
  { href: "/stock-history", label: "Stock History", icon: History, group: "Stock" },
  { href: "/reports", label: "Reports", icon: BarChart3, group: "Insights" },
  { href: "/alerts", label: "Alerts", icon: Bell, group: "Insights", danger: true },
  { href: "/users", label: "Users", icon: Users, group: "Admin" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Admin" },
];

function SidebarContent({ onNavigate, collapsed = false, onToggleCollapse }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState({
    name: "User",
    role: "Warehouse Staff",
    avatar: "US",
  });

  useEffect(() => {
    const user = getAuthUser();
    if (user) setCurrentUser(user);
  }, []);

  const allowedNav = nav.filter((n) => isRouteAllowed(currentUser.role, n.href));
  const groups = Array.from(new Set(allowedNav.map((n) => n.group)));

  return (
    <div className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground select-none transition-all duration-200", collapsed ? "w-16" : "w-64")}>
      {/* Brand Header */}
      <div className={cn("flex items-center justify-between py-4 border-b border-sidebar-border/80", collapsed ? "px-3" : "px-5")}>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 min-w-0 group">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Boxes className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-sidebar-foreground truncate flex items-center gap-1.5">
                StockFlow
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate">Inventory Suite</div>
            </div>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition cursor-pointer"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
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
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick Status Card */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-sidebar-foreground">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Role Access
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {currentUser.role}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Authorized permissions active.</p>
          </div>
        </div>
      )}

      {/* Footer User Profile */}
      <div className={cn("border-t border-sidebar-border p-3 flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
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
            onClick={logoutUser}
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
    <div ref={containerRef} className="relative flex-1 max-w-xs sm:max-w-md">
      <form onSubmit={handleSubmitSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products, SKUs, suppliers…"
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
                          <div className="font-semibold text-foreground">${Number(p.price).toFixed(2)}</div>
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
  const [notifications, setNotifications] = useState([]);
  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    async function loadNotifications() {
      const activeUser = getAuthUser();
      const isAdmin = activeUser?.role === "Administrator";

      const [prods, moves, contactReqs] = await Promise.all([
        getProducts(),
        getMovements(),
        isAdmin ? getContactRequests() : Promise.resolve([]),
      ]);
      
      const list = [];

      // Admin Contact Requests Notifications
      if (isAdmin && contactReqs && Array.isArray(contactReqs)) {
        contactReqs.forEach((r) => {
          list.push({
            id: `contact-${r.id}`,
            title: `Access Request: ${r.name}`,
            sub: `${r.email} — "${r.message}"`,
            time: r.date || "Just now",
            type: "contact",
            link: `/users?name=${encodeURIComponent(r.name)}&email=${encodeURIComponent(r.email)}`,
          });
        });
      }

      if (prods && Array.isArray(prods)) {
        prods.forEach((p) => {
          if (p.stock === 0) {
            list.push({
              id: `out-${p.id}`,
              title: `${p.name} is out of stock!`,
              sub: `SKU: ${p.sku} · 0 units remaining`,
              time: "Urgent",
              type: "danger",
              link: `/stock-in?product=${p.id}`,
            });
          } else if (p.stock <= p.threshold) {
            list.push({
              id: `low-${p.id}`,
              title: `${p.name} low stock warning`,
              sub: `${p.stock} units remaining (Threshold: ${p.threshold})`,
              time: "Warning",
              type: "warning",
              link: `/stock-in?product=${p.id}`,
            });
          }
        });
      }

      if (moves && Array.isArray(moves)) {
        moves.slice(0, 3).forEach((m) => {
          list.push({
            id: `move-${m.id}`,
            title: `Stock ${m.type === "in" ? "Received (+)" : "Dispatched (-)"}`,
            sub: `${m.product_name} · ${m.quantity} units by ${m.user}`,
            time: m.date || "Recently",
            type: m.type === "in" ? "success" : "info",
            link: "/stock-history",
          });
        });
      }

      setNotifications(list);
    }
    loadNotifications();
  }, []);

  const unreadCount = Math.max(0, notifications.length - readCount);

  const handleMarkAllRead = () => {
    setReadCount(notifications.length);
    toast.success("All notifications marked as read");
  };

  const handleDeleteNotification = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    toast.success("Notification deleted");
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setReadCount(0);
    toast.success("All notifications cleared");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold text-sm">Notifications</div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllNotifications}
                title="Clear all notifications"
                className="text-xs text-destructive hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All
              </button>
            )}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Read
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No notifications. Your inbox is empty.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group relative flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50 transition",
                  n.type === "contact" && "bg-primary/5 border-l-2 border-l-primary"
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
                
                <Link href={n.link} className="min-w-0 flex-1 pr-4 cursor-pointer">
                  <div className="text-sm font-medium truncate flex items-center gap-1.5">
                    {n.type === "contact" && <UserPlus className="h-3.5 w-3.5 text-primary" />}
                    {n.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{n.sub}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</div>
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleDeleteNotification(n.id, e)}
                  title="Delete notification"
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full text-sm">
            <Link href="/alerts">View all alerts</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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

function UserMenu() {
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
        <DropdownMenuItem onClick={logoutUser} className="cursor-pointer text-destructive">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    applyTheme(getStoredTheme());

    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const activeUser = getAuthUser();
    if (activeUser && !isRouteAllowed(activeUser.role, pathname)) {
      toast.error("Access Restricted", {
        description: `Your role (${activeUser.role}) does not have permission to view ${pathname}.`,
      });
      router.push("/");
      return;
    }

    setCheckingAuth(false);
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
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

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className={cn("hidden lg:flex shrink-0 flex-col sticky top-0 h-screen border-r border-sidebar-border bg-sidebar z-40 transition-all duration-200", collapsed ? "w-16" : "w-64")}>
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 sm:gap-3 border-b bg-background/80 px-3 sm:px-6 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* SIDEBAR COLLAPSE TOGGLE BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar (Full view)" : "Collapse sidebar (Compact view)"}
            className="hidden lg:flex shrink-0 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5 text-primary" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Notifications />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>

        <footer className="border-t px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <div>© 2026 StockFlow. All rights reserved.</div>
          <div className="flex gap-4">
            <span>v2.4.1</span>
            <span>Support</span>
            <span>Docs</span>
          </div>
        </footer>
      </div>
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
