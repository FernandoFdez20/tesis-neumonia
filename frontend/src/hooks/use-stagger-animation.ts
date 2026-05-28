import * as React from "react"

export function useStaggerAnimation(delay = 50) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const getStaggerStyle = (index: number): React.CSSProperties => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(8px)",
    transition: `opacity 0.4s ease-out ${index * delay}ms, transform 0.4s ease-out ${index * delay}ms`,
  })

  return { getStaggerStyle, isVisible }
}
