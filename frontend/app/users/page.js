"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, MoreHorizontal, Edit, Trash2, Users, Copy, Check, ShieldCheck, Ban, CheckCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleColor = {
  Administrator: "bg-primary/10 text-primary",
  "Inventory Manager": "bg-info/10 text-info",
  "Warehouse Staff": "bg-warning/15 [color:oklch(0.5_0.15_65)]",
  Viewer: "bg-muted text-muted-foreground",
};

function UsersContent() {
  const searchParams = useSearchParams();
  const preName = searchParams.get("name");
  const preEmail = searchParams.get("email");

  const [userList, setUserList] = useState([]);
  
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

  async function loadData() {
    const data = await getUsers();
    if (data && Array.isArray(data)) {
      setUserList(data);
    }
  }

  useEffect(() => {
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

  const handleOpenAddModal = () => {
    setEditUser(null);
    setName("");
    setEmail("");
    setRole("Warehouse Staff");
    setStatusVal("active");
    setPassword("staff@12345");
    setAvatar("SK");
    setOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role || "Warehouse Staff");
    setStatusVal(u.status || "active");
    setPassword("");
    setAvatar(u.avatar || "SK");
    setOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter user name and email");
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
      if (res) {
        toast.success(`Updated profile for ${name}`, {
          description: password.trim()
            ? "Password reset and account status updated."
            : `Account status: ${statusVal.toUpperCase()}.`,
        });
        setOpen(false);
        await loadData();
      } else {
        toast.error("Failed to update user profile");
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
    const isCurrentlyBlocked = u.status === "blocked" || u.status === "inactive";
    const newStatus = isCurrentlyBlocked ? "active" : "blocked";
    
    const res = await updateUser(u.id, {
      ...u,
      status: newStatus,
    });

    if (res) {
      toast.success(
        newStatus === "blocked"
          ? `Blocked ${u.name} from accessing the application 🚫`
          : `Re-activated account for ${u.name} ✅`
      );
      await loadData();
    } else {
      toast.error("Failed to update account status");
    }
  };

  const handleDeleteUser = async (id, uName) => {
    await deleteUser(id);
    toast.success(`Removed user "${uName}"`);
    await loadData();
  };

  const handleCopyCredentials = () => {
    if (!createdCreds) return;
    const text = `StockFlow Login Credentials:\nRole: ${createdCreds.role}\nName: ${createdCreds.name}\nEmail / Username: ${createdCreds.email}\nInitial Password: ${createdCreds.password}\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Login credentials copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Users & Access Management"
        description="As Administrator, manage staff profiles, reset passwords, and control access permissions."
        actions={
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Create Staff Account
          </Button>
        }
      />

      {/* CREATE / EDIT USER MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveUser}>
            <DialogHeader>
              <DialogTitle>{editUser ? `Manage Account: ${editUser.name}` : "Create Staff Account"}</DialogTitle>
              <DialogDescription>
                {editUser
                  ? "Update staff details, reset password, or suspend access."
                  : "Create an account for your employee and issue initial login credentials."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-sm">
              <div className="space-y-1">
                <Label htmlFor="u-name">Employee Full Name</Label>
                <Input id="u-name" placeholder="e.g. Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-email">Email Address (Login Username)</Label>
                <Input id="u-email" type="email" placeholder="alex@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="u-pass">{editUser ? "Reset Password (Optional)" : "Initial Password"}</Label>
                <Input
                  id="u-pass"
                  type="password"
                  placeholder={editUser ? "Type new password to reset..." : "staff@12345"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Assigned Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Warehouse Staff">Warehouse Staff</SelectItem>
                      <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Access Status</Label>
                  <Select value={statusVal} onValueChange={setStatusVal}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Access Allowed)</SelectItem>
                      <SelectItem value="blocked">Blocked / Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="u-avatar">Initials Avatar</Label>
                <Input id="u-avatar" maxLength={3} placeholder="SK" value={avatar} onChange={(e) => setAvatar(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editUser ? "Update Staff Account" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREDENTIAL NOTICE DIALOG (POPUP FOR ADMIN TO COPY LOGIN DETAILS) */}
      <Dialog open={credModalOpen} onOpenChange={setCredModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-5 w-5" /> Account Created & Ready to Issue
            </DialogTitle>
            <DialogDescription>
              Copy these login details and send them directly to your staff member.
            </DialogDescription>
          </DialogHeader>

          {createdCreds && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Employee Name:</span>
                <span className="font-semibold">{createdCreds.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Login Email:</span>
                <span className="font-mono font-medium">{createdCreds.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Initial Password:</span>
                <span className="font-mono font-bold text-primary">{createdCreds.password}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Assigned Role:</span>
                <span className="font-medium">{createdCreds.role}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setCredModalOpen(false)}>
              Done
            </Button>
            <Button onClick={handleCopyCredentials} className="gap-2">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied to Clipboard!" : "Copy Login Details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* USER LIST TABLE */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {userList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No team members created yet. Click "+ Create Staff Account" to issue logins.
                    </TableCell>
                  </TableRow>
                ) : (
                  userList.map((u) => {
                    const isBlocked = u.status === "blocked" || u.status === "inactive";
                    return (
                      <TableRow key={u.id} className={cn(isBlocked && "bg-destructive/5 opacity-80")}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{u.avatar || "SK"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {u.name}
                                {isBlocked && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.2 rounded-md">BLOCKED</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", roleColor[u.role] || "bg-muted text-muted-foreground")}>{u.role}</span>
                        </TableCell>
                        <TableCell><StatusBadge status={u.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.lastLogin || "just now"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditModal(u)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit & Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleBlockUser(u)} className={cn(isBlocked ? "text-emerald-600" : "text-amber-600")}>
                                {isBlocked ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                {isBlocked ? "Unblock Access" : "Block Access"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(u.id, u.name)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                              </DropdownMenuItem>
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
    <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Loading users manager...</div>}>
      <UsersContent />
    </Suspense>
  );
}
