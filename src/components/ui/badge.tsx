import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-50 text-brand-700',
        secondary: 'border-transparent bg-zinc-100 text-zinc-700',
        outline: 'border-zinc-300 text-zinc-700',
        verified: 'border-verified-600/30 bg-verified-50 text-verified-700',
        warning: 'border-amber-300 bg-amber-50 text-amber-800',
        danger: 'border-red-200 bg-red-50 text-red-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
