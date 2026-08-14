"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Moon, Laptop, Save, Download, CheckCircle2, Building2, Bell, Shield, Database, Coins, RefreshCw, Copy, Check, Smartphone, Send, BellRing, PhoneCall } from "lucide-react";
import { applyTheme, getAppSettings, getStoredTheme, saveAppSettings, getCurrencySymbol } from "@/lib/theme";
import { getProducts, updateProduct, triggerSystemMaintenanceAPI } from "@/lib/api";
import { getAuthUser, setAuthUser, getCompanyStaffLink, triggerSystemMaintenanceReset } from "@/lib/auth";
import { requestPhoneNotificationPermission, sendPhonePushNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
      <div className="min-w-0 flex-1 pr-2">
        <div className="text-sm font-medium leading-snug">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: "dark",
    companyName: "StockFlow Inc.",
    contactEmail: "ops@stockflow.io",
    adminPhone: "+234 801 234 5678",
    currency: "USD ($)",
    customCurrencySymbol: "",
    timezone: "UTC-05:00 Eastern",
    address: "500 Warehouse Rd, Newark NJ",
    lowStockThreshold: 20,
    skuPrefix: "SF-",
    autoGenerateSku: true,
    trackBatchNumbers: false,
    allowNegativeStock: false,
    emailNotifications: true,
    lowStockAlerts: true,
    outOfStockAlerts: true,
    smsNotifications: true,
    phonePushNotifications: true,
    weeklyDigest: false,
    autoDailyBackup: true,
    exportLogsWeekly: false,
  });

  const [applyingThreshold, setApplyingThreshold] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const authUser = getAuthUser();
  const companySlug = authUser?.company_slug || "default";
  const staffLink = getCompanyStaffLink(companySlug);

  useEffect(() => {
    const loaded = getAppSettings();
    const activeTheme = getStoredTheme();
    setSettings({ ...loaded, theme: activeTheme });

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleCopyStaffLink = () => {
    navigator.clipboard.writeText(staffLink);
    setCopiedLink(true);
    toast.success("Staff Sign-In Link copied to clipboard! 🔗", {
      description: `Share this unique link with your team: ${staffLink}`,
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleEnablePhonePush = async () => {
    const res = await requestPhoneNotificationPermission();
    if (res.granted) {
      setPushEnabled(true);
      toast.success("Phone Lock-Screen Push Notifications Enabled! 📲", {
        description: "Your phone browser is now paired to receive instant lock-screen alerts.",
      });
      sendPhonePushNotification({
        title: "StockFlow Mobile Alert Paired! 📲",
        message: "You will receive instant lock-screen notifications for low stock, out-of-stock items, and staff requests.",
      });
    } else {
      toast.error(res.message || "Failed to enable phone push notifications");
    }
  };

  const handleTestPhoneNotification = () => {
    const sent = sendPhonePushNotification({
      title: "StockFlow Test Phone Alert 🔔",
      message: "Urgent: This is a test phone notification for Zenith Warehouse stock balance monitoring.",
    });

    if (sent) {
      toast.success("Test notification sent directly to your phone screen! 📲");
    } else {
      toast.info("Push permission required. Click 'Enable Phone Push Notifications' button below first.");
    }
  };

  const handleSelectTheme = (mode) => {
    const next = { ...settings, theme: mode };
    setSettings(next);
    applyTheme(mode);
    saveAppSettings(next);
    toast.success(`Theme updated to ${mode === "dark" ? "Dark Mode 🌙" : mode === "light" ? "Light Mode ☀️" : "System Mode 💻"}`);
  };

  const handleFieldChange = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
  };

  const handleSaveAll = (e) => {
    e?.preventDefault();
    saveAppSettings(settings);
    if (authUser) {
      setAuthUser({
        ...authUser,
        company_name: settings.companyName,
        company_email: settings.contactEmail,
        admin_phone: settings.adminPhone,
      });
    }
    const symbol = getCurrencySymbol();
    toast.success("Settings saved successfully! ✅", {
      description: `Company details, mobile number (${settings.adminPhone || 'Configured'}), and active currency (${symbol}) updated.`,
    });
  };

  const handleApplyThresholdToAllProducts = async () => {
    const targetThreshold = Number(settings.lowStockThreshold || 20);
    setApplyingThreshold(true);
    try {
      const prods = await getProducts();
      if (prods && Array.isArray(prods) && prods.length > 0) {
        let updatedCount = 0;
        for (const p of prods) {
          await updateProduct(p.id, {
            ...p,
            threshold: targetThreshold,
          });
          updatedCount++;
        }
        saveAppSettings(settings);
        toast.success(`Applied default threshold (${targetThreshold} units) to all ${updatedCount} products! 🎉`);
      } else {
        toast.info("No products found to update.");
      }
    } catch (e) {
      toast.error("Failed to apply threshold to products.");
    }
    setApplyingThreshold(false);
  };

  const handleDownloadBackup = () => {
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stockflow_backup_settings.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Settings backup downloaded successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Settings & Preferences"
        description="Configure your workspace details, active currency symbol, phone notifications, and inventory defaults."
        actions={
          <Button onClick={handleSaveAll} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save Settings
          </Button>
        }
      />

      <Tabs defaultValue="general" className="w-full">
        {/* RESPONSIVE TABS HEADER */}
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
          <TabsList className="inline-flex sm:grid sm:grid-cols-5 w-max sm:w-full min-w-full h-auto p-1 border bg-muted/40 rounded-xl gap-1">
            <TabsTrigger value="general" className="py-2 text-xs sm:text-sm">Company & Currency</TabsTrigger>
            <TabsTrigger value="appearance" className="py-2 text-xs sm:text-sm">Appearance</TabsTrigger>
            <TabsTrigger value="inventory" className="py-2 text-xs sm:text-sm">Inventory Defaults</TabsTrigger>
            <TabsTrigger value="notifications" className="py-2 text-xs sm:text-sm">Notifications & Phone</TabsTrigger>
            <TabsTrigger value="backup" className="py-2 text-xs sm:text-sm">Backup</TabsTrigger>
          </TabsList>
        </div>

        {/* GENERAL / COMPANY & CURRENCY TAB */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Company Profile & Currency Symbol
              </CardTitle>
              <CardDescription>
                Your active currency symbol will apply across product pricing, inventory valuations, and financial reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => handleFieldChange("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleFieldChange("contactEmail", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 font-semibold">
                  <Coins className="h-4 w-4 text-primary" /> Currency Symbol
                </Label>
                <Select value={settings.currency} onValueChange={(v) => handleFieldChange("currency", v)}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="USD ($)">USD ($) — US Dollar</SelectItem>
                    <SelectItem value="EUR (€)">EUR (€) — Euro</SelectItem>
                    <SelectItem value="GBP (£)">GBP (£) — British Pound</SelectItem>
                    <SelectItem value="NGN (₦)">NGN (₦) — Nigerian Naira</SelectItem>
                    <SelectItem value="CAD (CA$)">CAD (CA$) — Canadian Dollar</SelectItem>
                    <SelectItem value="AUD (A$)">AUD (A$) — Australian Dollar</SelectItem>
                    <SelectItem value="INR (₹)">INR (₹) — Indian Rupee</SelectItem>
                    <SelectItem value="JPY (¥)">JPY (¥) — Japanese Yen</SelectItem>
                    <SelectItem value="BRL (R$)">BRL (R$) — Brazilian Real</SelectItem>
                    <SelectItem value="KES (KSh)">KES (KSh) — Kenyan Shilling</SelectItem>
                    <SelectItem value="custom">Custom Symbol...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.currency === "custom" && (
                <div className="space-y-1.5">
                  <Label>Type Custom Symbol</Label>
                  <Input
                    placeholder="e.g. ₵, R, dH, 🚀"
                    value={settings.customCurrencySymbol}
                    onChange={(e) => handleFieldChange("customCurrencySymbol", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => handleFieldChange("timezone", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-05:00 Eastern">UTC-05:00 Eastern (EST)</SelectItem>
                    <SelectItem value="UTC+00:00 GMT">UTC+00:00 London (GMT)</SelectItem>
                    <SelectItem value="UTC+01:00 WAT">UTC+01:00 Lagos / West Africa (WAT)</SelectItem>
                    <SelectItem value="UTC+02:00 CAT">UTC+02:00 Johannesburg (CAT)</SelectItem>
                    <SelectItem value="UTC+08:00 SGT">UTC+08:00 Singapore / Asia (SGT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Warehouse / Office Address</Label>
                <Textarea
                  value={settings.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  rows={2}
                />
              </div>

              {/* DEDICATED COMPANY STAFF LINK BANNER */}
              <div className="sm:col-span-2 rounded-xl border bg-primary/5 p-4 space-y-2 mt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Dedicated Company Staff Link
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Share this unique company gateway link with your staff. Staff opening this link will see a clean sign-in screen branded specifically for your workspace.
                    </div>
                    <div className="font-mono text-xs text-primary font-bold select-all bg-background px-2.5 py-1 rounded border inline-block mt-1">
                      {staffLink}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs font-semibold shrink-0" onClick={handleCopyStaffLink}>
                    {copiedLink ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                    {copiedLink ? "Copied Link!" : "Copy Staff Link"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" /> UI Appearance & Theme
              </CardTitle>
              <CardDescription>
                Choose how StockFlow looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectTheme("dark")}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 p-4 text-center transition cursor-pointer hover:border-primary/50",
                    settings.theme === "dark" ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <Moon className="h-6 w-6 mb-2 text-primary" />
                  <div className="font-semibold text-sm">Dark Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">Sleek obsidian theme for late hours</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("light")}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 p-4 text-center transition cursor-pointer hover:border-primary/50",
                    settings.theme === "light" ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <Sun className="h-6 w-6 mb-2 text-amber-500" />
                  <div className="font-semibold text-sm">Light Mode</div>
                  <div className="text-xs text-muted-foreground mt-1">Clean high-contrast daytime interface</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("system")}
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 p-4 text-center transition cursor-pointer hover:border-primary/50",
                    settings.theme === "system" ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <Laptop className="h-6 w-6 mb-2 text-primary" />
                  <div className="font-semibold text-sm">System Default</div>
                  <div className="text-xs text-muted-foreground mt-1">Match device operating system setting</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVENTORY DEFAULTS TAB */}
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Inventory & Stock Controls
              </CardTitle>
              <CardDescription>
                Default threshold rules, SKU generators, and safety guards.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Default Low Stock Threshold (Units)</Label>
                  <Input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => handleFieldChange("lowStockThreshold", e.target.value)}
                  />
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyThresholdToAllProducts}
                      disabled={applyingThreshold}
                      className="text-xs w-full"
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      {applyingThreshold ? "Applying to all products..." : "Apply Threshold to All Products"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Auto SKU Prefix</Label>
                  <Input
                    value={settings.skuPrefix}
                    onChange={(e) => handleFieldChange("skuPrefix", e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <ToggleRow
                  title="Auto-Generate Product SKUs"
                  description="Automatically format product SKUs using the configured prefix when adding new catalog items."
                  checked={settings.autoGenerateSku}
                  onChange={(v) => handleFieldChange("autoGenerateSku", v)}
                />
                <ToggleRow
                  title="Track Batch / Serial Numbers"
                  description="Prompt staff for lot batch codes during Stock In and Stock Out receipts."
                  checked={settings.trackBatchNumbers}
                  onChange={(v) => handleFieldChange("trackBatchNumbers", v)}
                />
                <ToggleRow
                  title="Allow Negative Stock Balance"
                  description="Strictly disabled. Zero-stockout safeguards prevent dispatching items beyond available warehouse balance."
                  checked={settings.allowNegativeStock}
                  onChange={(v) => handleFieldChange("allowNegativeStock", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS & PHONE TAB */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" /> Phone Notifications & Mobile SMS/WhatsApp Alerts
              </CardTitle>
              <CardDescription>
                Configure phone text messages, SMS/WhatsApp alerts, and native mobile lock-screen push notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-5">
              {/* ADMIN PHONE NUMBER INPUT */}
              <div className="rounded-xl border bg-primary/5 p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 font-semibold">
                    <PhoneCall className="h-4 w-4 text-primary" /> Admin Mobile Phone Number for Text/SMS Alerts
                  </Label>
                  <Input
                    type="tel"
                    placeholder="e.g. +234 801 234 5678 or +1 555 019 2834"
                    value={settings.adminPhone || ""}
                    onChange={(e) => handleFieldChange("adminPhone", e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter full international phone number with country code. Used to dispatch instant SMS and WhatsApp text messages when urgent inventory alerts occur.
                  </p>
                </div>
              </div>

              {/* NATIVE PHONE LOCK-SCREEN PUSH CARD */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-primary" /> Native Mobile Browser Push Notifications
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pushEnabled
                        ? "Phone Lock-Screen Push Notifications are currently active on this mobile device. ✅"
                        : "Enable browser push permissions to receive instant lock-screen popups on your smartphone."}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={pushEnabled ? "outline" : "default"}
                      className="text-xs font-semibold"
                      onClick={handleEnablePhonePush}
                    >
                      <Smartphone className="mr-1.5 h-3.5 w-3.5" />
                      {pushEnabled ? "Re-pair Phone Push" : "Enable Phone Push Notifications"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-semibold"
                      onClick={handleTestPhoneNotification}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Test Phone Alert 🔔
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <ToggleRow
                  title="SMS & WhatsApp Phone Alerts"
                  description="Dispatch instant mobile text messages to the admin phone number when stock reaches zero or when workers submit staff access requests."
                  checked={settings.smsNotifications}
                  onChange={(v) => handleFieldChange("smsNotifications", v)}
                />
                <ToggleRow
                  title="Native Mobile Lock-Screen Push Alerts"
                  description="Send native lock-screen popup notifications directly to your Android or iPhone device browser."
                  checked={settings.phonePushNotifications}
                  onChange={(v) => handleFieldChange("phonePushNotifications", v)}
                />
                <ToggleRow
                  title="In-App Header Drawer Alerts"
                  description="Show real-time notifications in the top bar drawer for stock movements, transfers, and access requests."
                  checked={settings.emailNotifications}
                  onChange={(v) => handleFieldChange("emailNotifications", v)}
                />
                <ToggleRow
                  title="Low Stock Reorder Alerts"
                  description="Notify Administrators when a product's stock count falls below its warning threshold."
                  checked={settings.lowStockAlerts}
                  onChange={(v) => handleFieldChange("lowStockAlerts", v)}
                />
                <ToggleRow
                  title="Critical Out-Of-Stock Alerts"
                  description="Flag zero-balance items immediately with urgent red notifications."
                  checked={settings.outOfStockAlerts}
                  onChange={(v) => handleFieldChange("outOfStockAlerts", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP TAB */}
        <TabsContent value="backup" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Data Backup & Security Export
              </CardTitle>
              <CardDescription>
                Export workspace preferences and system audit configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">Download Workspace JSON Backup</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Export settings configuration as a standard JSON document.</div>
                  </div>
                  <Button size="sm" onClick={handleDownloadBackup}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download JSON
                  </Button>
                </div>
              </div>

              {/* SYSTEM MAINTENANCE & STAFF SESSION RESET */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-amber-400 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-amber-400" /> App Update & Staff Session Maintenance Reset
                    </div>
                    <div className="text-xs text-amber-200/80">
                      Completed an app update or maintenance? Trigger a session version bump to force all active staff members and company users across all devices to log back in without losing any workspace data.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold shrink-0 cursor-pointer"
                    onClick={async () => {
                      try {
                        await triggerSystemMaintenanceAPI();
                        toast.info("System Maintenance Reset Triggered 🛠️", {
                          description: "Session version bumped. Invalidating sessions for re-login...",
                        });
                        setTimeout(() => {
                          triggerSystemMaintenanceReset();
                        }, 1200);
                      } catch (e) {
                        triggerSystemMaintenanceReset();
                      }
                    }}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Force Staff Re-Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
