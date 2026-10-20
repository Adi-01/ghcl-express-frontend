"use client";

import { useState, useEffect } from "react";
import { useUpdateProfileMutation } from "@/lib/hooks/mutations/useProfileMutations";
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
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function EditProfileModal({
  open,
  onOpenChange,
  user,
}: EditProfileModalProps) {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [rejectionAlert, setRejectionAlert] = useState<{
    message: string;
    resolution?: string;
  } | null>(null);

  useEffect(() => {
    setPhoneError("");
    setRejectionAlert(null);
    if (user && open) {
      setUsername(user.username || "");
      setPhoneNumber(user.phone_number || user.phoneNumber || "");
    }
  }, [user, open]);

  const updateMutation = useUpdateProfileMutation();

  const validatePhone = (val: string): string => {
    const clean = val.trim();
    if (!clean) return ""; // Optional, but if provided must be 10 digits
    const digitsOnly = clean.replace(/\D/g, "");
    const isTenDigits =
      digitsOnly.length === 10 ||
      (digitsOnly.length === 12 && digitsOnly.startsWith("91"));
    if (!isTenDigits) {
      return "Phone number must be a valid 10-digit mobile number (e.g. 9876543210).";
    }
    return "";
  };

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const err = validatePhone(val);
    setPhoneError(err);
    setRejectionAlert(null);
  };

  const isPhoneValid = !validatePhone(phoneNumber);
  const isFormValid =
    isPhoneValid && (username.trim().length > 0 || phoneNumber.trim().length > 0);

  const initialUsername = (user?.username || "").trim();
  const initialPhone = (user?.phone_number || user?.phoneNumber || "").trim();
  const hasChanges =
    username.trim() !== initialUsername ||
    phoneNumber.trim() !== initialPhone;

  const canSubmit = isFormValid && hasChanges;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

    const err = validatePhone(phoneNumber);
    if (err) {
      setPhoneError(err);
      return;
    }

    const cleanPhone = phoneNumber.trim();
    setPhoneError("");
    setRejectionAlert(null);

    updateMutation.mutate(
      {
        username: username.trim() || undefined,
        phone_number: cleanPhone || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error: any) => {
          if (Array.isArray(error?.details)) {
            const reasons = error.details.map((d: any) => d.message).join(" • ");
            setRejectionAlert({
              message: `Validation Rejected: ${reasons}`,
              resolution: "Please correct the indicated profile details and submit again.",
            });
          } else {
            setRejectionAlert({
              message: error?.message || "Failed to update profile.",
              resolution: "Check your entered name and phone number.",
            });
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#121316] border border-border text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            Edit Profile
          </DialogTitle>
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
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs text-muted-foreground">
              Name
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Your full name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={updateMutation.isPending}
              className="bg-black/40 border-border"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="10-digit mobile number (e.g. 9876543210)"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={(e) => handlePhoneChange(e.target.value)}
              disabled={updateMutation.isPending}
              className={cn(
                "bg-black/40 border-border",
                phoneError && "border-rose-500/80 focus-visible:ring-rose-500"
              )}
            />
            {phoneError && (
              <p className="text-[11px] text-rose-400 font-medium">
                {phoneError}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="border-border"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
