"use client"
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "relative inline-flex h-12 sm:h-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-1 sm:p-1.5 shadow-2xl shadow-purple-500/10",
      "w-full max-w-fit mx-auto gap-1 sm:gap-2",
      "before:absolute before:inset-0 before:rounded-xl sm:before:rounded-2xl before:bg-gradient-to-r before:from-purple-600/20 before:via-blue-600/20 before:to-cyan-600/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 ease-out",
      "text-slate-300 hover:text-white hover:scale-105 active:scale-95",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Active state with stunning gradient and glow
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:via-blue-600 data-[state=active]:to-cyan-600",
      "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50",
      "data-[state=active]:scale-105 data-[state=active]:font-bold",
      // Animated border for active state
      "data-[state=active]:before:absolute data-[state=active]:before:inset-0 data-[state=active]:before:rounded-lg sm:data-[state=active]:before:rounded-xl",
      "data-[state=active]:before:bg-gradient-to-r data-[state=active]:before:from-purple-400 data-[state=active]:before:via-blue-400 data-[state=active]:before:to-cyan-400",
      "data-[state=active]:before:opacity-30 data-[state=active]:before:blur-sm data-[state=active]:before:-z-10",
      // Hover effects for inactive tabs
      "hover:bg-slate-700/50 hover:shadow-md hover:shadow-slate-500/20",
      // Subtle animation
      "transform-gpu will-change-transform",
      // Responsive min-width to prevent cramping
      "min-w-[60px] sm:min-w-[80px]",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
      "animate-in fade-in-50 slide-in-from-bottom-2 duration-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }