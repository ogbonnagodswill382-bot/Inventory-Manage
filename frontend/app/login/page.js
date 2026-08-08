"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Lock, Mail, User, Shield, Send, ArrowRight, CheckCircle2, Crown, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { loginUser, registerUser, sendContactAdmin } from "@/lib/api";
import { setAuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  // Mode tab state: "signin" | "register"
  const [activeTab, setActiveTab] = useState("signin");

  // Sign In states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Register states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Contact Admin Modal states
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter email/username and password");
      return;
    }

    setLoginSubmitting(true);
    const res = await loginUser({
      email: loginEmail.trim(),
      password: loginPassword.trim(),
    });

    if (res && res.user) {
      setAuthUser(res.user);
      toast.success("Welcome back!", { description: `Logged in as ${res.user.name} (${res.user.role}).` });
      router.push("/");
    } else {
      toast.error(res?.error || "Invalid login credentials. Please try again.");
    }
    setLoginSubmitting(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setRegSubmitting(true);
    const res = await registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      role: "Administrator",
    });

    if (res && res.user) {
      setAuthUser(res.user);
      toast.success("Administrator account registered!", { description: `Welcome ${res.user.name}! Redirecting to dashboard...` });
      setTimeout(() => {
        router.push("/");
      }, 800);
    } else {
      toast.error(res?.error || "Failed to register account.");
    }
    setRegSubmitting(false);
  };

  const handleContactAdminSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error("Please fill out all fields in the request");
      return;
    }

    setContactSubmitting(true);
    const res = await sendContactAdmin({
      name: contactName.trim(),
      email: contactEmail.trim(),
      message: contactMessage.trim(),
    });

    if (res && !res.error) {
      toast.success("Request sent to Administrator!", { description: "The admin (owner@stockflow.io) will review your access request." });
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setContactOpen(false);
    } else {
      toast.error(res?.error || "Failed to send request.");
    }
    setContactSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background select-none">
      {/* Left hero banner */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-muted/40 border-r relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-chart-4/10 blur-3xl" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">StockFlow</div>
            <div className="text-xs text-muted-foreground">Inventory Suite & Management</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Enterprise-Grade Inventory Control
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Empower your business with smart, real-time inventory control.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Eliminate costly stockouts, streamline warehouse dispatches, automate reorder alerts, and manage team permissions with institutional REST security.
          </p>
          <div className="space-y-3 pt-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Zero-Stockout Protection:</span> Live threshold warnings & red-flag safeguards keep your inventory balanced 24/7.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Multi-User Role Permissions:</span> Admin-controlled staff access, password resets, and top admin protection.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Real-Time Audit & Analytics:</span> Complete movement history, live valuation, and 1-click PDF/CSV report exports.
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © 2026 StockFlow. All rights reserved.
        </div>
      </div>

      {/* Right form container */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">StockFlow</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to StockFlow</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account or register a company admin profile.</p>
          </div>

          {/* Custom mode switcher */}
          <div className="grid grid-cols-2 p-1 rounded-lg bg-muted text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={cn(
                "py-2 rounded-md transition-all text-center",
                activeTab === "signin"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={cn(
                "py-2 rounded-md transition-all text-center flex items-center justify-center gap-1.5",
                activeTab === "register"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Crown className="h-3.5 w-3.5 text-primary" /> Register Admin
            </button>
          </div>

          {/* SIGN IN VIEW */}
          {activeTab === "signin" && (
            <Card className="border-muted/60 shadow-sm">
              <form onSubmit={handleLoginSubmit}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg">Sign In</CardTitle>
                  <CardDescription>Enter your account credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email or Username</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        placeholder="owner or your_email@company.com"
                        className="pl-9"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" defaultChecked />
                    <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground cursor-pointer">
                      Remember me for 30 days
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loginSubmitting}>
                    {loginSubmitting ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* REGISTER ADMIN VIEW */}
          {activeTab === "register" && (
            <Card className="border-muted/60 shadow-sm">
              <form onSubmit={handleRegisterSubmit}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" /> Register Admin Account
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Public registration creates Company Administrator accounts. Staff accounts (Warehouse Staff, Inventory Managers) are created and issued by your Administrator inside the app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <Label htmlFor="reg-name">Administrator Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        placeholder="e.g. Sarah Kim"
                        className="pl-9"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-email">Admin Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="admin@company.com"
                        className="pl-9"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="reg-pass">Password</Label>
                      <Input
                        id="reg-pass"
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-confirm">Confirm Password</Label>
                      <Input
                        id="reg-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={regSubmitting}>
                    {regSubmitting ? "Creating Admin Account..." : "Register Company Admin"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* DONT HAVE AN ACCOUNT? CONTACT ADMIN */}
          <div className="pt-2 text-center text-xs text-muted-foreground space-y-2">
            <div>
              Staff member without login details?{" "}
              <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="font-semibold text-primary underline hover:text-primary/80 transition cursor-pointer">
                    Contact Admin
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleContactAdminSubmit}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" /> Contact Administrator
                      </DialogTitle>
                      <DialogDescription>
                        Send an access request message directly to the administrator (<span className="font-medium text-foreground">owner@stockflow.io</span>).
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-3 text-sm">
                      <div className="space-y-1">
                        <Label htmlFor="c-name">Your Full Name</Label>
                        <Input
                          id="c-name"
                          placeholder="e.g. Jordan Lee"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="c-email">Your Email</Label>
                        <Input
                          id="c-email"
                          type="email"
                          placeholder="jordan@company.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="c-msg">Message / Role Requested</Label>
                        <Textarea
                          id="c-msg"
                          placeholder="Please create an account for me as Warehouse Staff."
                          rows={3}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={contactSubmitting}>
                        <Send className="mr-2 h-4 w-4" /> {contactSubmitting ? "Sending..." : "Send Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
