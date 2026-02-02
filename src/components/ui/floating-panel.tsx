"use client";

import { cn } from "@/lib/utils";

interface FloatingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export const FloatingPanel = ({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: FloatingPanelProps) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[420px] max-w-[calc(100vw-2rem)]",
        "rounded-xl border border-border/60 bg-background shadow-2xl",
        "flex flex-col overflow-hidden"
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close panel"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div
        className={cn(
          "max-h-[80vh] overflow-y-auto px-4 py-4",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
