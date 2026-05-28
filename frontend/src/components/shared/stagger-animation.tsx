import * as React from "react"

import { cn } from "@/lib/utils"

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  delay?: number
}

export function StaggerContainer({
  children,
  className,
  delay = 50,
  ...props
}: StaggerContainerProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn(className)} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        return (
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0)" : "translateY(12px)",
              transition: `opacity 0.5s ease-out ${index * delay}ms, transform 0.5s ease-out ${index * delay}ms`,
            }}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

interface StaggerItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  index?: number
  delay?: number
}

export function StaggerItem({
  children,
  className,
  index = 0,
  delay = 50,
  ...props
}: StaggerItemProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10 + index * delay)
    return () => clearTimeout(timer)
  }, [index, delay])

  return (
    <div
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
