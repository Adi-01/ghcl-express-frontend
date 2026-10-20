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
import { Loader2, Monitor, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { User, Session } from "@/lib/types";
import { AVAILABLE_ROLES, getRoleError } from "./AdminUserCreateModal";
import { useAdminUpdateUserMutation } from "@/lib/hooks/mutations/useAdminMutations";
import { useAdminUserSessionsQuery } from "@/lib/hooks/queries/useAdminUsersQuery";
import { useRevokeSessionMutation } from "@/lib/hooks/mutations/useAuthMutations";

function formatDeviceName(ua?: string) {
  if (!ua) return "Unknown Device";
  let browser = "Web Browser";
  let os = "Unknown OS";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return `${browser} on ${os}`;
}

interface AdminUserEditModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  user: User | null;
}

export function AdminUserEditModal({
  isOpen,
  onClose,
  user,
}: AdminUserEditModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "sessions">("profile");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [empId, setEmpId] = useState("");
  const [designation, setDesignation] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rejectionAlert, setRejectionAlert] = useState<{
    message: string;
    resolution?: string;
  } | null>(null);

  const updateMutation = useAdminUpdateUserMutation();
  const revokeMutation = useRevokeSessionMutation();

  const { data: sessions = [], isLoading: isLoadingSessions } =
    useAdminUserSessionsQuery(user?.id || "");

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Field validators
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
    if (val && val.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return "";
  };

  useEffect(() => {
    if (user && isOpen) {
      setEmail(user.email || "");
      setPassword("");
      setUsername(user.username || "");
      setPhoneNumber(user.phone_number || user.phoneNumber || "");
      setEmpId(user.emp_id || "");
      setDesignation(user.designation || "");
      const isUserAdmin = Boolean(
        user.is_admin ||
        user.role === "ADMIN" ||
        user.labels?.some((l) => ["ADMIN", "SUPERADMIN"].includes(String(l).toUpperCase()))
      );
      setIsStaff(isUserAdmin);
      const filteredLabels = (user.labels || [])
        .filter((l) => !["ADMIN", "SUPERADMIN", "EMPLOYEE"].includes(String(l).toUpperCase()))
        .map((l) => l.toLowerCase());
      setLabels(filteredLabels.length > 0 ? filteredLabels : ["attend"]);
      setIsActive(user.is_active);
      setActiveTab("profile");
      setEmailError("");
      setPhoneError("");
      setPasswordError("");
      setRejectionAlert(null);
    }
  }, [user, isOpen]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!user) return;
    setRevokingSessionId(sessionId);
    try {
      await revokeMutation.mutateAsync({
        userId: user.id,
        sessionId,
      });
    } catch {
      // toast handled in mutation
    } finally {
      setRevokingSessionId(null);
    }
  };

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

  // Dirty check
  const initialEmail = (user?.email || "").trim();
  const initialUsername = (user?.username || "").trim();
  const initialPhone = (user?.phone_number || user?.phoneNumber || "").trim();
  const initialEmpId = (user?.emp_id || "").trim();
  const initialDesignation = (user?.designation || "").trim();
  const initialIsAdmin = Boolean(
    user?.is_admin ||
    user?.role === "ADMIN" ||
    user?.labels?.some((l) => ["ADMIN", "SUPERADMIN"].includes(String(l).toUpperCase()))
  );
  const initialActive = user?.is_active ?? true;
  const initialLabels = (user?.labels || [])
    .filter((l) => !["ADMIN", "SUPERADMIN", "EMPLOYEE"].includes(String(l).toUpperCase()))
    .map((l) => l.toLowerCase());
  const baselineLabels = initialLabels.length > 0 ? initialLabels.sort() : ["attend"];
  const currentLabels = [...labels].sort();
  const labelsChanged =
    currentLabels.length !== baselineLabels.length ||
    currentLabels.some((l, idx) => l !== baselineLabels[idx]);

  const hasChanges =
    password.trim() !== "" ||
    email.trim() !== initialEmail ||
    username.trim() !== initialUsername ||
    phoneNumber.trim() !== initialPhone ||
    empId.trim() !== initialEmpId ||
    designation.trim() !== initialDesignation ||
    isStaff !== initialIsAdmin ||
    isActive !== initialActive ||
    labelsChanged;

  const isEmailValid = email.trim().length > 0 && !validateEmail(email);
  const isPhoneValid = !validatePhone(phoneNumber);
  const isPasswordValid = !validatePassword(password);
  const isFormValid = isEmailValid && isPhoneValid && isPasswordValid && !roleError;

  const canSubmit = isFormValid && hasChanges;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) {
      setPasswordError(passErr);
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

    const payload: any = {
      email: email.trim(),
      username: username.trim() || undefined,
      phone_number: phoneNumber.trim() || undefined,
      emp_id: empId.trim() || undefined,
      designation: designation.trim() || undefined,
      labels: assignedLabels,
      is_active: isActive,
    };

    if (password.trim() !== "") {
      payload.password = password;
    }

    updateMutation.mutate(
      { id: user.id, data: payload },
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
              message: error?.message || "Failed to update user.",
              resolution: "Please check your inputs and try again.",
            });
          }
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto p-6 sm:p-8 bg-[#121316] border border-border text-white shadow-xl rounded-xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
            Manage User
          </DialogTitle>
          {user && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">{user.email}</p>
          )}
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b border-border/60 mt-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 mr-6 ${
              activeTab === "profile"
                ? "border-white text-white"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Profile Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "sessions"
                ? "border-white text-white"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            Active Devices{" "}
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {sessions.length}
            </span>
          </button>
        </div>

        {activeTab === "profile" && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 animate-in fade-in duration-300"
          >
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
                <Label className="text-xs text-muted-foreground">Email</Label>
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
                  disabled={updateMutation.isPending}
                />
                {emailError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Username
                </Label>
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setRejectionAlert(null);
                  }}
                  className="bg-black/40 border-border text-sm"
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Phone Number
                </Label>
                <Input
                  type="text"
                  placeholder="10 digit mobile"
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
                  disabled={updateMutation.isPending}
                />
                {phoneError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  New Password
                </Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
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
                  disabled={updateMutation.isPending}
                />
                {passwordError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Employee ID
                </Label>
                <Input
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  placeholder="e.g. EMP1024"
                  className="bg-black/40 border-border text-sm font-mono"
                  disabled={updateMutation.isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Designation
                </Label>
                <Input
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Area Manager"
                  className="bg-black/40 border-border text-sm"
                  disabled={updateMutation.isPending}
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

            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-white">Admin Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Grants full system administrator privileges.
                  </p>
                </div>
                <Switch checked={isStaff} onCheckedChange={handleStaffToggle} />
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-white">Active Status</Label>
                    {!isActive && (
                      <Badge
                        variant="destructive"
                        className="h-5 px-1.5 text-[10px]"
                      >
                        Blocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isActive
                      ? "User can authenticate and access apps."
                      : "User is blocked from logging in."}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            {roleError && (
              <div className="text-xs font-medium text-rose-400 bg-rose-950/40 p-3 rounded-md border border-rose-900/50">
                {roleError}
              </div>
            )}

            <div className="pt-3 border-t border-border/40 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                disabled={updateMutation.isPending}
                className="border-border text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || updateMutation.isPending}
                className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-3 pt-2 animate-in fade-in duration-300 min-h-[250px]">
            {isLoadingSessions ? (
              <div className="flex flex-col items-center justify-center py-10 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-xs text-muted-foreground">
                  Scanning device sessions...
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border/60 rounded-xl bg-black/20">
                <Monitor className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm font-medium text-white">No Active Sessions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This user is not currently signed in on any device.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {sessions.map((session: Session, index: number) => {
                  const sessionKey = session.token || session.id || `session-${index}`;
                  return (
                    <div
                      key={sessionKey}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/60 bg-black/30 hover:bg-white/[0.02] transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 overflow-hidden flex-1 min-w-0">
                        {session.deviceInfo?.toLowerCase().includes("mobi") ||
                        session.deviceInfo?.toLowerCase().includes("iphone") ? (
                          <Smartphone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        ) : (
                          <Monitor className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}

                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            className="text-sm font-medium truncate text-white"
                            title={session.deviceInfo}
                          >
                            {formatDeviceName(session.deviceInfo)}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
                            {session.ipAddress && (
                              <span className="font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                {session.ipAddress}
                              </span>
                            )}
                            <span className="truncate">
                              {session.createdAt
                                ? new Date(session.createdAt).toLocaleDateString()
                                : "Active"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(sessionKey)}
                        disabled={revokingSessionId === sessionKey}
                        className="shrink-0 h-8 text-xs border-border text-rose-400 hover:bg-rose-950/30"
                      >
                        {revokingSessionId === sessionKey ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Revoke"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
