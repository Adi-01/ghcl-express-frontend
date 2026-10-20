"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Check,
  Search,
  Truck,
  PlusCircle,
} from "lucide-react";
import type { BulkerInfo } from "@/lib/types/bulker";
import { useBulkerInfoQuery } from "@/lib/hooks/queries/useBulkerQuery";
import { useCreateBulkerEntryMutation } from "@/lib/hooks/mutations/useBulkerMutations";
import { cn } from "@/lib/utils";

interface AddBulkerEntryModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
}

export function AddBulkerEntryModal({
  isOpen,
  onClose,
}: AddBulkerEntryModalProps) {
  const [formData, setFormData] = useState({
    bulkerNumber: "",
    transporterName: "",
    permit: "",
    remarks: "",
  });

  const [isManualBulker, setIsManualBulker] = useState(false);
  const [bulkerQuery, setBulkerQuery] = useState("");
  const [isBulkerDropdownOpen, setIsBulkerDropdownOpen] = useState(false);
  const bulkerRef = useRef<HTMLDivElement>(null);

  const { data: bulkerInfoList } = useBulkerInfoQuery();
  const createMutation = useCreateBulkerEntryMutation();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        bulkerNumber: "",
        transporterName: "",
        permit: "",
        remarks: "",
      });
      setBulkerQuery("");
      setIsManualBulker(false);
      setIsBulkerDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bulkerRef.current && !bulkerRef.current.contains(e.target as Node)) {
        setIsBulkerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchedBulkers = (bulkerInfoList || [])
    .filter((b) =>
      b.bulkerNumber
        .toUpperCase()
        .includes(bulkerQuery.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    )
    .slice(0, 6);

  const handleSelectBulker = (bulker: BulkerInfo) => {
    setFormData((prev) => ({
      ...prev,
      bulkerNumber: bulker.bulkerNumber,
      transporterName: !bulker.isAllowed ? "NOT ALLOWED" : bulker.transporterName,
      permit: bulker.permit || "",
    }));
    setBulkerQuery(bulker.bulkerNumber);
    setIsManualBulker(false);
    setIsBulkerDropdownOpen(false);
  };

  const handleRegisterNewBulker = () => {
    const cleanNum = bulkerQuery.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setFormData((prev) => ({
      ...prev,
      bulkerNumber: cleanNum,
      transporterName: "",
      permit: "",
    }));
    setIsManualBulker(true);
    setIsBulkerDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bulkerNumber || !formData.transporterName) return;

    try {
      await createMutation.mutateAsync({
        bulkerNumber: formData.bulkerNumber,
        transporterName: formData.transporterName,
        permit: formData.permit || "",
        remarks: formData.remarks || undefined,
        status: "VRA",
        is_new_bulker: isManualBulker,
      });

      onClose(false);
    } catch {
      // Rejection handled by mutation onError callback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 sm:p-8 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-[#ffffff] flex items-center gap-2">
            <Truck className="w-5 h-5 text-zinc-400" />
            Add Bulker Entry (Gate In)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bulker Number with Autocomplete */}
          <div className="space-y-1.5 relative" ref={bulkerRef}>
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider flex items-center justify-between">
              <span>Bulker Number *</span>
              {formData.bulkerNumber && (
                <span className="font-mono text-xs text-white">
                  {formData.bulkerNumber}
                </span>
              )}
            </label>
            <div className="relative">
              <Input
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff] placeholder:text-[#555a64] pl-9"
                placeholder="Type bulker number (e.g. GJ12...)"
                value={bulkerQuery}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  setBulkerQuery(val);
                  setFormData((prev) => ({ ...prev, bulkerNumber: val }));
                  setIsBulkerDropdownOpen(true);
                }}
                onFocus={() => setIsBulkerDropdownOpen(true)}
                required
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>

            {/* Google-Search-Style Autocomplete Recommendations */}
            {isBulkerDropdownOpen && bulkerQuery.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-[#121316] border border-[#22242a] rounded-lg shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="p-1.5 max-h-56 overflow-y-auto space-y-1 divide-y divide-zinc-800/40">
                  {matchedBulkers.length > 0 ? (
                    matchedBulkers.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBulker(b)}
                        className="w-full text-left p-2 rounded hover:bg-[#1c1d22] flex items-center justify-between transition-colors group"
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-white group-hover:text-sky-400 flex items-center gap-2">
                            {b.bulkerNumber}
                            {!b.isAllowed && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Not Allowed
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {b.transporterName || "Unknown Transporter"} • Permit: {b.permit || "None"}
                          </div>
                        </div>
                        {formData.bulkerNumber === b.bulkerNumber && (
                          <Check className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-zinc-400">
                      No matching registered bulker found.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRegisterNewBulker}
                    className="w-full text-left p-2 rounded hover:bg-zinc-800 text-xs text-sky-400 flex items-center gap-2 font-medium"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Register as new bulker &quot;{bulkerQuery}&quot;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Transporter and Permit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Transporter Name *
              </label>
              <Input
                className={cn(
                  "bg-[#090a0c] border-[#22242a] text-[#ffffff] placeholder:text-[#555a64]",
                  formData.transporterName === "NOT ALLOWED" && "text-rose-400 font-semibold border-rose-500/50"
                )}
                placeholder="Transporter name"
                value={formData.transporterName}
                onChange={(e) =>
                  setFormData({ ...formData, transporterName: e.target.value })
                }
                disabled={!isManualBulker}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Permit
              </label>
              <Input
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff] placeholder:text-[#555a64]"
                placeholder="Permit number"
                value={formData.permit}
                onChange={(e) =>
                  setFormData({ ...formData, permit: e.target.value })
                }
                disabled={!isManualBulker}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Remarks (Optional)
            </label>
            <Textarea
              className="bg-[#090a0c] border-[#22242a] text-[#ffffff] min-h-[60px]"
              placeholder="Additional gate remarks..."
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
              disabled={
                createMutation.isPending ||
                !formData.bulkerNumber ||
                !formData.transporterName ||
                formData.transporterName === "NOT ALLOWED"
              }
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : formData.transporterName === "NOT ALLOWED" ? (
                "Bulker Not Allowed"
              ) : (
                "Add Bulker Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
