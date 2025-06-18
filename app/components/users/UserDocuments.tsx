import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { AttachmentGallery } from '~/components/AttachmentGallery'
import type { IDocument } from '~/core/entities/document.entity.server'

interface UserDocumentsProps {
  attachments: IDocument[]
}

export function UserDocuments({ attachments }: UserDocumentsProps) {
  
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {attachments && (
          <div className="rounded-lg">
            <AttachmentGallery 
              attachments={attachments} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );  
}

