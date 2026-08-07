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
import { Sun, Moon, Laptop, Save, Download, CheckCircle2, Building2, Bell, Shield, Database, Coins, RefreshCw } from "lucide-react";
import { applyTheme, getAppSettings, getStoredTheme, saveAppSettings, getCurrencySymbol } from "@/lib/theme";
import { getProducts, updateProduct } from "@/lib/api";
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
    weeklyDigest: false,
    autoDailyBackup: true,
    exportLogsWeekly: false,
  });

  const [applyingThreshold, setApplyingThreshold] = useState(false);

  useEffect(() => {
    const loaded = getAppSettings();
    const activeTheme = getStoredTheme();
    setSettings({ ...loaded, theme: activeTheme });
  }, []);

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
    const symbol = getCurrencySymbol();
    toast.success("Settings saved successfully! ✅", {
      description: `Active currency set to "${symbol}". Workspace preferences updated.`,
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
        description="Configure your workspace details, active currency symbol, appearance theme, and inventory defaults."
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
            <TabsTrigger value="notifications" className="py-2 text-xs sm:text-sm">Notifications</TabsTrigger>
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
                <Label>Time Zone</Label>
                <Input
                  value={settings.timezone}
                  onChange={(e) => handleFieldChange("timezone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Warehouse Address</Label>
                <Textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button onClick={handleSaveAll} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4 text-primary" /> Application Theme
              </CardTitle>
              <CardDescription>
                Select your preferred interface theme. Tap directly on any theme card below to apply it globally across the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* LIGHT MODE CARD */}
                <div
                  onClick={() => handleSelectTheme("light")}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 flex flex-col items-center gap-3 text-center",
                    settings.theme === "light" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                  )}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
                    <Sun className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Light Mode</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Clean & high-contrast light styling</div>
                  </div>
                  {settings.theme === "light" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>

                {/* DARK MODE CARD */}
                <div
                  onClick={() => handleSelectTheme("dark")}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 flex flex-col items-center gap-3 text-center",
                    settings.theme === "dark" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                  )}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-800 text-slate-200">
                    <Moon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dark Mode</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sleek dark colors for night work</div>
                  </div>
                  {settings.theme === "dark" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>

                {/* SYSTEM MODE CARD */}
                <div
                  onClick={() => handleSelectTheme("system")}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 flex flex-col items-center gap-3 text-center",
                    settings.theme === "system" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                  )}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">System Preference</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Automatically match OS settings</div>
                  </div>
                  {settings.theme === "system" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Inventory Defaults & Low Stock Threshold
              </CardTitle>
              <CardDescription>
                Set the default low stock threshold and apply it across your entire product catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2 rounded-xl border bg-primary/5 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <Label className="text-sm font-semibold">Default Low Stock Threshold (per Product)</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Products below this unit balance trigger low stock warning notifications.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24 bg-background font-semibold"
                      value={settings.lowStockThreshold}
                      onChange={(e) => handleFieldChange("lowStockThreshold", Number(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyThresholdToAllProducts}
                      disabled={applyingThreshold}
                      className="shrink-0"
                    >
                      <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", applyingThreshold && "animate-spin")} />
                      {applyingThreshold ? "Applying..." : "Apply to All Products"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>SKU Prefix</Label>
                <Input
                  value={settings.skuPrefix}
                  onChange={(e) => handleFieldChange("skuPrefix", e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1 pt-2">
                <ToggleRow
                  title="Auto-generate SKU"
                  description="Assign a non-colliding SKU automatically when creating a new product."
                  checked={settings.autoGenerateSku}
                  onChange={(v) => handleFieldChange("autoGenerateSku", v)}
                />
                <ToggleRow
                  title="Track batch numbers"
                  description="Record batch/lot info for every stock in entry."
                  checked={settings.trackBatchNumbers}
                  onChange={(v) => handleFieldChange("trackBatchNumbers", v)}
                />
                <ToggleRow
                  title="Negative stock allowed"
                  description="Permit stock out even when balance would go below zero."
                  checked={settings.allowNegativeStock}
                  onChange={(v) => handleFieldChange("allowNegativeStock", v)}
                />
              </div>
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button onClick={handleSaveAll} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-1">
              <ToggleRow
                title="Email notifications"
                description="Receive activity summaries and system reports to your inbox."
                checked={settings.emailNotifications}
                onChange={(v) => handleFieldChange("emailNotifications", v)}
              />
              <ToggleRow
                title="Low stock alerts"
                description="Get notified when a product falls below its alert threshold."
                checked={settings.lowStockAlerts}
                onChange={(v) => handleFieldChange("lowStockAlerts", v)}
              />
              <ToggleRow
                title="Out of stock alerts"
                description="Get urgent warning notifications for total stockouts."
                checked={settings.outOfStockAlerts}
                onChange={(v) => handleFieldChange("outOfStockAlerts", v)}
              />
              <ToggleRow
                title="Weekly report digest"
                description="A weekly summary report delivered every Monday morning."
                checked={settings.weeklyDigest}
                onChange={(v) => handleFieldChange("weeklyDigest", v)}
              />
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveAll} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP TAB */}
        <TabsContent value="backup" className="mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Backup & Data Export
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <ToggleRow
                title="Automatic daily backup"
                description="A full snapshot stored securely each night."
                checked={settings.autoDailyBackup}
                onChange={(v) => handleFieldChange("autoDailyBackup", v)}
              />
              <ToggleRow
                title="Export logs weekly"
                description="Email a CSV of stock activity every week."
                checked={settings.exportLogsWeekly}
                onChange={(v) => handleFieldChange("exportLogsWeekly", v)}
              />
              <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={handleDownloadBackup} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" /> Download Settings Backup (JSON)
                </Button>
                <Button onClick={handleSaveAll} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
