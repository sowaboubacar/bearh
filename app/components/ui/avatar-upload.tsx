import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { UploadIcon, FolderOpenIcon } from 'lucide-react'

interface AvatarUploadProps {
  previewUrl?: string
  onUploadClick: () => void
  onExplorerClick: (e: React.MouseEvent) => void
  isBusy: boolean
}

export function AvatarUpload({ previewUrl, onUploadClick, onExplorerClick, isBusy }: AvatarUploadProps) {
  return (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <div className={cn(
        "w-full h-full rounded-full border-2 border-dashed border-gray-300 overflow-hidden",
        "flex items-center justify-center bg-muted",
        previewUrl ? "border-none" : ""
      )}>
        {previewUrl ? (
          <img 
            src={previewUrl || "/placeholder.svg"} 
            alt="Avatar preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="p-2">
            <span className="text-sm text-center text-muted-foreground">
              Aucune image
            </span>
          </div>
        )}
      </div>
      
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onUploadClick}
          disabled={isBusy}
        >
          <UploadIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onExplorerClick}
          disabled={isBusy}
        >
          <FolderOpenIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

