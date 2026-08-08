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
  PlusCircle,
  MinusCircle,
  CornerDownLeft,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [demoCurrency, setDemoCurrency] = useState("NGN"); // NGN (₦) or USD ($)
  const [demoStock, setDemoStock] = useState(45);

  const faqs = [
    {
      q: "Why should my business switch from manual notebooks or spreadsheets to StockFlow?",
      a: "Manual notebooks and spreadsheets cause calculation mistakes, lost stock dispatches, and unexpected stockouts. StockFlow automatically keeps track of your stock count, warns you before items run out, handles Naira (₦) or Dollar ($) currency balances, and keeps your store data safe.",
    },
    {
      q: "How does the Inter-Branch Transfer and Supplier Return Approval work?",
      a: "When you send products out to a branch store or supplier, StockFlow records it as 'Dispatched Out'. When the store or supplier returns the goods to your warehouse, your Manager or Administrator clicks 'Approve & Restock' to automatically add the items (+Qty) directly back into your stock count.",
    },
    {
      q: "How do I give my staff members access to the app?",
      a: "As a Company Administrator, you can create accounts for your workers under the Users page (/users). StockFlow gives you a 1-click copy card with initial login details to pass to your staff safely.",
    },
    {
      q: "Can I set the currency to Naira (₦) or any other symbol?",
      a: "Yes! In Settings (/settings), you can select Naira (₦), Dollar ($), Euro (€), Pound (£), or type any custom currency symbol. Your entire app, inventory valuation, and PDF reports will immediately display in your chosen currency.",
    },
    {
      q: "Will StockFlow work on my mobile phone or Samsung Galaxy Z Fold device?",
      a: "Yes! StockFlow is 100% responsive and specially built to look great on mobile phones, tablets, and fold devices like the Samsung Galaxy Z Fold 5.",
    },
  ];

  const currSymbol = demoCurrency === "NGN" ? "₦" : "$";
  const unitPrice = demoCurrency === "NGN" ? 25000 : 50;
  const totalValuation = (demoStock * unitPrice).toLocaleString("en-US");

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
              <span className="font-extrabold text-base tracking-tight text-foreground">
                StockFlow
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#why-stockflow" className="hover:text-primary transition">Why StockFlow</a>
            <a href="#layman-guide" className="hover:text-primary transition">How To Use</a>
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

      {/* HERO SECTION WITH INTERACTIVE DEMO */}
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
            Eliminate stockout losses, streamline warehouse dispatches, audit inter-branch transfers, and manage team access with institutional enterprise security.
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

          {/* INTERACTIVE DEMO WIDGET MOCKUP */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="rounded-2xl border bg-card/60 p-3 sm:p-5 shadow-2xl backdrop-blur space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs">
                <div className="flex items-center gap-2 font-mono text-muted-foreground">
                  <span className="h-3 w-3 rounded-full bg-destructive inline-block" />
                  <span className="h-3 w-3 rounded-full bg-warning inline-block" />
                  <span className="h-3 w-3 rounded-full bg-success inline-block" />
                  <span className="font-semibold text-foreground">Live Interactive Demo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[11px]">Select Currency:</span>
                  <Button
                    size="xs"
                    variant={demoCurrency === "NGN" ? "default" : "outline"}
                    onClick={() => setDemoCurrency("NGN")}
                    className="text-[11px] h-7 px-2.5"
                  >
                    ₦ Naira (NGN)
                  </Button>
                  <Button
                    size="xs"
                    variant={demoCurrency === "USD" ? "default" : "outline"}
                    onClick={() => setDemoCurrency("USD")}
                    className="text-[11px] h-7 px-2.5"
                  >
                    $ Dollar (USD)
                  </Button>
                </div>
              </div>

              {/* DEMO CARD GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="rounded-xl border bg-background p-3.5 space-y-1">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Product Sample</div>
                  <div className="font-bold text-sm text-foreground flex items-center justify-between">
                    <span>📦 Wireless Headset</span>
                    <span className="text-xs text-muted-foreground font-mono">SF-HEAD-101</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1 border-t mt-2 flex justify-between">
                    <span>Price per unit:</span>
                    <strong className="text-foreground">{currSymbol}{unitPrice.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="rounded-xl border bg-background p-3.5 space-y-2">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Stock Balance</div>
                  <div className="font-bold text-xl text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>{demoStock} units</span>
                    <div className="flex gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setDemoStock(prev => prev + 5)}
                        className="h-6 px-1.5 text-emerald-600 hover:bg-emerald-500/10"
                        title="Simulate Stock In (+5)"
                      >
                        +5 Stock In
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setDemoStock(prev => Math.max(0, prev - 5))}
                        className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
                        title="Simulate Stock Out (-5)"
                      >
                        -5 Stock Out
                      </Button>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Status: {demoStock > 10 ? "🟢 In Stock" : demoStock > 0 ? "⚠️ Low Stock Warning" : "🔴 Out of Stock"}
                  </div>
                </div>

                <div className="rounded-xl border bg-background p-3.5 space-y-1">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Total Asset Valuation</div>
                  <div className="font-bold text-xl text-primary">{currSymbol}{totalValuation}</div>
                  <div className="text-[11px] text-muted-foreground pt-1 border-t mt-2">
                    Auto-calculated in {demoCurrency === "NGN" ? "Naira (₦)" : "Dollars ($)"}
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
              Traditional inventory management relies on fragile spreadsheets, causing un-tracked branch transfers, lost inventory, and unexpected stockouts. StockFlow solves this.
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

      {/* LAYMAN'S STEP-BY-STEP GUIDE: HOW TO USE THE APP */}
      <section id="layman-guide" className="py-16 md:py-24 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              📖 Easy Step-by-Step Guide
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              How Anyone Can Use StockFlow for Their Business
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              No technical experience needed. Here is how simple it is to run your business with StockFlow:
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative border-border/80 hover:border-primary/50 transition">
              <CardContent className="p-5 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-extrabold text-base">
                  1
                </div>
                <h3 className="font-bold text-sm text-foreground">Add Your Products</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Go to <strong className="text-foreground">Products</strong>, click "Add Product", and enter your item's name, price, starting quantity, and currency.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-border/80 hover:border-primary/50 transition">
              <CardContent className="p-5 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-extrabold text-base">
                  2
                </div>
                <h3 className="font-bold text-sm text-foreground">Record Stock Arrivals</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When new shipments arrive, go to <strong className="text-foreground">Stock In</strong>. Enter the quantity received to automatically increase your stock balance.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-border/80 hover:border-primary/50 transition">
              <CardContent className="p-5 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive font-extrabold text-base">
                  3
                </div>
                <h3 className="font-bold text-sm text-foreground">Record Dispatches & Sales</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When goods leave for customer sales or branch transfers, go to <strong className="text-foreground">Stock Out</strong>. The red-flag guard prevents selling items you don't have.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-border/80 hover:border-primary/50 transition">
              <CardContent className="p-5 space-y-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 font-extrabold text-base">
                  4
                </div>
                <h3 className="font-bold text-sm text-foreground">Approve Returned Stock</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When branch stores or suppliers return goods back, go to <strong className="text-foreground">Transfers & Returns</strong> and click "Approve & Restock" to add them back.
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
                <h4 className="font-bold text-sm">Naira (₦) & Universal Currency Support</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Supports ₦ Naira, $, €, £, CA$, ₹, JPY, and custom currency symbols tailored to your country's workspace.
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

      {/* FOOTER WITH CLEAN MATURE SWIVEX PORTFOLIO LINK */}
      <footer className="border-t py-8 px-4 sm:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              <Boxes className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">StockFlow</span>
            <span>
              © 2026. Created by{" "}
              <a
                href="https://swivex-personal.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold tracking-tight text-foreground hover:text-primary underline decoration-primary/40 underline-offset-4 transition-all duration-200"
              >
                Swivex
              </a>. All rights reserved.
            </span>
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
