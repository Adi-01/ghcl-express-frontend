"use client";

import * as React from "react";
import { AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isPending = false,
  isDestructive = false,
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border border-border text-white shadow-xl rounded-xl">
        <DialogHeader className="text-left gap-1.5">
          <DialogTitle className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            {isDestructive ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pl-7">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto border-border text-white hover:bg-zinc-800"
          >
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
            className={
              isDestructive
                ? "w-full sm:w-auto min-w-[100px]"
                : "w-full sm:w-auto min-w-[100px] bg-white text-black hover:bg-zinc-200"
            }
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

