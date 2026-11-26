import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

// shadcn/ui-pattern Button (cva variants), without the Radix Slot dependency.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand-700 text-white hover:bg-brand-800',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
        outline: 'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-verified-600 text-white hover:bg-verified-700',
        link: 'text-brand-600 underline-offset-4 hover:underline rounded-none',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-11 px-7 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'
