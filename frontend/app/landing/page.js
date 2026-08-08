"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Truck,
  RotateCcw,
  CheckCircle2,
  Lock,
  Package,
  FileText,
  HelpCircle,
  ChevronDown,
  Layers,
  BarChart3,
  Globe,
  Crown,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "Why should my company switch from manual spreadsheets to StockFlow?",
      a: "Manual spreadsheets lead to human calculation errors, delayed reorders, and lost branch dispatches. StockFlow provides real-time stock balance tracking, automatic low-stock warnings, 1-click PDF/CSV reporting, and multi-user role security in one unified platform.",
    },
    {
      q: "How does the Inter-Branch Transfer and Supplier Return Approval work?",
      a: "When goods are sent to another store branch or returned to a supplier, StockFlow creates a pending dispatch record. Once the branch or supplier returns the goods to your warehouse, an Administrator or Inventory Manager clicks 'Approve & Restock' to automatically add the returned quantity (+Qty) directly back into your warehouse inventory stock.",
    },
    {
      q: "How do I issue login credentials to my warehouse staff members?",
      a: "Company Administrators can create staff accounts directly inside the Users & Access Management panel (/users). StockFlow generates a one-click copyable credential card containing initial login details to hand to your employees.",
    },
    {
      q: "Can I customize the currency symbol for my business country?",
      a: "Yes! In Inventory Settings (/settings), you can select standard currencies ($, €, £, ₦, CA$, ₹, ¥) or input your own custom currency symbol. Every product price, KPI card, and valuation report instantly formats using your chosen currency.",
    },
    {
      q: "Is StockFlow responsive on mobile phones and foldable tablet displays?",
      a: "Absolutely. StockFlow features an adaptive dual layout engine optimized specifically for mobile phones, tablet devices, and fold displays like the Samsung Galaxy Z Fold 5 (both cover screen and inner tablet modes).",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground select-none overflow-x-hidden">
      {/* PUBLIC NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                StockFlow
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  PRO
                </span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#why-stockflow" className="hover:text-primary transition">Why StockFlow</a>
            <a href="#how-it-works" className="hover:text-primary transition">How It Works</a>
            <a href="#benefits" className="hover:text-primary transition">Key Benefits</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-xs font-semibold">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="text-xs font-semibold shadow-md shadow-primary/20">
              <Link href="/login?mode=register">
                <Crown className="mr-1.5 h-3.5 w-3.5" /> Register Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full bg-chart-4/10 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Next-Gen Warehouse Intelligence & Control
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
            Empower your business with <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-chart-4 bg-clip-text text-transparent">
              smart, real-time inventory control.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            Eliminate costly stockouts, streamline warehouse dispatches, audit inter-branch transfers, and manage team permissions with institutional enterprise security.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button asChild size="lg" className="h-12 px-8 text-sm font-bold shadow-lg shadow-primary/25">
              <Link href="/login">
                Launch App & Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold border-border/80">
              <Link href="/login?mode=register">
                <Crown className="mr-2 h-4 w-4 text-primary" /> Register Company Admin
              </Link>
            </Button>
          </div>

          {/* APP UI PREVIEW MOCKUP CARD */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="rounded-2xl border bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur">
              <div className="rounded-xl border bg-background p-4 sm:p-6 text-left space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="ml-2 text-xs font-mono text-muted-foreground">stockflow-dashboard-v2.4.pro</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    🟢 Live System Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase">Active Products</div>
                    <div className="text-lg font-bold text-foreground">1,248 Items</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase">Low Stock Alerts</div>
                    <div className="text-lg font-bold text-amber-600">3 Warnings</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase">Out of Stock</div>
                    <div className="text-lg font-bold text-destructive">0 Critical</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <div className="text-[10px] text-muted-foreground font-medium uppercase">Total Valuation</div>
                    <div className="text-lg font-bold text-emerald-600">$142,850.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY STOCKFLOW WAS BUILT (PROBLEM VS SOLUTION) */}
      <section id="why-stockflow" className="py-16 md:py-24 bg-muted/30 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Why StockFlow Was Built For Your Business
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Traditional inventory systems rely on fragile spreadsheets, causing un-tracked branch transfers, lost inventory, and unexpected stockouts. StockFlow solves this.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex items-center gap-2 text-destructive font-bold text-sm uppercase tracking-wider">
                  ❌ The Old Spreadsheet Way
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span> Frequent stockouts losing customer sales due to un-tracked inventory levels.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span> Goods dispatched to secondary stores or suppliers without return tracking or approval.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span> Shared passwords leading to security breaches and un-audited stock modifications.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider">
                  ✅ The StockFlow Solution
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-foreground font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Live threshold alerts & red-flag safeguards block over-dispatching instantly.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Dedicated Inter-Branch Transfers & 1-click restock return approvals.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    Institutional role permissions & protected Top Administrator security.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 SIMPLE STEPS) */}
      <section id="how-it-works" className="py-16 md:py-24 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Designed for effortless setup so your warehouse staff and managers can start working immediately.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden border-border/80">
              <CardContent className="p-6 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                  1
                </div>
                <h3 className="font-bold text-base">Set Up Your Catalog & Limits</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add products, SKUs, suppliers, and set custom warning thresholds for each item in your warehouse.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/80">
              <CardContent className="p-6 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                  2
                </div>
                <h3 className="font-bold text-base">Track Dispatches & Branch Returns</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Record Stock In and Stock Out. Audit goods sent to secondary branches with 1-click restock return approval.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/80">
              <CardContent className="p-6 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                  3
                </div>
                <h3 className="font-bold text-base">Automate Alerts & Staff Access</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive persistent notifications on critical alerts and issue role-based logins to staff members securely.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* KEY BUSINESS BENEFITS GRID */}
      <section id="benefits" className="py-16 md:py-24 bg-muted/30 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Powerful Benefits For Growing Businesses
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Everything your warehouse needs to operate at peak efficiency.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">Zero-Stockout Red Flag Protection</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Input fields turn bold red and block form submissions if a user attempts to remove more stock than is available.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 mb-2">
                  <Truck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">Branch Transfer & Supplier Returns</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Audit goods out at secondary stores or suppliers, and approve returned stock back into inventory with 1 click.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-2">
                  <Lock className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">Role-Based Staff Access Control</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Top Administrator protection prevents accidental deletion or suspension, while managing staff access levels.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">Real-Time Audit & PDF/CSV Reports</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export inventory valuation summaries and stock audit logs in PDF or CSV formats with one tap.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info mb-2">
                  <Globe className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">Universal Currency Customization</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Supports $, €, £, ₦, CA$, ₹, JPY, and custom currency symbols tailored to your country's workspace.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600 mb-2">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">100% Mobile & Fold Device Ready</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Optimized for Galaxy Z Fold 5, mobile phones, tablets, and desktop displays with responsive card lists.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 md:py-24 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Everything you need to know about starting with StockFlow.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="rounded-xl border bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left font-semibold text-sm sm:text-base flex items-center justify-between gap-4 hover:bg-muted/40 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180 text-primary")} />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-muted/40 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to transform your warehouse management?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Join growing businesses using StockFlow for real-time inventory tracking, staff management, and stockout prevention.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="h-12 px-8 text-sm font-bold shadow-lg shadow-primary/25">
              <Link href="/login">
                Launch App & Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold">
              <Link href="/login?mode=register">
                <Crown className="mr-2 h-4 w-4 text-primary" /> Register Company Admin
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8 px-4 sm:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              <Boxes className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">StockFlow PRO</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition font-medium">Sign In</Link>
            <Link href="/login?mode=register" className="hover:text-foreground transition font-medium">Register Admin</Link>
            <span className="text-muted-foreground/60">v2.4.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
