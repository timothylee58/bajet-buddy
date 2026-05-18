import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-b-4 border-brand-dark bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:brightness-105 active:translate-y-0.5 active:border-b-2",
        outline:
          "border border-primary/25 bg-primary-light text-primary-dark hover:border-primary/40 hover:bg-primary/10",
        ghost: "text-primary-dark hover:bg-primary-light",
        secondary: "border border-border bg-white text-foreground shadow-sm hover:bg-surface-muted",
        inverted: "bg-foreground text-white shadow-lg hover:opacity-90",
        outlined: "border-2 border-tertiary bg-tertiary-light text-tertiary-dark hover:bg-tertiary/10",
        destructive: "bg-danger text-white hover:opacity-90 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
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
