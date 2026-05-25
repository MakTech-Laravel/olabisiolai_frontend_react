import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onChange, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null)

  const setRefs = (el: HTMLTextAreaElement) => {
    innerRef.current = el

    if (typeof ref === "function") {
      ref(el)
    } else if (ref) {
      ref.current = el
    }
  }

  const handleAutoResize = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const textarea = e.target

    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`

    onChange?.(e)
  }

  return (
    <textarea
      ref={setRefs}
      rows={1}
      onChange={handleAutoResize}
      className={cn(
        "flex w-full resize-none overflow-y-auto scrollbar-hide rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }