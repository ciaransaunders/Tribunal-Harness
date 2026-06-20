"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/ui-utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "solid" | "wireframe" | "glass";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "solid", children, ...props }, ref) => {
        const variants = {
            solid: "bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]",
            wireframe: "bg-transparent border border-[rgba(255,255,255,0.06)]",
            // Liquid Glass: no hard border — a subtle edge comes from a ring (box-shadow), per HANDOFF.md §8.
            glass: "bg-[rgba(255,255,255,0.03)] backdrop-blur-md ring-1 ring-white/10",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-[var(--radius-card)] p-6 shadow-sm transition-all",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = "Card";

export { Card };
