
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react" // Import common icons

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        // Add more variants if needed
        success: 
          "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600 bg-green-50 dark:bg-green-900/30",
        warning: 
          "border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30",
        info: 
          "border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-600 bg-blue-50 dark:bg-blue-900/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  // Automatically add an icon based on variant if not provided explicitly
  const Icon =
    variant === "destructive" ? XCircle :
    variant === "success" ? CheckCircle :
    variant === "warning" ? AlertTriangle :
    variant === "info" ? Info :
    null; // Default or other custom icon can be passed as child

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {Icon && !React.Children.toArray(children).find(child => React.isValidElement(child) && child.type === Icon) && (
        <Icon className={cn("h-4 w-4", 
          variant === "destructive" && "text-destructive",
          variant === "success" && "text-green-600",
          variant === "warning" && "text-yellow-600",
          variant === "info" && "text-blue-600"
        )} />
      )}
      {children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

    