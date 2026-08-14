"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Boxes, Lock, Mail, User, Shield, Send, ArrowRight, ArrowLeft, CheckCircle2, Crown, Sparkles, Building2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { loginUser, registerCompanyWorkspace, getCompanyWorkspace, sendContactAdmin } from "@/lib/api";
import { pushSystemNotification } from "@/components/app-shell";
import { getAppSettings } from "@/lib/theme";
import { setAuthUser, isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams?.get("reason");
    if (!reason && isAuthenticated()) {
      router.replace("/");
    }
  }, [router, searchParams]);

  const companySlugParam = searchParams?.get("company") || searchParams?.get("w") || "";
  const [companyWorkspace, setCompanyWorkspace] = useState(null);

  // Mode tab state: "signin" | "register"
  const [activeTab, setActiveTab] = useState("signin");

  useEffect(() => {
    const mode = searchParams?.get("mode");
    if (mode === "register" && !companySlugParam) {
      setActiveTab("register");
    }
  }, [searchParams, companySlugParam]);

  useEffect(() => {
    if (companySlugParam) {
      getCompanyWorkspace(companySlugParam).then((res) => {
        if (res && res.slug) {
          setCompanyWorkspace(res);
        }
      });
    }
  }, [companySlugParam]);

  // Sign In states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Register Company Workspace states
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Contact Admin Modal states
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmailMsg, setContactEmailMsg] = useState("");
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
      company_slug: companySlugParam || undefined,
    });

    if (res && res.user) {
      const authObj = {
        ...res.user,
        company_slug: res.user.company_slug || companySlugParam || "default",
        company_name: companyWorkspace?.name || res.user.company_name || "",
      };
      setAuthUser(authObj);
      toast.success("Welcome back!", {
        description: `Logged in as ${res.user.name} (${res.user.role})${companyWorkspace?.name ? ` at ${companyWorkspace.name}` : ''}.`
      });
      router.push("/");
    } else {
      toast.error("Login Failed", { description: res?.error || "Invalid credentials provided." });
    }
    setLoginSubmitting(false);
  };

  const handleRegisterCompanySubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !adminEmail || !regPassword || !regConfirmPassword) {
      toast.error("Please fill in all required company registration fields");
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
    const res = await registerCompanyWorkspace({
      company_name: companyName.trim(),
      contact_email: contactEmail.trim() || adminEmail.trim(),
      admin_name: adminName.trim() || "Administrator",
      admin_email: adminEmail.trim(),
      password: regPassword,
    });

    if (res && res.company && res.user) {
      const authObj = {
        ...res.user,
        company_slug: res.company.slug,
        company_name: res.company.name,
      };
      setAuthUser(authObj);
      toast.success("Company Workspace Registered! 🏢", {
        description: `Workspace "${res.company.name}" created. Admin profile active.`,
      });
      router.push("/");
    } else {
      toast.error("Registration Failed", { description: res?.error || "Could not register company workspace." });
    }
    setRegSubmitting(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmailMsg || !contactMessage) {
      toast.error("Please fill in all fields before sending");
      return;
    }

    setContactSubmitting(true);
    const settings = getAppSettings();
    const targetCompanyEmail = companyWorkspace?.contact_email || settings?.contactEmail || "contact@company.com";

    const res = await sendContactAdmin({
      company_slug: companySlugParam || "default",
      name: contactName.trim(),
      email: contactEmailMsg.trim(),
      message: contactMessage.trim(),
      company_email: targetCompanyEmail,
    });

    if (res && (res.id || res.message)) {
      toast.success("Access Request Delivered to Company Email! ✉️", {
        description: `Sent to company address (${targetCompanyEmail}). Logged exclusively for Company Administrators.`,
      });

      pushSystemNotification({
        title: `Staff Access Request: ${contactName.trim()}`,
        sub: `${contactEmailMsg.trim()} → ${targetCompanyEmail}`,
        message: `Staff Access Request from ${contactName.trim()} (${contactEmailMsg.trim()}): "${contactMessage.trim()}". Direct email alert dispatched to ${targetCompanyEmail}.`,
        type: "contact",
        category: "requests",
        link: `/users?name=${encodeURIComponent(contactName.trim())}&email=${encodeURIComponent(contactEmailMsg.trim())}`,
      });

      setContactOpen(false);
      setContactName("");
      setContactEmailMsg("");
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
              <div className="text-xs text-muted-foreground">
                {companyWorkspace ? `${companyWorkspace.name} Portal` : "Inventory Suite & Management"}
              </div>
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
            <Building2 className="h-3.5 w-3.5" /> {companyWorkspace ? `${companyWorkspace.name} Workspace` : "Multi-Tenant Enterprise Isolation"}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            {companyWorkspace
              ? `Welcome to ${companyWorkspace.name}'s Workspace.`
              : "Empower your business with smart, real-time inventory control."}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {companyWorkspace
              ? `Authorized staff members can sign in with their assigned company credentials to manage products, record dispatches, and track stock in real time.`
              : `Eliminate costly stockouts, streamline warehouse dispatches, automate reorder alerts, and manage team permissions with institutional workspace isolation.`}
          </p>
          <div className="space-y-3 pt-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Dedicated Workspace Link:</span> Each company has its own isolated URL and staff login gateway.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Multi-User Role Permissions:</span> Admin-controlled staff access, password resets, and return approvals.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">100% Isolated Data:</span> Products, categories, suppliers, and movement history are strictly scoped per company.
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
            <h1 className="text-2xl font-bold tracking-tight">StockFlow</h1>
            <p className="text-sm text-muted-foreground">
              {companyWorkspace
                ? `Sign in to ${companyWorkspace.name}'s workspace portal.`
                : "Sign in to your account or register a company workspace."}
            </p>
          </div>

          {/* Mode Switcher Tabs (Only shown when NOT on a dedicated company staff link) */}
          {searchParams?.get("reason") === "maintenance" && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-500 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                <Sparkles className="h-4 w-4 shrink-0" /> System Maintenance & Update Complete 🛠️
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                The application was updated or underwent maintenance. To sync your active company session, please enter your login credentials below to log back in.
              </p>
            </div>
          )}

          {!companySlugParam && (
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
                <Crown className="h-3.5 w-3.5 text-primary" /> Register Company
              </button>
            </div>
          )}

          {/* Dedicated Company Staff Link Alert Banner */}
          {companyWorkspace && (
            <div className="rounded-xl border bg-primary/5 p-3 flex items-center gap-3 text-xs">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{companyWorkspace.name} Dedicated Portal</div>
                <div className="text-[11px] text-muted-foreground">Company Workspace Link: <span className="font-mono text-primary font-bold">/login?company={companyWorkspace.slug}</span></div>
              </div>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === "signin" && (
            <Card className="border-border/80 shadow-md">
              <form onSubmit={handleLoginSubmit}>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg">
                    {companyWorkspace ? `${companyWorkspace.name} Staff Sign In` : "Sign In"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {companyWorkspace
                      ? `Enter staff account credentials for ${companyWorkspace.name}.`
                      : "Enter your credentials to access your inventory workspace."}
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
                        placeholder="user@company.com"
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
                        Request staff access?
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
                    {loginSubmitting ? "Signing in..." : `Sign In to ${companyWorkspace ? companyWorkspace.name : "Workspace"}`}
                    {!loginSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  {!companySlugParam && (
                    <div className="text-center text-[11px] text-muted-foreground">
                      Registering a new company?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className="font-bold text-primary hover:underline"
                      >
                        Register Company Workspace →
                      </button>
                    </div>
                  )}
                </CardFooter>
              </form>
            </Card>
          )}

          {/* TAB 2: REGISTER COMPANY WORKSPACE FORM */}
          {activeTab === "register" && !companySlugParam && (
            <Card className="border-primary/30 shadow-md bg-gradient-to-b from-card to-primary/5">
              <form onSubmit={handleRegisterCompanySubmit}>
                <CardHeader className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Crown className="h-4 w-4" /> Register New Workspace
                  </div>
                  <CardTitle className="text-lg">Register Company Workspace</CardTitle>
                  <CardDescription className="text-xs">
                    Create a dedicated workspace and company identity link for your organization.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="comp-name">Company / Organization Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="comp-name"
                        type="text"
                        placeholder="e.g. Zenith Warehouse Ltd"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Company name must be unique. No two companies can use the same identity.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-name">Admin Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="admin-name"
                          type="text"
                          placeholder="e.g. Sarah Kim"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="pl-9 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="comp-contact-email">Company Contact Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="comp-contact-email"
                          type="email"
                          placeholder="orders@zenith.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="pl-9 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email">Admin Login Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@zenith.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="pl-9 text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pass">Admin Password</Label>
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
                      Creating a company workspace generates a unique dedicated staff login link (e.g. <span className="font-mono text-primary font-bold">/login?company=zenith-warehouse</span>).
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3 pt-1">
                  <Button type="submit" className="w-full text-xs font-semibold" disabled={regSubmitting}>
                    {regSubmitting ? "Registering Workspace..." : "Create Company Workspace"}
                    {!regSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  <div className="text-center text-[11px] text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signin")}
                      className="font-bold text-primary hover:underline"
                    >
                      Sign In →
                    </button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* CONTACT ADMIN DIALOG MODAL */}
          <Dialog open={contactOpen} onOpenChange={setContactOpen}>
            <DialogContent className="max-w-md">
              <form onSubmit={handleContactSubmit}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-primary">
                    <Mail className="h-5 w-5" /> Request Staff Access
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    Send an access request directly to {companyWorkspace ? `${companyWorkspace.name}'s Administrator` : 'the company Administrator'}.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-3 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <Label htmlFor="c-name">Your Full Name</Label>
                    <Input
                      id="c-name"
                      placeholder="e.g. Alex Johnson"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="c-email">Your Work Email</Label>
                    <Input
                      id="c-email"
                      type="email"
                      placeholder="alex@company.com"
                      value={contactEmailMsg}
                      onChange={(e) => setContactEmailMsg(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="c-msg">Request Message / Department</Label>
                    <Textarea
                      id="c-msg"
                      placeholder="e.g. Requesting Warehouse Staff login for the West Coast Hub."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={contactSubmitting}>
                    <Send className="mr-1.5 h-4 w-4" /> {contactSubmitting ? "Sending..." : "Send Access Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">Loading login portal...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
