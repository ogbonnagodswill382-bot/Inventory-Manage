"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Boxes, Lock, Mail, User, Shield, Send, ArrowRight, ArrowLeft, CheckCircle2, Crown, Sparkles } from "lucide-react";
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

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode tab state: "signin" | "register"
  const [activeTab, setActiveTab] = useState("signin");

  useEffect(() => {
    const mode = searchParams?.get("mode");
    if (mode === "register") {
      setActiveTab("register");
    }
  }, [searchParams]);

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
      toast.error("Login Failed", { description: res?.error || "Invalid credentials provided." });
    }
    setLoginSubmitting(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      toast.error("Please fill in all registration fields");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("Passwords do not match", { description: "Please re-type your password." });
      return;
    }

    if (regPassword.length < 6) {
      toast.error("Password too weak", { description: "Password must be at least 6 characters." });
      return;
    }

    setRegSubmitting(true);
    const res = await registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: "Administrator", // First-time self-registered account becomes Administrator
    });

    if (res && res.user) {
      setAuthUser(res.user);
      toast.success("Registration Successful!", {
        description: `Your Company Admin profile for ${res.user.name} has been created.`,
      });
      router.push("/");
    } else {
      toast.error("Registration Failed", { description: res?.error || "Could not complete registration." });
    }
    setRegSubmitting(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Please fill in all fields before sending");
      return;
    }

    setContactSubmitting(true);
    const res = await sendContactAdmin({
      name: contactName.trim(),
      email: contactEmail.trim(),
      message: contactMessage.trim(),
    });

    if (res && (res.id || res.message)) {
      toast.success("Request Submitted", {
        description: "Your request has been logged. An Administrator will review and contact you.",
      });
      setContactOpen(false);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } else {
      toast.error("Failed to send request", { description: res?.error || "Please try again later." });
    }
    setContactSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background select-none">
      {/* Left hero banner */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-muted/40 border-r relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-chart-4/10 blur-3xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">StockFlow</div>
              <div className="text-xs text-muted-foreground">Inventory Suite & Management</div>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="text-xs font-semibold gap-1.5 rounded-full border-border/80 hover:bg-primary/10 hover:text-primary transition">
            <Link href="/landing">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Landing Page
            </Link>
          </Button>
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
          <div className="flex items-center justify-between border-b pb-3">
            <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-muted-foreground hover:text-primary gap-1.5 p-0 hover:bg-transparent cursor-pointer">
              <Link href="/landing">
                <ArrowLeft className="h-4 w-4" /> Back to Landing Page
              </Link>
            </Button>
            <span className="text-[11px] text-muted-foreground font-mono">StockFlow v2.4.1</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">StockFlow</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to StockFlow</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account or register a company admin profile.</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={cn(
                "py-2 rounded-lg font-semibold transition cursor-pointer",
                activeTab === "signin"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={cn(
                "py-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1",
                activeTab === "register"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Crown className="h-3.5 w-3.5 text-primary" /> Register Admin
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === "signin" && (
            <Card className="border-border/80 shadow-md">
              <form onSubmit={handleLoginSubmit}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg">Sign In</CardTitle>
                  <CardDescription className="text-xs">
                    Enter your credentials to access your inventory workspace.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email or Username</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="text"
                        placeholder="admin@stockflow.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => setContactOpen(true)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Need account access?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="remember" defaultChecked />
                    <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground cursor-pointer">
                      Keep me logged in on this device
                    </Label>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button type="submit" className="w-full text-xs font-semibold" disabled={loginSubmitting}>
                    {loginSubmitting ? "Signing in..." : "Sign In to Workspace"}
                    {!loginSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  <div className="text-center text-[11px] text-muted-foreground">
                    New company administrator?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="font-bold text-primary hover:underline"
                    >
                      Register Company Profile →
                    </button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* TAB 2: REGISTER COMPANY ADMIN FORM */}
          {activeTab === "register" && (
            <Card className="border-primary/30 shadow-md bg-gradient-to-b from-card to-primary/5">
              <form onSubmit={handleRegisterSubmit}>
                <CardHeader className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Crown className="h-4 w-4" /> Create Company Account
                  </div>
                  <CardTitle className="text-lg">Register Administrator</CardTitle>
                  <CardDescription className="text-xs">
                    Create a top administrator profile to set up your business inventory workspace.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Full Name / Business Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="e.g. Sarah Connor / Zenith Warehouse"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Work Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="sarah@zenithstore.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pass">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-pass"
                          type="password"
                          placeholder="Min 6 chars"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="pl-9 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-confirm"
                          type="password"
                          placeholder="Re-type pass"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="pl-9 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      Self-registered accounts automatically receive <strong className="text-foreground">Administrator</strong> permissions. Additional staff can be added inside under /users.
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-1">
                  <Button type="submit" className="w-full text-xs font-semibold" disabled={regSubmitting}>
                    {regSubmitting ? "Creating Profile..." : "Register & Launch Workspace"}
                    {!regSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  <div className="text-center text-[11px] text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signin")}
                      className="font-bold text-primary hover:underline"
                    >
                      Sign In instead →
                    </button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Bottom helper card for staff access */}
          <div className="rounded-xl border bg-muted/30 p-4 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Are you a warehouse worker or staff member?</span>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="text-primary hover:underline font-bold text-[11px] flex items-center gap-1"
              >
                Request Access <Send className="h-3 w-3" />
              </button>
            </div>
            <p className="text-muted-foreground text-[11px]">
              If your manager has already registered your company workspace, click "Request Access" to send a direct message to your Administrator.
            </p>
          </div>
        </div>
      </div>

      {/* CONTACT ADMINISTRATOR MODAL DIALOG */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleContactSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4 text-primary" /> Request Staff Access
              </DialogTitle>
              <DialogDescription className="text-xs">
                Send a direct message to your Company Administrator to request worker login credentials.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Your Full Name</Label>
                <Input
                  id="contact-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-email">Your Work Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="john@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-msg">Message to Administrator</Label>
                <Textarea
                  id="contact-msg"
                  rows={3}
                  placeholder="Hello Admin, I have joined the warehouse team as Inventory Manager. Please send me my login details."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setContactOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={contactSubmitting}>
                {contactSubmitting ? "Sending..." : "Send Request to Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-muted-foreground text-sm font-medium">
        Loading authentication page...
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
