import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white  shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-custom-green text-white shadow hover:bg-custom-green/50",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-600/80",
        tertiary:
          "border-transparent  bg-yellow-400 text-white hover:bg-yellow-400/80",
        fourth:
          "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
