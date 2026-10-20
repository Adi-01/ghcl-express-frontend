"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCreateUserMutation } from "@/lib/hooks/mutations/useAdminMutations";

export const AVAILABLE_ROLES = [
  { id: "attend", label: "Attendance" },
  { id: "attend-viewer", label: "Attendance Viewer" },
  { id: "ghcl", label: "Night Checking" },
  { id: "ghcl-viewer", label: "Night Checking Viewer" },
  { id: "bulker", label: "Bulker" },
  { id: "bulker-viewer", label: "Bulker Viewer" },
];

export function getRoleError(labels: string[]): string | null {
  const normalized = labels.map((l) => l.toLowerCase());
  if (normalized.includes("ghcl") && normalized.includes("ghcl-viewer")) {
    return "A user cannot have both Night Checking and Night Checking Viewer roles.";
  }
  if (normalized.includes("bulker") && normalized.includes("bulker-viewer")) {
    return "A user cannot have both Bulker and Bulker Viewer roles.";
  }
  if (normalized.includes("attend") && normalized.includes("attend-viewer")) {
    return "A user cannot have both Attendance and Attendance Viewer roles.";
  }
  return null;
}

interface AdminUserCreateModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function AdminUserCreateModal({
  isOpen,
  onClose,
}: AdminUserCreateModalProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [empId, setEmpId] = useState("");
  const [designation, setDesignation] = useState("");
  const [isStaff, setIsStaff] = useState(false);
  const [labels, setLabels] = useState<string[]>(["attend"]);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rejectionAlert, setRejectionAlert] = useState<{
    message: string;
    resolution?: string;
  } | null>(null);

  const createMutation = useAdminCreateUserMutation();

  const validateEmail = (val: string) => {
    const clean = val.trim();
    if (!clean) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return "Invalid email address format.";
    }
    return "";
  };

  const validatePhone = (val: string) => {
    const clean = val.trim();
    if (!clean) return "";
    if (clean.length !== 10) return "Phone number must be exactly 10 digits.";
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return "Must start with 6, 7, 8, or 9.";
    }
    return "";
  };

  const validatePassword = (val: string) => {
    const clean = val.trim();
    if (!clean) return "Password is required.";
    if (clean.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setUsername("");
      setPhoneNumber("");
      setPassword("");
      setEmpId("");
      setDesignation("");
      setIsStaff(false);
      setLabels(["attend"]);
      setEmailError("");
      setPhoneError("");
      setPasswordError("");
      setRejectionAlert(null);
    }
  }, [isOpen]);

  const toggleRole = (roleId: string) => {
    setLabels((prev) => {
      const hasRole = prev.includes(roleId);
      if (hasRole) {
        return prev.filter((l) => l !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleStaffToggle = (checked: boolean) => {
    setIsStaff(checked);
  };

  const roleError = getRoleError(labels);

  const isEmailValid = email.trim().length > 0 && !validateEmail(email);
  const isPasswordValid = password.trim().length > 0 && !validatePassword(password);
  const isPhoneValid = !validatePhone(phoneNumber);
  const isFormValid = isEmailValid && isPasswordValid && isPhoneValid && !roleError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) {
      setPasswordError(passErr);
      return;
    }

    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    if (roleError) {
      return;
    }

    setRejectionAlert(null);

    const selectedAppRoles = labels.length > 0 ? labels : ["attend"];
    const assignedLabels = isStaff
      ? Array.from(new Set(["ADMIN", ...selectedAppRoles]))
      : selectedAppRoles.filter((l) => !["ADMIN", "SUPERADMIN", "EMPLOYEE"].includes(l.toUpperCase()));

    createMutation.mutate(
      {
        email: email.trim(),
        username: username.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        password,
        emp_id: empId.trim() || undefined,
        designation: designation.trim() || undefined,
        labels: assignedLabels,
        is_active: true,
      },
      {
        onSuccess: () => {
          onClose(false);
        },
        onError: (error: any) => {
          if (Array.isArray(error?.details)) {
            const reasons = error.details.map((d: any) => d.message).join(" • ");
            setRejectionAlert({
              message: `Validation Rejected: ${reasons}`,
              resolution: "Please correct the indicated user details and submit again.",
            });
          } else {
            setRejectionAlert({
              message: error?.message || "Failed to create user.",
              resolution: "Please check your inputs and try again.",
            });
          }
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-6 sm:p-8 bg-[#121316] border border-border text-white shadow-xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
            Create User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {rejectionAlert && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 my-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-300">{rejectionAlert.message}</p>
                {rejectionAlert.resolution && (
                  <p className="text-zinc-300 text-[11px]">{rejectionAlert.resolution}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Email <span className="text-rose-400">*</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(validateEmail(e.target.value));
                  setRejectionAlert(null);
                }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                className={cn(
                  "bg-black/40 border-border text-sm",
                  emailError && "border-rose-500/80 focus-visible:ring-rose-500"
                )}
                placeholder="user@company.com"
                disabled={createMutation.isPending}
              />
              {emailError && (
                <p className="text-[11px] text-rose-400 font-medium">
                  {emailError}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Password <span className="text-rose-400">*</span>
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                  setRejectionAlert(null);
                }}
                onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
                className={cn(
                  "bg-black/40 border-border text-sm",
                  passwordError && "border-rose-500/80 focus-visible:ring-rose-500"
                )}
                placeholder="Min 6 characters"
                disabled={createMutation.isPending}
              />
              {passwordError && (
                <p className="text-[11px] text-rose-400 font-medium">
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setRejectionAlert(null);
                }}
                className="bg-black/40 border-border text-sm"
                placeholder="John Doe"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Phone Number
              </Label>
              <Input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  const numericValue = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                  setPhoneNumber(numericValue);
                  setPhoneError(validatePhone(numericValue));
                  setRejectionAlert(null);
                }}
                onBlur={(e) => setPhoneError(validatePhone(e.target.value))}
                className={cn(
                  "bg-black/40 border-border text-sm",
                  phoneError && "border-rose-500/80 focus-visible:ring-rose-500"
                )}
                placeholder="10 digit mobile"
                disabled={createMutation.isPending}
              />
              {phoneError && (
                <p className="text-[11px] text-rose-400 font-medium">
                  {phoneError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Employee ID
              </Label>
              <Input
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="bg-black/40 border-border text-sm font-mono"
                placeholder="e.g. EMP1024"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Designation
              </Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="bg-black/40 border-border text-sm"
                placeholder="e.g. Area Manager"
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Access Roles
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ROLES.map((role) => {
                const isSelected = labels.includes(role.id);
                return (
                  <Badge
                    key={role.id}
                    variant={isSelected ? "default" : "secondary"}
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "cursor-pointer select-none text-xs px-2.5 py-1 transition-colors border",
                      isSelected
                        ? "bg-white text-black hover:bg-zinc-200 border-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800"
                    )}
                  >
                    {role.label}
                  </Badge>
                );
              })}
            </div>
            {labels.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Default Attendance (attend) role will be assigned.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-border/40">
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-white">Admin Access</Label>
                <p className="text-xs text-muted-foreground">
                  Grant backend administrator privileges.
                </p>
              </div>
              <Switch checked={isStaff} onCheckedChange={handleStaffToggle} />
            </div>
          </div>

          {roleError && (
            <div className="text-xs font-medium text-rose-400 bg-rose-950/40 p-3 rounded-md border border-rose-900/50">
              {roleError}
            </div>
          )}

          <div className="pt-4 border-t border-border/40 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={createMutation.isPending}
              className="border-border text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createMutation.isPending}
              className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
