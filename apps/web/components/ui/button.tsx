import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Primary — purple filled (design system "Primary" button)
        default: "bg-primary text-white hover:bg-primary-dark shadow-sm",
        // Secondary — white with border (design system "Secondary" button)
        secondary: "bg-white border border-border text-foreground hover:bg-neutral-light shadow-sm",
        // Inverted — dark filled (design system "Inverted" button)
        inverted: "bg-neutral-dark text-white hover:bg-foreground shadow-sm",
        // Outlined — white with tertiary border (design system "Outlined" button)
        outlined: "bg-white border-2 border-tertiary text-tertiary hover:bg-tertiary-light",
        // Ghost — no background
        ghost: "hover:bg-primary-light text-primary",
        // Danger
        destructive: "bg-danger text-white hover:opacity-90 shadow-sm",
        // Legacy compat
        outline: "bg-white border border-border text-foreground hover:bg-neutral-light shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
