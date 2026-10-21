"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { BulkerEntry, BulkerStatus } from "@/lib/types/bulker";
import {
  useBulkerInfoQuery,
  useCustomerInfoQuery,
} from "@/lib/hooks/queries/useBulkerQuery";
import { useUpdateBulkerEntryMutation } from "@/lib/hooks/mutations/useBulkerMutations";

interface EditBulkerEntryModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedEntry: BulkerEntry | null;
  isAdmin?: boolean;
}

const STATUS_TIER: Record<BulkerStatus, number> = {
  VRA: 1,
  ALLOCATED: 2,
  SEND: 3,
  OUT: 4,
  HOLD: 0,
  CANCEL: -1,
};

const ALL_STATUSES: BulkerStatus[] = [
  "VRA",
  "ALLOCATED",
  "SEND",
  "OUT",
  "HOLD",
  "CANCEL",
];

const formatToInputDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  } catch {
    return "";
  }
};

const getISTDate = (dateVal?: string | null): string => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
};

export function EditBulkerEntryModal({
  isOpen,
  onClose,
  selectedEntry,
  isAdmin = false,
}: EditBulkerEntryModalProps) {
  const [formData, setFormData] = useState({
    status: "VRA" as BulkerStatus,
    orderDate: "",
    bulkerNumber: "",
    transporterName: "",
    permit: "",
    salesOrderNumber: "",
    customerName: "",
    destination: "",
    remarks: "",
    vraInAt: "",
    allocatedAt: "",
    plantInAt: "",
    plantOutAt: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isManualBulker, setIsManualBulker] = useState(false);

  const { data: bulkerInfoList } = useBulkerInfoQuery();
  const { data: customerInfoList } = useCustomerInfoQuery();
  const updateMutation = useUpdateBulkerEntryMutation();

  useEffect(() => {
    if (selectedEntry && isOpen) {
      setFormData({
        status: selectedEntry.status,
        orderDate: selectedEntry.orderDate
          ? selectedEntry.orderDate.split("T")[0]
          : "",
        bulkerNumber: selectedEntry.bulkerNumber || "",
        transporterName: selectedEntry.transporterName || "",
        permit: selectedEntry.permit || "",
        salesOrderNumber: selectedEntry.salesOrderNumber || "",
        customerName: selectedEntry.customerName || "",
        destination: selectedEntry.destination || "",
        remarks: selectedEntry.remarks || "",
        vraInAt: formatToInputDateTime(selectedEntry.vraInAt),
        allocatedAt: formatToInputDateTime(selectedEntry.allocatedAt),
        plantInAt: formatToInputDateTime(selectedEntry.plantInAt),
        plantOutAt: formatToInputDateTime(selectedEntry.plantOutAt),
      });
      setValidationError(null);

      if (bulkerInfoList && selectedEntry.bulkerNumber) {
        const match = bulkerInfoList.find(
          (b) =>
            b.bulkerNumber.toUpperCase() ===
            selectedEntry.bulkerNumber.toUpperCase()
        );
        setIsManualBulker(!match);
      }
    }
  }, [selectedEntry, isOpen, bulkerInfoList]);

  const isCancelled = selectedEntry?.status === "CANCEL";

  // Rollback detection
  const rollbackWarning = useMemo(() => {
    if (!selectedEntry || !isAdmin) return null;
    const oldTier = STATUS_TIER[selectedEntry.status] ?? 0;
    const newTier = STATUS_TIER[formData.status] ?? 0;

    if (oldTier > 0 && newTier > 0 && newTier < oldTier) {
      if (newTier === 1) {
        return "Rolling back to VRA will automatically reset Customer Allocation, Plant In, and Plant Out timestamps to null upon saving.";
      }
      if (newTier === 2) {
        return "Rolling back to ALLOCATED will automatically reset Plant In and Plant Out timestamps to null upon saving.";
      }
      if (newTier === 3) {
        return "Rolling back to SEND will automatically reset Plant Out timestamp to null upon saving.";
      }
    }
    return null;
  }, [selectedEntry, formData.status, isAdmin]);

  const matchingCustomer = useMemo(() => {
    if (!customerInfoList || !formData.customerName) return null;
    return customerInfoList.find(
      (c) =>
        c.customerName.toLowerCase() === formData.customerName.toLowerCase()
    );
  }, [customerInfoList, formData.customerName]);

  const currentCustomerValue = useMemo(() => {
    if (!formData.customerName) return "__NONE__";
    if (matchingCustomer) return matchingCustomer.id;
    return "__CUSTOM__";
  }, [formData.customerName, matchingCustomer]);

  const handleBulkerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setFormData((prev) => ({ ...prev, bulkerNumber: val }));

    if (!val) {
      setIsManualBulker(false);
      setFormData((prev) => ({ ...prev, transporterName: "", permit: "" }));
      return;
    }

    if (bulkerInfoList) {
      const match = bulkerInfoList.find(
        (b) => b.bulkerNumber.toUpperCase() === val
      );
      if (match) {
        setFormData((prev) => ({
          ...prev,
          transporterName: !match.isAllowed
            ? "NOT ALLOWED"
            : match.transporterName,
          permit: match.permit || "",
        }));
        setIsManualBulker(false);
      } else {
        setIsManualBulker(true);
      }
    }
  };

  const handleCustomerSelect = async (val: string) => {
    if (val === "__NONE__") {
      setFormData((prev) => ({
        ...prev,
        customerName: "",
        destination: "",
        ...(prev.status === "ALLOCATED"
          ? {
              status: "VRA",
              salesOrderNumber: "",
              allocatedAt: "",
            }
          : {}),
      }));
      return;
    }

    const match = customerInfoList?.find((c) => c.id === val);
    if (!match) return;

    setFormData((prev) => ({
      ...prev,
      customerName: match.customerName,
      destination: match.destination,
      ...(prev.status === "VRA" ? { status: "ALLOCATED" } : {}),
    }));

    // Auto-fetch latest SO for this customer if SO field is currently empty
    if (!formData.salesOrderNumber) {
      try {
        const res = await fetch(
          `/api/bulkerdispatch/customer-latest-so?customerName=${encodeURIComponent(
            match.customerName
          )}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.salesOrderNumber) {
            setFormData((prev) => ({
              ...prev,
              salesOrderNumber: String(json.data.salesOrderNumber),
            }));
          }
        }
      } catch {
        // Ignore SO fetch failure
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    // Instant Tier 1 Chronological Sanity Validation
    if (isAdmin) {
      const vTime = formData.vraInAt ? new Date(formData.vraInAt).getTime() : null;
      const aTime = formData.allocatedAt ? new Date(formData.allocatedAt).getTime() : null;
      const piTime = formData.plantInAt ? new Date(formData.plantInAt).getTime() : null;
      const poTime = formData.plantOutAt ? new Date(formData.plantOutAt).getTime() : null;

      if (vTime && aTime && aTime < vTime) {
        setValidationError("Customer Allocation time cannot precede VRA Entry time.");
        return;
      }
      if (aTime && piTime && piTime < aTime) {
        setValidationError("Plant In (SEND) time cannot precede Customer Allocation time.");
        return;
      }
      if (piTime && poTime && poTime < piTime) {
        setValidationError("Plant Out time cannot precede Plant In time.");
        return;
      }
      if (vTime && poTime && poTime < vTime) {
        setValidationError("Plant Out time cannot precede VRA Entry time.");
        return;
      }
    }

    if (isAdmin && formData.status !== selectedEntry.status) {
      if (selectedEntry.status === "VRA") {
        if (formData.status === "SEND") {
          setValidationError("Truck must be ALLOCATED to a customer before entering plant (SEND).");
          return;
        }
        if (formData.status === "OUT") {
          setValidationError("Cannot mark OUT: Truck in VRA must be Allocated and Sent to plant before departure.");
          return;
        }
      }

      if (selectedEntry.status === "ALLOCATED" && formData.status === "OUT") {
        setValidationError("Cannot mark OUT directly from ALLOCATED. Truck must first enter the plant (SEND).");
        return;
      }

      if (formData.status === "ALLOCATED" && (!formData.customerName?.trim() || !formData.destination?.trim())) {
        setValidationError("Customer Name and Destination must be set before status can be ALLOCATED.");
        return;
      }

      if (formData.status === "SEND") {
        const missing: string[] = [];
        if (!formData.customerName?.trim()) missing.push("Customer Name");
        if (!formData.destination?.trim()) missing.push("Destination");
        if (!formData.salesOrderNumber?.trim()) missing.push("SO Number");
        if (missing.length > 0) {
          setValidationError(`Cannot mark SEND: ${missing.join(", ")} must be filled before plant entry.`);
          return;
        }
      }

      if (formData.status === "OUT") {
        if (selectedEntry.status !== "SEND" && !(selectedEntry.status === "HOLD" && selectedEntry.plantInAt)) {
          setValidationError("Cannot mark OUT: Truck must be in SEND status (inside the plant) before departure.");
          return;
        }
      }
    }

    if (formData.status === "OUT") {
      const missing: string[] = [];
      if (!formData.bulkerNumber?.trim()) missing.push("Bulker Number");
      if (!formData.transporterName?.trim()) missing.push("Transporter");
      if (!formData.permit?.trim()) missing.push("Permit");
      if (!formData.customerName?.trim()) missing.push("Customer Name");
      if (!formData.destination?.trim()) missing.push("Destination");
      if (!formData.salesOrderNumber?.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        setValidationError(
          `Cannot mark OUT: ${missing.join(", ")} must be filled before departure.`
        );
        return;
      }
    }

    const targetStatus = isAdmin && !isCancelled ? formData.status : selectedEntry.status;

    if (
      (targetStatus === "ALLOCATED" || targetStatus === "SEND" || targetStatus === "HOLD") &&
      !formData.customerName?.trim()
    ) {
      setValidationError(
        "Customer name cannot be empty when dispatch is Allocated, Send, or Hold."
      );
      return;
    }

    setValidationError(null);

    try {
      await updateMutation.mutateAsync({
        id: selectedEntry.id,
        payload: {
          bulkerNumber: formData.bulkerNumber,
          transporterName: formData.transporterName,
          permit: formData.permit,
          salesOrderNumber: formData.salesOrderNumber || null,
          customerName: formData.customerName,
          destination: formData.destination,
          remarks: formData.remarks,
          orderDate: formData.orderDate || null,
          status: isAdmin && !isCancelled ? formData.status : undefined,
          vraInAt:
            isAdmin && formData.vraInAt
              ? new Date(formData.vraInAt).toISOString()
              : undefined,
          allocatedAt:
            isAdmin && formData.allocatedAt
              ? new Date(formData.allocatedAt).toISOString()
              : undefined,
          plantInAt:
            isAdmin && formData.plantInAt
              ? new Date(formData.plantInAt).toISOString()
              : undefined,
          plantOutAt:
            isAdmin && formData.plantOutAt
              ? new Date(formData.plantOutAt).toISOString()
              : undefined,
          is_new_bulker: isManualBulker,
          is_new_customer: false,
        },
      });

      onClose(false);
    } catch (err: any) {
      setValidationError(err?.message || "Failed to update entry.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-6 sm:p-8 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-[#ffffff] flex items-center justify-between">
            <span>{isAdmin ? "Full Dispatch Edit (Admin)" : "Edit Bulker Entry"}</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-normal uppercase bg-zinc-800 text-zinc-300 border border-border">
              Status: {selectedEntry?.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isCancelled && (
          <div className="p-3 mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Cancelled Dispatch:</strong> This entry is permanently voided and cannot be reactivated. A new entry must be created if the bulker returns.
            </span>
          </div>
        )}

        {rollbackWarning && (
          <div className="p-3 mb-4 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <div>
              <span className="font-semibold">Automatic Timestamp Rollback:</span> {rollbackWarning}
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-3 mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admin Status Selector */}
            {isAdmin && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                  Lifecycle Status (Admin Override)
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => {
                    const nextStatus = val as BulkerStatus;
                    setFormData((prev) => ({
                      ...prev,
                      status: nextStatus,
                      ...(nextStatus === "VRA"
                        ? {
                            customerName: "",
                            destination: "",
                            salesOrderNumber: "",
                            allocatedAt: "",
                            plantInAt: "",
                            plantOutAt: "",
                          }
                        : {}),
                    }));
                  }}
                  disabled={isCancelled}
                >
                  <SelectTrigger className="bg-[#090a0c] border-[#22242a] text-[#ffffff] h-9">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121316] border-[#22242a] text-[#ffffff]">
                    {ALL_STATUSES.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        disabled={isCancelled && s !== "CANCEL"}
                        className="hover:bg-[#1c1d22]"
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Bulker Number
              </label>
              <Input
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
                value={formData.bulkerNumber}
                onChange={handleBulkerChange}
                disabled={isCancelled}
                required
              />
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Order Date
              </label>
              <DatePicker
                value={formData.orderDate}
                onChange={(dateStr) =>
                  setFormData((prev) => ({ ...prev, orderDate: dateStr }))
                }
                placeholder="Pick order date"
                className="w-full bg-[#090a0c] border-[#22242a] text-[#ffffff]"
                disabled={isCancelled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Transporter Name
              </label>
              <Input
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff] disabled:opacity-60"
                value={formData.transporterName}
                onChange={(e) =>
                  setFormData({ ...formData, transporterName: e.target.value })
                }
                disabled={!isManualBulker || isCancelled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Permit
              </label>
              <Input
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff] disabled:opacity-60"
                value={formData.permit}
                onChange={(e) =>
                  setFormData({ ...formData, permit: e.target.value })
                }
                disabled={!isManualBulker || isCancelled}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Customer Name
              </label>
              <Select
                value={currentCustomerValue}
                onValueChange={handleCustomerSelect}
                disabled={isCancelled}
              >
                <SelectTrigger className="w-full bg-[#090a0c] border-[#22242a] text-[#ffffff] h-9">
                  <SelectValue placeholder="Select Customer..." />
                </SelectTrigger>
                <SelectContent className="bg-[#121316] border-[#22242a] text-[#ffffff] max-h-72">
                  <SelectItem
                    value="__NONE__"
                    className="hover:bg-[#1c1d22] text-zinc-400"
                  >
                    -- Not Allocated (Clear Customer) --
                  </SelectItem>
                  {customerInfoList?.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="hover:bg-[#1c1d22]"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium text-white">
                          {c.customerName}
                        </span>
                        {c.destination && (
                          <span className="text-[11px] text-sky-400 font-mono shrink-0">
                            {c.destination}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {currentCustomerValue === "__CUSTOM__" &&
                    formData.customerName && (
                      <SelectItem
                        value="__CUSTOM__"
                        className="hover:bg-[#1c1d22] text-amber-300"
                      >
                        {formData.customerName} (Legacy Entry)
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider flex items-center justify-between">
                <span>Destination</span>
                <span className="text-[10px] text-zinc-500 lowercase">
                  (auto-populated)
                </span>
              </label>
              <Input
                className="bg-[#090a0c] border-[#22242a] text-zinc-300 disabled:opacity-70 cursor-not-allowed font-mono text-xs"
                value={formData.destination || ""}
                readOnly
                disabled
                placeholder="Auto-populated from customer"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Sales Order Number
              </label>
              <Input
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
                value={formData.salesOrderNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salesOrderNumber: e.target.value.replace(/[^0-9]/g, ""),
                  })
                }
                placeholder="SO Number"
                disabled={isCancelled}
              />
            </div>

            {/* Admin Milestone Timestamps Section */}
            {isAdmin && (
              <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
                  Lifecycle Timestamps (Admin Full Edit)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                      VRA In Time
                    </label>
                    <Input
                      type="datetime-local"
                      className="bg-[#090a0c] border-[#22242a] text-[#ffffff] text-xs h-9 [color-scheme:dark]"
                      value={formData.vraInAt}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vraInAt: e.target.value,
                        }))
                      }
                      disabled={isCancelled}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                      Customer Allocation Time
                    </label>
                    <Input
                      type="datetime-local"
                      className="bg-[#090a0c] border-[#22242a] text-[#ffffff] text-xs h-9 [color-scheme:dark]"
                      value={formData.allocatedAt}
                      onChange={(e) => {
                        const newAlloc = e.target.value;
                        setFormData((prev) => {
                          let nextOrderDate = prev.orderDate;
                          if (newAlloc) {
                            const allocIST = getISTDate(newAlloc);
                            if (prev.plantOutAt) {
                              const outIST = getISTDate(prev.plantOutAt);
                              if (outIST && allocIST && outIST !== allocIST) {
                                nextOrderDate = outIST;
                              } else {
                                nextOrderDate = allocIST;
                              }
                            } else {
                              nextOrderDate = allocIST;
                            }
                          }
                          return {
                            ...prev,
                            allocatedAt: newAlloc,
                            orderDate: nextOrderDate,
                          };
                        });
                      }}
                      disabled={isCancelled}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                      Plant In Time (SEND)
                    </label>
                    <Input
                      type="datetime-local"
                      className="bg-[#090a0c] border-[#22242a] text-[#ffffff] text-xs h-9 [color-scheme:dark]"
                      value={formData.plantInAt}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          plantInAt: e.target.value,
                        }))
                      }
                      disabled={isCancelled}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                      Plant Out Time (OUT)
                    </label>
                    <Input
                      type="datetime-local"
                      className="bg-[#090a0c] border-[#22242a] text-[#ffffff] text-xs h-9 [color-scheme:dark]"
                      value={formData.plantOutAt}
                      onChange={(e) => {
                        const newOut = e.target.value;
                        setFormData((prev) => {
                          let nextOrderDate = prev.orderDate;
                          if (newOut && prev.allocatedAt) {
                            const outIST = getISTDate(newOut);
                            const allocIST = getISTDate(prev.allocatedAt);
                            if (outIST && allocIST && outIST !== allocIST) {
                              nextOrderDate = outIST;
                            } else if (outIST && allocIST && outIST === allocIST) {
                              nextOrderDate = allocIST;
                            }
                          } else if (newOut && !prev.allocatedAt) {
                            nextOrderDate = getISTDate(newOut);
                          }
                          return {
                            ...prev,
                            plantOutAt: newOut,
                            orderDate: nextOrderDate,
                          };
                        });
                      }}
                      disabled={isCancelled}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Remarks
              </label>
              <Textarea
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff] min-h-[70px]"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
              disabled={updateMutation.isPending}
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
      </DialogContent>
    </Dialog>
  );
}
