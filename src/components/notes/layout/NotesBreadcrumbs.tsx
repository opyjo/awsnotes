"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NotesBreadcrumbItem {
  label: string;
  href?: string;
  color?: string;
  current?: boolean;
}

interface NotesBreadcrumbsProps {
  items: NotesBreadcrumbItem[];
  className?: string;
}

export const NotesBreadcrumbs = ({ items, className }: NotesBreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
        {items.map((item, index) => {
          const content = (
            <span
              className={cn(
                "inline-flex max-w-[min(18rem,calc(100vw-5rem))] items-center gap-2 rounded-full px-2.5 py-1 transition-colors sm:max-w-[22rem]",
                item.href
                  ? "border border-border/55 bg-background/65 hover:border-border hover:bg-accent/50 hover:text-foreground"
                  : "border border-transparent bg-muted/45 text-foreground",
              )}
              aria-current={item.current ? "page" : undefined}
              title={item.label}
            >
              {item.color && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{item.label}</span>
            </span>
          );

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.href ? (
                <Link href={item.href} className="min-w-0">
                  {content}
                </Link>
              ) : (
                content
              )}
              {index < items.length - 1 && (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
