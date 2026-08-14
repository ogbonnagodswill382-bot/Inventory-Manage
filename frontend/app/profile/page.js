"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, Sun, Moon, Laptop, Palette } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAuthUser, setAuthUser } from "@/lib/auth";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");
  const [personalTheme, setPersonalTheme] = useState("dark");

  useEffect(() => {
    const active = getAuthUser();
    if (active) {
      setName(active.name || "");
      setEmail(active.email || "");
      setRole(active.role || "");
      setAvatar(active.avatar || "");
    }
    setPersonalTheme(getStoredTheme());
  }, []);

  const handleSelectTheme = (mode) => {
    setPersonalTheme(mode);
    applyTheme(mode);
    toast.success(`Personal theme set to ${mode === "dark" ? "Dark Mode 🌙" : mode === "light" ? "Light Mode ☀️" : "System Default 💻"}`);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setAuthUser({
      name,
      email,
      role,
      avatar: name.slice(0, 2).toUpperCase(),
    });
    applyTheme(personalTheme);
    toast.success("Profile details updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="User Profile"
        description="View and manage your personal account preferences and workspace identity."
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div className="flex items-center gap-4 py-2 border-b pb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {avatar || "US"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-lg">{name}</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="prof-name">Full Name</Label>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prof-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="prof-email"
                    type="email"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="prof-role">Company Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="prof-role"
                    className="pl-9 bg-muted/40 cursor-not-allowed"
                    value={role}
                    readOnly
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Personal Appearance / Theme Preference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> Personal Appearance & Theme
            </CardTitle>
            <CardDescription className="text-xs">
              Choose your personal app theme preference. This choice is unique to your user account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTheme("dark")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-2 cursor-pointer",
                  personalTheme === "dark"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Moon className="h-6 w-6 text-indigo-400" />
                <div>
                  <div className="font-semibold text-xs">Dark Mode 🌙</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Sleek dark interface</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("light")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-2 cursor-pointer",
                  personalTheme === "light"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Sun className="h-6 w-6 text-amber-500" />
                <div>
                  <div className="font-semibold text-xs">Light Mode ☀️</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Clean crisp interface</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("system")}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center gap-2 cursor-pointer",
                  personalTheme === "system"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Laptop className="h-6 w-6 text-blue-400" />
                <div>
                  <div className="font-semibold text-xs">System Default 💻</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Match device theme</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
