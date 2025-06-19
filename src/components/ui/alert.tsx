
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, AlertTriangle, Info, XCircle, Bell } from "lucide-react" // Import common icons

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground [&>svg]:text-foreground", // Garante que o ícone padrão também tenha cor
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
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
  const Icon =
    React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && typeof child.type !== 'string' && (child.type as any).displayName?.includes("Icon")
    ) || // Prioritize icon passed as child
    (variant === "destructive" ? XCircle :
    variant === "success" ? CheckCircle :
    variant === "warning" ? AlertTriangle :
    variant === "info" ? Info :
    null); // Default icon based on variant (Bell for default can be an option too if needed)

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {Icon && React.isValidElement(Icon) ? 
        React.cloneElement(Icon as React.ReactElement<any>, { 
          className: cn("h-4 w-4", Icon.props.className) 
        }) : 
        Icon ? <Icon className={cn("h-4 w-4")} /> : null // Render the icon component if it's a direct component
      }
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

    
