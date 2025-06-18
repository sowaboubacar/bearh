import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FileIcon, PlayIcon, PauseIcon, DownloadIcon } from 'lucide-react';
import { formatFileSize } from "~/core/utils/media/convert.filesize";
import { cn } from "~/lib/utils";
import type { IDocument } from '~/core/entities/document.entity.server'

interface AttachmentGalleryProps {
  attachments: IDocument[];
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<IDocument | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const isImage = (attachment: IDocument) => {
    return attachment.file.meta.mimeType.startsWith('image/');
  };

  const isVideo = (attachment: IDocument) => {
    return attachment.file.meta.mimeType.startsWith('video/');
  };

  const handlePlayPause = (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play().catch(error => {
        setVideoError("Erreur lors de la lecture de la vidéo");
        console.error("Video playback error:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoError = () => {
    setVideoError("Impossible de charger la vidéo");
  };

  const handleDialogClose = () => {
    setIsPlaying(false);
    setVideoError(null);
  };

  return (
    <div className="space-y-6">
      {/* <h3 className="text-xl sm:text-2xl font-semibold">
        Pièces jointes
      </h3> */}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {attachments.map((attachment) => (
          <Dialog 
            key={attachment.id} 
            onOpenChange={(open) => {
              setSelectedAttachment(open ? attachment : null);
              if (!open) handleDialogClose();
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-40 sm:h-32 p-4 overflow-hidden flex flex-col items-center justify-center",
                  "relative group hover:border-primary transition-colors"
                )}
              >
                {isImage(attachment) ? (
                  <div className="relative w-full h-full">
                    <img
                      src={attachment.file.url}
                      alt={attachment.label || "Image"}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 truncate">
                      <span className="text-base">
                        {attachment.label || "Image"}
                      </span>
                    </div>
                  </div>
                ) : isVideo(attachment) ? (
                  <div className="relative w-full h-full">
                    <video
                      src={attachment.file.url}
                      className="w-full h-full object-cover rounded-md"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <PlayIcon className="w-12 h-12 text-white opacity-80 group-hover:opacity-100" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 truncate">
                      <span className="text-base">
                        {attachment.label || "Vidéo"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileIcon className="w-12 h-12 mb-4" />
                    <span className="text-base text-center truncate w-full">
                      {attachment.label || attachment.file.meta.extension.toUpperCase()}
                    </span>
                  </>
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[725px] p-6">
              {selectedAttachment && (
                <div className="flex flex-col items-center space-y-6">
                  <h3 className="text-xl sm:text-2xl font-semibold text-center">
                    {selectedAttachment.label || "Pièce jointe"}
                  </h3>
                  
                  {isImage(selectedAttachment) ? (
                    <img
                      src={selectedAttachment.file.url}
                      alt={selectedAttachment.label || "Image"}
                      className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                    />
                  ) : isVideo(selectedAttachment) ? (
                    <div className="relative w-full aspect-video">
                      <video
                        src={selectedAttachment.file.url}
                        className="w-full h-full rounded-lg"
                        controls
                        playsInline
                        onError={handleVideoError}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      >
                        <track 
                          kind="captions"
                          src={`/captions/${selectedAttachment.id}.vtt`}
                          srcLang="fr"
                          label="Français"
                          default
                        />
                        Votre navigateur ne prend pas en charge la lecture de vidéos.
                      </video>
                      {videoError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <p className="text-base text-white">{videoError}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileIcon className="w-20 h-20 mb-4" />
                      <p className="text-lg">
                        {selectedAttachment.file.meta.extension.toUpperCase()} File
                      </p>
                    </div>
                  )}
                  
                  {selectedAttachment.description && (
                    <p className="text-base text-muted-foreground text-center">
                      {selectedAttachment.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between w-full text-base text-muted-foreground">
                    <span>{selectedAttachment.file.meta.mimeType}</span>
                    <span>{formatFileSize(selectedAttachment.file.meta.size)}</span>
                  </div>
                  
                  <Button 
                    asChild 
                    className="w-full h-12 text-base"
                  >
                    <a 
                      href={selectedAttachment.file.url} 
                      download={selectedAttachment.label || "download"}
                      className="flex items-center justify-center gap-2"
                    >
                      <DownloadIcon className="h-5 w-5" />
                      Télécharger
                    </a>
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}

