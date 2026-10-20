"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { BulkerInfo } from "@/lib/types/bulker";
import {
  useCreateBulkerInfoMutation,
  useUpdateBulkerInfoMutation,
} from "@/lib/hooks/mutations/useBulkerMutations";

interface BulkerInfoModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  bulkerInfo?: BulkerInfo | null;
}

export function BulkerInfoModal({
  isOpen,
  onClose,
  bulkerInfo,
}: BulkerInfoModalProps) {
  const isEdit = !!bulkerInfo;

  const [bulkerNumber, setBulkerNumber] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [permit, setPermit] = useState("");
  const [isAllowed, setIsAllowed] = useState(true);

  const createMutate = useCreateBulkerInfoMutation();
  const updateMutate = useUpdateBulkerInfoMutation();
  const isBusy = createMutate.isPending || updateMutate.isPending;

  useEffect(() => {
    if (isOpen) {
      if (bulkerInfo) {
        setBulkerNumber(bulkerInfo.bulkerNumber);
        setTransporterName(bulkerInfo.transporterName);
        setPermit(bulkerInfo.permit || "");
        setIsAllowed(bulkerInfo.isAllowed);
      } else {
        setBulkerNumber("");
        setTransporterName("");
        setPermit("");
        setIsAllowed(true);
      }
    }
  }, [isOpen, bulkerInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkerNumber || !transporterName || !permit) return;

    if (isEdit && bulkerInfo) {
      await updateMutate.mutateAsync({
        id: bulkerInfo.id,
        payload: {
          bulkerNumber: bulkerNumber.toUpperCase().trim(),
          transporterName: transporterName.trim(),
          permit: permit.trim(),
          isAllowed,
        },
      });
    } else {
      await createMutate.mutateAsync({
        bulkerNumber: bulkerNumber.toUpperCase().trim(),
        transporterName: transporterName.trim(),
        permit: permit.trim(),
        isAllowed,
      });
    }

    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-[#ffffff]">
            {isEdit ? "Edit Bulker Master" : "Add Bulker Master"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Bulker Number *
            </label>
            <Input
              placeholder="e.g. GJ12AB1234"
              value={bulkerNumber}
              onChange={(e) =>
                setBulkerNumber(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                )
              }
              className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Transporter Name *
            </label>
            <Input
              placeholder="Transporter Name"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
              className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Permit *
            </label>
            <Input
              placeholder="Permit number or string"
              value={permit}
              onChange={(e) => setPermit(e.target.value)}
              className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#22242a] p-3 bg-[#090a0c]">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-[#ffffff]">Allowed Entry</span>
              <p className="text-xs text-[#8a8f98]">
                Disabling blacklists the bulker across all dispatch operations.
              </p>
            </div>
            <Switch
              checked={isAllowed}
              onCheckedChange={setIsAllowed}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
              disabled={isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Bulker"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

