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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, User, Package, Loader2 } from "lucide-react";
import { useNightCheckingTransportersQuery } from "@/lib/hooks/queries/useNightCheckingQuery";
import type {
  TruckEntry,
  CreateTruckEntryPayload,
  UpdateTruckEntryPayload,
} from "@/lib/types/nightchecking";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TruckEntryModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedEntry: TruckEntry | null;
  onSubmit: (payload: CreateTruckEntryPayload | UpdateTruckEntryPayload) => void;
  isBusy: boolean;
  isAdmin?: boolean;
  editMode?: "full" | "exit_only";
}

interface YesNoToggleProps {
  label: string;
  icon: React.ElementType;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const YesNoToggle = ({
  label,
  icon: Icon,
  value,
  onChange,
  disabled,
}: YesNoToggleProps) => (
  <div className="flex items-center justify-between py-2 border-b border-border/40">
    <label className="text-xs font-medium flex items-center gap-2 text-zinc-300">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" /> {label}
    </label>
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        variant={value ? "default" : "outline"}
        className={cn(
          "h-7 px-3 text-xs transition-colors",
          value && !disabled
            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            : "bg-black/40 border-border text-muted-foreground hover:text-white"
        )}
        onClick={() => onChange(true)}
      >
        YES
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        variant={!value ? "destructive" : "outline"}
        className={cn(
          "h-7 px-3 text-xs transition-colors",
          !value && !disabled
            ? "bg-rose-600 hover:bg-rose-700 text-white font-medium"
            : "bg-black/40 border-border text-muted-foreground hover:text-white",
          disabled ? "opacity-50" : ""
        )}
        onClick={() => onChange(false)}
      >
        NO
      </Button>
    </div>
  </div>
);

const getLocalDatetimeString = (dateObj: Date = new Date()) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function TruckEntryModal({
  isOpen,
  onClose,
  selectedEntry,
  onSubmit,
  isBusy,
  isAdmin = false,
  editMode = "full",
}: TruckEntryModalProps) {
  const { data: transporters = [] } = useNightCheckingTransportersQuery();
  const [isAddingNewTransporter, setIsAddingNewTransporter] = useState(false);

  const isExitOnly = editMode === "exit_only";

  const [formData, setFormData] = useState({
    truck_number: "",
    transporter_name: "",
    entry_date: "",
    exit_date: "",
    paper_status: false,
    driver_status: false,
    tarpulin_status: false,
    remarks: "",
  });

  useEffect(() => {
    if (selectedEntry && isOpen) {
      setIsAddingNewTransporter(false);
      const entryDateVal = selectedEntry.entryDate || selectedEntry.entry_date;
      const exitDateVal = selectedEntry.exitDate || selectedEntry.exit_date;

      setFormData({
        truck_number: selectedEntry.truckNumber || selectedEntry.truck_number || "",
        transporter_name: selectedEntry.transporterName || selectedEntry.transporter_name || "",
        entry_date: entryDateVal ? getLocalDatetimeString(new Date(entryDateVal)) : getLocalDatetimeString(),
        exit_date: exitDateVal ? getLocalDatetimeString(new Date(exitDateVal)) : "",
        paper_status: Boolean(selectedEntry.paperStatus ?? selectedEntry.paper_status),
        driver_status: Boolean(selectedEntry.driverStatus ?? selectedEntry.driver_status),
        tarpulin_status: Boolean(selectedEntry.tarpulinStatus ?? selectedEntry.tarpulin_status),
        remarks: selectedEntry.remarks || "",
      });
    } else if (isOpen) {
      setIsAddingNewTransporter(false);
      setFormData({
        truck_number: "",
        transporter_name: "",
        entry_date: getLocalDatetimeString(),
        exit_date: "",
        paper_status: false,
        driver_status: false,
        tarpulin_status: false,
        remarks: "",
      });
    }
  }, [selectedEntry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedTruck = formData.truck_number.toUpperCase().replace(/[^A-Za-z0-9]/g, "");
    const sanitizedTransporter = formData.transporter_name.trim().toUpperCase();

    if (!sanitizedTruck) {
      toast.error("Please enter a valid alphanumeric truck number.");
      return;
    }
    if (!sanitizedTransporter) {
      toast.error("Please select or enter a transporter name.");
      return;
    }

    if (isExitOnly && !formData.exit_date) {
      toast.error("Please provide an exit date and time.");
      return;
    }

    if (formData.exit_date && formData.entry_date) {
      const entryTime = new Date(formData.entry_date).getTime();
      const exitTime = new Date(formData.exit_date).getTime();
      if (exitTime < entryTime) {
        toast.error("Exit date and time cannot be earlier than entry date.");
        return;
      }
    }

    onSubmit({
      truck_number: sanitizedTruck,
      truckNumber: sanitizedTruck,
      transporter_name: sanitizedTransporter,
      transporterName: sanitizedTransporter,
      entry_date: new Date(formData.entry_date).toISOString(),
      entryDate: new Date(formData.entry_date).toISOString(),
      exit_date: formData.exit_date
        ? new Date(formData.exit_date).toISOString()
        : null,
      exitDate: formData.exit_date
        ? new Date(formData.exit_date).toISOString()
        : null,
      paper_status: formData.paper_status,
      paperStatus: formData.paper_status,
      driver_status: formData.driver_status,
      driverStatus: formData.driver_status,
      tarpulin_status: formData.tarpulin_status,
      tarpulinStatus: formData.tarpulin_status,
      remarks: formData.remarks.trim() || null,
      status: formData.exit_date ? "OUT" : "IN",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 bg-[#121316] border border-border text-white shadow-2xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white">
            {isExitOnly
              ? "Update Exit Time"
              : selectedEntry
              ? "Edit Truck Entry"
              : "New Truck Check-In"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Truck Number
              </label>
              <Input
                className="bg-black/40 border-border text-white text-xs h-9 uppercase"
                placeholder="e.g. GJ10TX1234"
                value={formData.truck_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    truck_number: e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, ""),
                  })
                }
                disabled={isExitOnly}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transporter Name
              </label>
              {!isAddingNewTransporter ? (
                <Select
                  value={formData.transporter_name}
                  disabled={isExitOnly}
                  onValueChange={(val) => {
                    if (val === "NEW_TRANSPORTER") {
                      setIsAddingNewTransporter(true);
                      setFormData({ ...formData, transporter_name: "" });
                    } else {
                      setFormData({ ...formData, transporter_name: val || "" });
                    }
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-border text-white text-xs h-9">
                    <SelectValue placeholder="Select transporter..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121316] border border-border text-white text-xs max-h-60">
                    {transporters.map((t: string) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="NEW_TRANSPORTER"
                      className="font-semibold text-white border-t border-border/40 mt-1"
                    >
                      + Add New Transporter
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    className="bg-black/40 border-border text-white text-xs h-9 uppercase"
                    placeholder="Type new transporter..."
                    value={formData.transporter_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transporter_name: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={isExitOnly}
                    autoFocus
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isExitOnly}
                    onClick={() => {
                      setIsAddingNewTransporter(false);
                      setFormData({ ...formData, transporter_name: "" });
                    }}
                    className="h-9 px-3 text-xs border-border text-muted-foreground hover:text-white bg-black/40"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "grid gap-4 pt-1",
              isAdmin || isExitOnly ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            )}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Entry Date & Time
              </label>
              <Input
                className="bg-black/40 border-border text-white text-xs h-9"
                type="datetime-local"
                value={formData.entry_date}
                disabled={isExitOnly}
                onChange={(e) =>
                  setFormData({ ...formData, entry_date: e.target.value })
                }
                required
              />
            </div>

            {(isAdmin || isExitOnly) && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isExitOnly ? "Exit Date & Time" : "Exit Date & Time (Optional)"}
                </label>
                <Input
                  className="bg-black/40 border-border text-white text-xs h-9"
                  type="datetime-local"
                  value={formData.exit_date}
                  onChange={(e) =>
                    setFormData({ ...formData, exit_date: e.target.value })
                  }
                  required={isExitOnly}
                />
              </div>
            )}
          </div>

          <div
            className={cn(
              "pt-3 space-y-1 border-t border-border/40",
              isExitOnly && "opacity-50 pointer-events-none"
            )}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Security Gate Checklist
            </p>
            <YesNoToggle
              label="Paper Status OK?"
              icon={FileText}
              value={formData.paper_status}
              disabled={isExitOnly}
              onChange={(v: boolean) =>
                setFormData({ ...formData, paper_status: v })
              }
            />
            <YesNoToggle
              label="Driver Status OK?"
              icon={User}
              value={formData.driver_status}
              disabled={isExitOnly}
              onChange={(v: boolean) =>
                setFormData({ ...formData, driver_status: v })
              }
            />
            <YesNoToggle
              label="Tarpaulin Status OK?"
              icon={Package}
              value={formData.tarpulin_status}
              disabled={isExitOnly}
              onChange={(v: boolean) =>
                setFormData({ ...formData, tarpulin_status: v })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Remarks
            </label>
            <Textarea
              className="bg-black/40 border-border text-white text-xs"
              placeholder="Any visible damage, missing items, safety observations..."
              value={formData.remarks}
              disabled={isExitOnly}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onClose(false)}
              disabled={isBusy}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="bg-white text-black hover:bg-zinc-200 text-xs font-medium h-9 px-4"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : selectedEntry ? (
                "Save Changes"
              ) : (
                "Check In Truck"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
