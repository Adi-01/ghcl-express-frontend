"use client";

import * as React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TableFilterPopoverProps {
  title?: string;
  activeCount?: number;
  onReset?: () => void;
  onApply?: () => void;
  children: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
}

export function TableFilterPopover({
  title = "Filters",
  activeCount = 0,
  onReset,
  onApply,
  children,
  triggerClassName,
  contentClassName,
}: TableFilterPopoverProps) {
  const [open, setOpen] = React.useState(false);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={title || "Filters"}
          className={cn(
            "w-9 h-9 p-0 border-border bg-black/40 text-muted-foreground hover:text-white shrink-0 relative transition-colors",
            activeCount > 0 && "border-white/60 text-white bg-zinc-800/60",
            triggerClassName
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="sr-only">{title || "Filters"}</span>
          {activeCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black shadow-sm ring-2 ring-[#090a0c]"
            >
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-80 sm:w-96 p-4 bg-[#121316] border border-border text-white shadow-2xl rounded-xl space-y-4 z-50",
          contentClassName
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-sm text-white">{title}</span>
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-white text-black font-semibold px-1.5 py-0"
              >
                {activeCount} Active
              </Badge>
            )}
          </div>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-white gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-3.5 text-xs">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="h-8 text-xs bg-transparent border-border text-muted-foreground hover:text-white"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="h-8 text-xs bg-white text-black hover:bg-zinc-200 font-medium px-4"
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

