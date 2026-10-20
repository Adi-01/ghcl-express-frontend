"use client";

import { useState, useEffect } from "react";
import {
  useAdminUpsertBankDetailsMutation,
  useAdminDeleteBankDetailsMutation,
} from "@/lib/hooks/mutations/useAdminMutations";
import { User } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUserBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function AdminUserBankModal({
  open,
  onOpenChange,
  user,
}: AdminUserBankModalProps) {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rejectionAlert, setRejectionAlert] = useState<{
    message: string;
    resolution?: string;
  } | null>(null);

  const existingBank = user?.bank_details;

  useEffect(() => {
    setFieldErrors({});
    setRejectionAlert(null);

    if (existingBank && open) {
      setAccountHolderName(existingBank.account_holder_name || "");
      setBankName(existingBank.bank_name || "");
      setAccountNumber(existingBank.account_number || "");
      setIfscCode(existingBank.ifsc_code || "");
      setIsVerified(existingBank.is_verified || false);
    } else if (open) {
      setAccountHolderName(user?.username || user?.email || "");
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setIsVerified(true);
    }
  }, [user, existingBank, open]);

  const upsertMutation = useAdminUpsertBankDetailsMutation();
  const deleteMutation = useAdminDeleteBankDetailsMutation();
  const isPending = upsertMutation.isPending || deleteMutation.isPending;

  // Real-time field validators
  const validateHolderName = (val: string) => {
    if (!val.trim()) return "Account holder name is required.";
    return "";
  };

  const validateBankName = (val: string) => {
    if (!val.trim()) return "Bank name is required.";
    return "";
  };

  const validateAccountNumber = (val: string) => {
    const clean = val.trim();
    if (!clean) return "Account number is required.";
    if (clean.length < 5) return "Account number must be at least 5 digits.";
    if (!/^\d+$/.test(clean) && !clean.includes("*")) {
      return "Account number must contain only numeric digits.";
    }
    return "";
  };

  const validateIfsc = (val: string) => {
    const clean = val.toUpperCase().trim();
    if (!clean) return "IFSC code is required.";
    if (clean.length !== 11 || !IFSC_REGEX.test(clean)) {
      return "Invalid IFSC format (e.g. SBIN0001234). 4 letters, '0', then 6 alphanumeric characters.";
    }
    return "";
  };

  const handleHolderNameChange = (val: string) => {
    setAccountHolderName(val);
    const err = validateHolderName(val);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next.account_holder_name = err;
      else delete next.account_holder_name;
      return next;
    });
    setRejectionAlert(null);
  };

  const handleBankNameChange = (val: string) => {
    setBankName(val);
    const err = validateBankName(val);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next.bank_name = err;
      else delete next.bank_name;
      return next;
    });
    setRejectionAlert(null);
  };

  const handleAccountNumberChange = (val: string) => {
    setAccountNumber(val);
    const err = validateAccountNumber(val);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next.account_number = err;
      else delete next.account_number;
      return next;
    });
    setRejectionAlert(null);
  };

  const handleIfscChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setIfscCode(upper);
    const err = validateIfsc(upper);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next.ifsc_code = err;
      else delete next.ifsc_code;
      return next;
    });
    setRejectionAlert(null);
  };

  // Live validity calculation
  const isHolderValid = accountHolderName.trim().length > 0 && !validateHolderName(accountHolderName);
  const isBankValid = bankName.trim().length > 0 && !validateBankName(bankName);
  const isAccountValid = accountNumber.trim().length > 0 && !validateAccountNumber(accountNumber);
  const isIfscValid = Boolean(ifscCode) && !validateIfsc(ifscCode);
  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const isFormValid = isHolderValid && isBankValid && isAccountValid && isIfscValid && !hasErrors;

  const hasChanges = existingBank
    ? accountHolderName.trim() !== (existingBank.account_holder_name || "").trim() ||
      bankName.trim() !== (existingBank.bank_name || "").trim() ||
      (accountNumber.trim() !== "" && accountNumber.trim() !== (existingBank.account_number || "").trim()) ||
      ifscCode.toUpperCase().trim() !== (existingBank.ifsc_code || "").toUpperCase().trim() ||
      isVerified !== (existingBank.is_verified || false)
    : true;

  const canSubmit = isFormValid && hasChanges;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;

    upsertMutation.mutate(
      {
        user_id: user.id,
        account_holder_name: accountHolderName.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.toUpperCase().trim(),
        is_verified: isVerified,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error: any) => {
          if (Array.isArray(error?.details)) {
            const reasons = error.details.map((d: any) => d.message).join(" • ");
            setRejectionAlert({
              message: `Validation Rejected: ${reasons}`,
              resolution: "Please update the required fields as indicated.",
            });
          } else {
            setRejectionAlert({
              message: error?.message || "Failed to update user bank details.",
              resolution: "Verify the bank details and try again.",
            });
          }
        },
      }
    );
  };

  const handleDelete = () => {
    if (!user) return;
    deleteMutation.mutate(user.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#121316] border border-border text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            Manage Bank Account: {user?.email}
          </DialogTitle>
        </DialogHeader>

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

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="adminHolderName" className="text-xs text-muted-foreground">
              Account Holder Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="adminHolderName"
              value={accountHolderName}
              onChange={(e) => handleHolderNameChange(e.target.value)}
              onBlur={(e) => handleHolderNameChange(e.target.value)}
              disabled={isPending}
              className={cn(
                "bg-black/40 border-border",
                fieldErrors.account_holder_name && "border-rose-500/80 focus-visible:ring-rose-500"
              )}
            />
            {fieldErrors.account_holder_name && (
              <p className="text-[11px] text-rose-400 font-medium">
                {fieldErrors.account_holder_name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminBankName" className="text-xs text-muted-foreground">
              Bank Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="adminBankName"
              value={bankName}
              onChange={(e) => handleBankNameChange(e.target.value)}
              onBlur={(e) => handleBankNameChange(e.target.value)}
              disabled={isPending}
              className={cn(
                "bg-black/40 border-border",
                fieldErrors.bank_name && "border-rose-500/80 focus-visible:ring-rose-500"
              )}
            />
            {fieldErrors.bank_name && (
              <p className="text-[11px] text-rose-400 font-medium">
                {fieldErrors.bank_name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminAccNumber" className="text-xs text-muted-foreground">
              Account Number <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="adminAccNumber"
              value={accountNumber}
              onChange={(e) => handleAccountNumberChange(e.target.value)}
              onBlur={(e) => handleAccountNumberChange(e.target.value)}
              disabled={isPending}
              className={cn(
                "font-mono bg-black/40 border-border",
                fieldErrors.account_number && "border-rose-500/80 focus-visible:ring-rose-500"
              )}
            />
            {fieldErrors.account_number && (
              <p className="text-[11px] text-rose-400 font-medium">
                {fieldErrors.account_number}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adminIfsc" className="text-xs text-muted-foreground">
              IFSC Code <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="adminIfsc"
              className={cn(
                "uppercase font-mono bg-black/40 border-border",
                fieldErrors.ifsc_code && "border-rose-500/80 focus-visible:ring-rose-500"
              )}
              value={ifscCode}
              onChange={(e) => handleIfscChange(e.target.value)}
              onBlur={(e) => handleIfscChange(e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.ifsc_code && (
              <p className="text-[11px] text-rose-400 font-medium">
                {fieldErrors.ifsc_code}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="adminVerified" className="text-sm font-medium">
                Verified Account
              </Label>
              <p className="text-xs text-muted-foreground">
                Mark this bank account as verified by administration.
              </p>
            </div>
            <Switch
              id="adminVerified"
              checked={isVerified}
              onCheckedChange={setIsVerified}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border/40 flex items-center justify-between">
            {existingBank && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
                size="sm"
              >
                Delete Bank
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || isPending}
                className="bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Bank Details"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
