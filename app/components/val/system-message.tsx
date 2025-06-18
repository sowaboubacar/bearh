import React from 'react'
import { cn } from "~/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { Button } from "~/components/ui/button"

type MessageType = 'success' | 'info' | 'warning' | 'error'

interface MessageBoxProps {
  type: MessageType
  title: string
  message: string
  onClose?: () => void
  layoutStyle: 'macos' | 'windows'
}

const iconMap: Record<MessageType, React.ElementType> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
}

const colorMap: Record<MessageType, string> = {
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
}

const textColorMap: Record<MessageType, string> = {
  success: 'text-green-800 dark:text-green-200',
  info: 'text-blue-800 dark:text-blue-200',
  warning: 'text-yellow-800 dark:text-yellow-200',
  error: 'text-red-800 dark:text-red-200',
}

export default function MessageBox({ type, title, message, onClose, layoutStyle }: MessageBoxProps) {
  const Icon = iconMap[type]

  return (
    <Alert 
      className={cn(
        "flex items-start",
        colorMap[type],
        layoutStyle === 'macos' ? "rounded-lg" : "rounded",
        layoutStyle === 'macos' ? "shadow-lg" : "shadow"
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5", textColorMap[type])} />
      <div className="ml-3 flex-1">
        <AlertTitle className={cn("text-sm font-medium mb-1", textColorMap[type])}>
          {title}
        </AlertTitle>
        <AlertDescription className={cn("text-sm", textColorMap[type])}>
          {message}
        </AlertDescription>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-0 h-auto",
            layoutStyle === 'macos' ? "hover:bg-transparent" : "hover:bg-gray-200 dark:hover:bg-gray-800"
          )}
          onClick={onClose}
        >
          <X className={cn("h-4 w-4", textColorMap[type])} />
          <span className="sr-only">Fermer</span>
        </Button>
      )}
    </Alert>
  )
}