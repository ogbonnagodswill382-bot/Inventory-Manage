"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, Edit, Trash2, Users, Copy, Check, ShieldCheck, Ban, CheckCircle, Crown, Shield, Building2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createUser, getUsers, updateUser, deleteUser } from "@/lib/api";
import { getAuthUser, getCompanyStaffLink } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleColor = {
  Administrator: "bg-primary/10 text-primary font-bold border-primary/20",
  "Inventory Manager": "bg-info/10 text-info",
  "Warehouse Staff": "bg-warning/15 [color:oklch(0.5_0.15_65)]",
  Viewer: "bg-muted text-muted-foreground",
};

function UsersContent() {
  const searchParams = useSearchParams();
  const preName = searchParams.get("name");
  const preEmail = searchParams.get("email");

  const [userList, setUserList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Create / Edit Modal states
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Warehouse Staff");
  const [statusVal, setStatusVal] = useState("active");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("SK");
  const [submitting, setSubmitting] = useState(false);

  // Credential Notice Popup states
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedStaffLink, setCopiedStaffLink] = useState(false);

  const companySlug = currentUser?.company_slug || "default";
  const staffLink = getCompanyStaffLink(companySlug);

  async function loadData() {
    const data = await getUsers();
    if (data && Array.isArray(data)) {
      setUserList(data);
    }
  }

  useEffect(() => {
    setCurrentUser(getAuthUser());
    loadData();
    if (preName || preEmail) {
      setEditUser(null);
      setName(preName || "");
      setEmail(preEmail || "");
      setRole("Warehouse Staff");
      setStatusVal("active");
      setPassword("staff@12345");
      setAvatar(preName ? preName.slice(0, 2).toUpperCase() : "SK");
      setOpen(true);
      toast.info(`Pre-filled request for ${preName || preEmail}`);
    }
  }, [preName, preEmail]);

  const handleCopyStaffLink = () => {
    navigator.clipboard.writeText(staffLink);
    setCopiedStaffLink(true);
    toast.success("Dedicated Staff Sign-In Link copied to clipboard! 🔗", {
      description: `Share this link with your staff: ${staffLink}`,
    });
    setTimeout(() => setCopiedStaffLink(false), 3000);
  };

  const handleOpenAddModal = () => {
    setEditUser(null);
    setName("");
    setEmail("");
    setRole("Warehouse Staff");
    setStatusVal("active");
    setPassword("");
    setAvatar("SK");
    setOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setStatusVal(u.status);
    setPassword("");
    setAvatar(u.avatar || u.name.slice(0, 2).toUpperCase());
    setOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter Name and Email");
      return;
    }

    setSubmitting(true);

    if (editUser) {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        role,
        status: statusVal,
        avatar: avatar.toUpperCase(),
        ...(password.trim() ? { password: password.trim() } : {}),
      };
      const res = await updateUser(editUser.id, payload);
      if (res && !res.error) {
        toast.success(`Updated profile for ${name}`, {
          description: password.trim()
            ? "Password reset and account status updated."
            : `Account status: ${statusVal.toUpperCase()}.`,
        });
        setOpen(false);
        await loadData();
      } else {
        toast.error(res?.error || "Failed to update user profile");
      }
    } else {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        role,
        password: password.trim() || "staff@12345",
        avatar: avatar.toUpperCase(),
      };
      const res = await createUser(payload);
      if (res && res.user) {
        toast.success("Staff account created successfully!");
        setOpen(false);
        setCreatedCreds({
          name: name.trim(),
          email: email.trim(),
          password: res.initial_password || password.trim(),
          role,
        });
        setCredModalOpen(true);
        await loadData();
      } else {
        toast.error(res?.error || "Failed to create staff account");
      }
    }
    setSubmitting(false);
  };

  const handleToggleBlockUser = async (u) => {
    if (u.role === "Administrator") {
      toast.error("Access Protected!", {
        description: "Top Administrator accounts cannot be blocked or suspended.",
      });
      return;
    }

    const isCurrentlyBlocked = u.status === "blocked" || u.status === "inactive";
    const newStatus = isCurrentlyBlocked ? "active" : "blocked";
    
    const res = await updateUser(u.id, {
      ...u,
      status: newStatus,
    });

    if (res && !res.error) {
      toast.success(
        newStatus === "blocked"
          ? `Blocked ${u.name} from accessing the application 🚫`
          : `Re-activated account for ${u.name} ✅`
      );
      await loadData();
    } else {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.role === "Administrator") {
      toast.error("Access Protected!", {
        description: "Top Administrator accounts cannot be deleted.",
      });
      return;
    }

    const res = await deleteUser(u.id);
    if (res && !res.error) {
      toast.success(`Removed account for ${u.name}`);
      await loadData();
    } else {
      toast.error(res?.error || "Failed to delete user");
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCreds) return;
    const text = `StockFlow Staff Credentials:\nCompany Staff Link: ${staffLink}\nName: ${createdCreds.name}\nEmail/Username: ${createdCreds.email}\nPassword: ${createdCreds.password}\nRole: ${createdCreds.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials & Staff Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & User Management"
        description="Manage team member roles, permissions, access status, and share dedicated company sign-in links."
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Team Member
          </Button>
        }
      />

      {/* DEDICATED COMPANY STAFF LINK BANNER */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-card to-background">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold text-sm text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Dedicated Company Staff Link
            </div>
            <div className="text-xs text-muted-foreground">
              Share this dedicated link with staff. Opening this link displays a clean Sign In form for your company workspace.
            </div>
            <div className="font-mono text-xs text-primary font-bold select-all bg-background px-2.5 py-1 rounded border inline-block mt-1">
              {staffLink}
            </div>
          </div>
          <Button size="sm" className="text-xs font-semibold shrink-0" onClick={handleCopyStaffLink}>
            {copiedStaffLink ? <Check className="mr-1.5 h-3.5 w-3.5 text-white" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copiedStaffLink ? "Copied Staff Link!" : "Copy Staff Sign-In Link"}
          </Button>
        </CardContent>
      </Card>

      {/* ADD / EDIT USER DIALOG MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveUser}>
            <DialogHeader>
              <DialogTitle>{editUser ? `Edit ${editUser.name}` : "Create New Team Member"}</DialogTitle>
              <DialogDescription>
                {editUser
                  ? "Update staff role, permissions, status, or reset login password."
                  : "Add a staff member to your company workspace."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <Label htmlFor="u-name">Full Name</Label>
                <Input
                  id="u-name"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editUser && e.target.value.trim()) {
                      setAvatar(e.target.value.trim().slice(0, 2).toUpperCase());
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="u-email">Work Email / Login Identifier</Label>
                <Input
                  id="u-email"
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Assigned Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                      <SelectItem value="Warehouse Staff">Warehouse Staff</SelectItem>
                      <SelectItem value="Viewer">Viewer (Read-Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Account Status</Label>
                  <Select
                    value={statusVal}
                    onValueChange={setStatusVal}
                    disabled={editUser?.role === "Administrator"}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked / Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="u-pass">
                  {editUser ? "Reset Password (Leave blank to keep unchanged)" : "Initial Password"}
                </Label>
                <Input
                  id="u-pass"
                  type="password"
                  placeholder={editUser ? "New password..." : "e.g. staff@12345"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editUser ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREDENTIAL NOTICE POPUP MODAL */}
      <Dialog open={credModalOpen} onOpenChange={setCredModalOpen}>
        {createdCreds && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5 text-emerald-600" /> Account Created Successfully!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Share these login credentials and staff link with the team member.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Company Staff Link:</span>
                  <strong className="font-mono text-primary font-bold truncate max-w-[200px]">{staffLink}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Full Name:</span>
                  <strong className="text-foreground">{createdCreds.name}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Email / Username:</span>
                  <strong className="font-mono text-foreground">{createdCreds.email}</strong>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Initial Password:</span>
                  <strong className="font-mono text-emerald-600">{createdCreds.password}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <strong className="text-primary">{createdCreds.role}</strong>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button variant="outline" className="w-full text-xs" onClick={handleCopyCredentials}>
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied ? "Copied Credentials!" : "Copy Link & Credentials"}
              </Button>
              <Button className="w-full text-xs" onClick={() => setCredModalOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* USER LIST TABLE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User / Email</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs">
                      No team members found in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  userList.map((u) => {
                    const isBlocked = u.status === "blocked" || u.status === "inactive";
                    const isAdminUser = u.role === "Administrator";

                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {u.avatar || u.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-sm flex items-center gap-1.5">
                                {u.name}
                                {isAdminUser && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border", roleColor[u.role] || "bg-muted text-muted-foreground")}>
                            {u.role}
                          </span>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={u.status} />
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(u)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit / Reset Pass
                              </DropdownMenuItem>

                              {!isAdminUser && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleBlockUser(u)}
                                    className={isBlocked ? "text-emerald-600" : "text-amber-600"}
                                  >
                                    {isBlocked ? (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Re-Activate Account
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="mr-2 h-4 w-4" /> Suspend / Block Access
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem onClick={() => handleDeleteUser(u)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove User Account
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-muted-foreground">Loading users manager...</div>}>
      <UsersContent />
    </Suspense>
  );
}
