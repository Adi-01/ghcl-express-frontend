"use client";

import React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) {
      return <FolderSearch className="w-10 h-10 text-muted-foreground/60" />;
    }
    if (typeof icon === "function" || (typeof icon === "object" && "render" in (icon as any))) {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="w-10 h-10 text-muted-foreground/60" />;
    }
    return icon as React.ReactNode;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed rounded-xl bg-card/40 my-4",
        className
      )}
    >
      <div className="mb-3">{renderIcon()}</div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

