import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/60",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost:
    "bg-transparent hover:bg-accent hover:text-accent-foreground disabled:hover:bg-transparent",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/60",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 rounded-md px-3 text-xs",
  md: "h-9 px-4 rounded-md text-sm",
  lg: "h-11 rounded-md px-6 text-base",
  icon: "h-9 w-9 rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", asChild = false, children, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed",
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(classes, (children as React.ReactElement<any>).props.className),
        ref,
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
