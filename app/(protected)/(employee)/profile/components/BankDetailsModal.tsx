"use client";

import { useState, useEffect } from "react";
import {
  useCreateBankDetailsMutation,
  useUpdateBankDetailsMutation,
} from "@/lib/hooks/mutations/useProfileMutations";
import { BankDetails } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BankDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankDetails?: BankDetails | null;
}

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function BankDetailsModal({
  open,
  onOpenChange,
  bankDetails,
}: BankDetailsModalProps) {
  const isEditing = Boolean(bankDetails);

  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState<"SAVINGS" | "CURRENT" | "SALARY">("SAVINGS");
  const [accountNumber, setAccountNumber] = useState("");
  const [isEditingNumber, setIsEditingNumber] = useState(!isEditing);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rejectionAlert, setRejectionAlert] = useState<{
    message: string;
    resolution?: string;
  } | null>(null);

  useEffect(() => {
    setFieldErrors({});
    setRejectionAlert(null);

    if (bankDetails && open) {
      setBankName(bankDetails.bank_name || "");
      setBranchName(bankDetails.branch_name || "");
      setAccountHolderName(bankDetails.account_holder_name || "");
      setIfscCode(bankDetails.ifsc_code || "");
      setAccountType(bankDetails.account_type || "SAVINGS");
      setAccountNumber(bankDetails.account_number || "");
      setIsEditingNumber(false);
    } else if (open) {
      setBankName("");
      setBranchName("");
      setAccountHolderName("");
      setIfscCode("");
      setAccountType("SAVINGS");
      setAccountNumber("");
      setIsEditingNumber(true);
    }
  }, [bankDetails, open]);

  const createMutation = useCreateBankDetailsMutation();
  const updateMutation = useUpdateBankDetailsMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Validation functions
  const validateBankName = (val: string): string => {
    if (!val.trim()) return "Bank name is required.";
    return "";
  };

  const validateHolderName = (val: string): string => {
    if (!val.trim()) return "Account holder name is required.";
    return "";
  };

  const validateIfsc = (val: string): string => {
    const clean = val.toUpperCase().trim();
    if (!clean) return "IFSC code is required.";
    if (clean.length !== 11 || !IFSC_REGEX.test(clean)) {
      return "Invalid IFSC format (e.g. SBIN0001234). 4 letters, '0', then 6 alphanumeric characters.";
    }
    return "";
  };

  const validateAccountNumber = (val: string): string => {
    if (isEditing && !isEditingNumber) return "";
    const clean = val.trim();
    if (!clean) return "Account number is required.";
    if (clean.length < 5) return "Account number must be at least 5 digits.";
    if (!/^\d+$/.test(clean)) return "Account number must contain only numeric digits.";
    return "";
  };

  // Change handlers with instant feedback
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

  // Status checks for disabling button until completely valid
  const isBankNameValid = bankName.trim().length > 0 && !validateBankName(bankName);
  const isHolderNameValid = accountHolderName.trim().length > 0 && !validateHolderName(accountHolderName);
  const isIfscValid = Boolean(ifscCode) && !validateIfsc(ifscCode);
  const isAccountValid = isEditing && !isEditingNumber
    ? true
    : Boolean(accountNumber) && !validateAccountNumber(accountNumber);

  const hasAnyErrors = Object.values(fieldErrors).some((msg) => Boolean(msg));
  const isFormValid =
    isBankNameValid &&
    isHolderNameValid &&
    isIfscValid &&
    isAccountValid &&
    !hasAnyErrors;

  // For update mode: verify if user actually changed any value
  const hasChanges = isEditing
    ? bankName.trim() !== (bankDetails?.bank_name || "").trim() ||
      branchName.trim() !== (bankDetails?.branch_name || "").trim() ||
      accountHolderName.trim() !== (bankDetails?.account_holder_name || "").trim() ||
      ifscCode.toUpperCase().trim() !== (bankDetails?.ifsc_code || "").toUpperCase().trim() ||
      accountType !== (bankDetails?.account_type || "SAVINGS") ||
      (isEditingNumber &&
        accountNumber.trim() !== "" &&
        accountNumber.trim() !== (bankDetails?.account_number || "").trim())
    : true;

  const canSubmit = isFormValid && hasChanges;

  const handleMutationError = (error: any) => {
    const backendFieldErrors: Record<string, string> = {};
    const reasons: string[] = [];

    if (Array.isArray(error?.details)) {
      error.details.forEach((err: { field?: string; message?: string }) => {
        if (err.field) {
          backendFieldErrors[err.field] = err.message || "Invalid value";
        }
        if (err.message) {
          reasons.push(err.message);
        }
      });
    }

    setFieldErrors(backendFieldErrors);
    setRejectionAlert({
      message:
        reasons.length > 0
          ? `Validation Rejected: ${reasons.join(" • ")}`
          : error?.message || "Backend rejected bank details submission.",
      resolution:
        "Please update the indicated fields with valid information and submit again.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

    const payload: any = {
      bank_name: bankName.trim(),
      branch_name: branchName.trim() ? branchName.trim() : undefined,
      account_holder_name: accountHolderName.trim(),
      ifsc_code: ifscCode.toUpperCase().trim(),
      account_type: accountType,
    };

    if (accountNumber && !accountNumber.includes("*")) {
      payload.account_number = accountNumber.trim();
    }

    if (isEditing) {
      updateMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
        onError: handleMutationError,
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
        onError: handleMutationError,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-[#121316] border border-border text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            {isEditing ? "Update Bank Details" : "Add Bank Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Update your bank account information below."
              : "Enter your bank account details for salary disbursement."}
          </DialogDescription>
        </DialogHeader>

        {rejectionAlert && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 my-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-300">{rejectionAlert.message}</p>
              {rejectionAlert.resolution && (
                <p className="text-zinc-300 text-[11px]">
                  {rejectionAlert.resolution}
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bankName" className="text-xs text-muted-foreground">
                Bank Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="e.g. State Bank of India"
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
              <Label htmlFor="branchName" className="text-xs text-muted-foreground">
                Branch Name (Optional)
              </Label>
              <Input
                id="branchName"
                placeholder="e.g. MG Road Branch"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                disabled={isPending}
                className="bg-black/40 border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="holderName" className="text-xs text-muted-foreground">
                Account Holder Name <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="holderName"
                placeholder="Exact name as in bank records"
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
              <Label htmlFor="ifsc" className="text-xs text-muted-foreground">
                IFSC Code <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="ifsc"
                placeholder="e.g. SBIN0001234"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="accNumber" className="text-xs text-muted-foreground">
                Account Number <span className="text-rose-400">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="accNumber"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  onBlur={(e) => handleAccountNumberChange(e.target.value)}
                  disabled={!isEditingNumber || isPending}
                  className={cn(
                    "font-mono bg-black/40 border-border",
                    fieldErrors.account_number && "border-rose-500/80 focus-visible:ring-rose-500"
                  )}
                />
                {!isEditingNumber && isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-border"
                    onClick={() => {
                      setIsEditingNumber(true);
                      setAccountNumber("");
                      handleAccountNumberChange("");
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {fieldErrors.account_number && (
                <p className="text-[11px] text-rose-400 font-medium">
                  {fieldErrors.account_number}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountType" className="text-xs text-muted-foreground">
                Account Type
              </Label>
              <Select
                value={accountType}
                onValueChange={(val: any) => setAccountType(val)}
                disabled={isPending}
              >
                <SelectTrigger id="accountType" className="bg-black/40 border-border">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent className="bg-[#121316] border-border text-white">
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SALARY">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/40 gap-2">
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
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
