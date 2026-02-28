"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface NotesPageShellProps {
  children: ReactNode;
  className?: string;
}

export const NotesPageShell = ({ children, className }: NotesPageShellProps) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1460px] space-y-5 px-1 pb-4 sm:space-y-6 lg:space-y-7 lg:px-2",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface NotesCommandBarProps {
  children: ReactNode;
  className?: string;
}

export const NotesCommandBar = ({ children, className }: NotesCommandBarProps) => {
  return (
    <div
      className={cn(
        "sticky top-2 z-30 rounded-2xl border border-border/70 bg-background/92 px-4 py-3 shadow-sm backdrop-blur-lg",
        "sm:px-5 sm:py-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface NotesContentSurfaceProps {
  children: ReactNode;
  className?: string;
}

export const NotesContentSurface = ({ children, className }: NotesContentSurfaceProps) => {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/65 bg-card/80 p-4 shadow-sm sm:p-6 lg:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
};

interface NotesSplitLayoutProps {
  children: ReactNode;
  className?: string;
}

export const NotesSplitLayout = ({ children, className }: NotesSplitLayoutProps) => {
  return (
    <div className={cn("grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:gap-8", className)}>
      {children}
    </div>
  );
};

interface NotesToolsTriggerProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const NotesToolsTrigger = ({
  onClick,
  label = "Tools",
  className,
}: NotesToolsTriggerProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("2xl:hidden", className)}
    >
      <svg
        className="mr-1.5 h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h18M3 12h18M3 19h18"
        />
      </svg>
      {label}
    </Button>
  );
};

interface NotesToolsPanelProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export const NotesToolsPanel = ({
  title,
  description,
  open,
  onOpenChange,
  children,
  className,
}: NotesToolsPanelProps) => {
  return (
    <>
      <aside className={cn("hidden 2xl:block", className)}>
        <div className="sticky top-24 rounded-2xl border border-border/65 bg-card/75 p-5 shadow-sm">
          <div className="space-y-1.5 border-b border-border/60 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/90">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      </aside>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "left-auto right-0 top-0 h-dvh w-full max-w-sm translate-x-0 translate-y-0 rounded-none border-l border-border/60 p-0 sm:max-w-md 2xl:hidden",
            className,
          )}
        >
          <div className="flex h-full flex-col">
            <DialogHeader className="space-y-1.5 border-b border-border/60 px-5 py-4 text-left">
              <DialogTitle className="text-sm font-semibold uppercase tracking-wide">{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
