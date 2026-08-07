"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Save } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAuthUser, setAuthUser } from "@/lib/auth";
import { toast } from "sonner";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const active = getAuthUser();
    setName(active.name);
    setEmail(active.email);
    setRole(active.role);
    setAvatar(active.avatar);
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setAuthUser({
      name,
      email,
      role,
      avatar: name.slice(0, 2).toUpperCase(),
    });
    toast.success("Profile details updated successfully!");
  };

  return (
    <div>
      <PageHeader
        title="User Profile"
        description="View and update your company account details."
      />

      <div className="grid gap-6 max-w-2xl">
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
      </div>
    </div>
  );
}
