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
import type { CustomerInfo } from "@/lib/types/bulker";
import {
  useCreateCustomerInfoMutation,
  useUpdateCustomerInfoMutation,
} from "@/lib/hooks/mutations/useBulkerMutations";

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  customerInfo?: CustomerInfo | null;
}

export function CustomerInfoModal({
  isOpen,
  onClose,
  customerInfo,
}: CustomerInfoModalProps) {
  const isEdit = !!customerInfo;

  const [customerName, setCustomerName] = useState("");
  const [destination, setDestination] = useState("");

  const createMutate = useCreateCustomerInfoMutation();
  const updateMutate = useUpdateCustomerInfoMutation();
  const isBusy = createMutate.isPending || updateMutate.isPending;

  useEffect(() => {
    if (isOpen) {
      if (customerInfo) {
        setCustomerName(customerInfo.customerName);
        setDestination(customerInfo.destination);
      } else {
        setCustomerName("");
        setDestination("");
      }
    }
  }, [isOpen, customerInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !destination) return;

    if (isEdit && customerInfo) {
      await updateMutate.mutateAsync({
        id: customerInfo.id,
        payload: {
          customerName: customerName.trim(),
          destination: destination.trim(),
        },
      });
    } else {
      await createMutate.mutateAsync({
        customerName: customerName.trim(),
        destination: destination.trim(),
      });
    }

    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-[#ffffff]">
            {isEdit ? "Edit Customer Destination" : "Add Customer Destination"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Customer Name *
            </label>
            <Input
              placeholder="e.g. UltraTech Cement"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Destination *
            </label>
            <Input
              placeholder="e.g. Kotputli, Rajasthan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
              disabled={isBusy || !customerName || !destination}
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Destination"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

