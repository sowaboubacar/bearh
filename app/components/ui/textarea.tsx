// import * as React from "react"

// import { cn } from "~/lib/utils"

// const Textarea = React.forwardRef<
//   HTMLTextAreaElement,
//   React.ComponentProps<"textarea">
// >(({ className, ...props }, ref) => {
//   return (
//     <textarea
//       className={cn(
//         "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//         className
//       )}
//       ref={ref}
//       {...props}
//     />
//   )
// })
// Textarea.displayName = "Textarea"

// export { Textarea }

import * as React from "react"
import { cn } from "~/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number
  maxRows?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minRows = 3, maxRows = 10, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    const handleResize = () => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.style.height = 'auto'
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, minRows * 24), // Assuming 24px line height
        maxRows * 24
      )
      textarea.style.height = `${newHeight}px`
    }

    React.useEffect(() => {
      handleResize()
    }, [props.value])

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={(node) => {
          textareaRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        onInput={handleResize}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }