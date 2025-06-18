import { useState, useRef } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { FileIcon, PlayIcon, PauseIcon, XIcon } from 'lucide-react';
import { cn } from "~/lib/utils";
import type { IDocument } from '~/core/entities/document.entity.server'


interface DocumentPreviewProps {
    document: IDocument;
    onRemove?: () => void;
    disabled?: boolean;
    showRemoveButton?: boolean;
  }
  
  export function DocumentPreview({ 
    document, 
    onRemove, 
    disabled = false,
    showRemoveButton = true 
  }: DocumentPreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
  
    const isImage = document.file.meta.mimeType.startsWith('image/');
    const isVideo = document.file.meta.mimeType.startsWith('video/');
  
    const handlePlayPause = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!videoRef.current) return;
  
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          setError("Erreur de lecture de la vidéo");
          console.error(err);
        });
      }
      setIsPlaying(!isPlaying);
    };
  
    const handleVideoLoad = () => {
      setIsVideoLoaded(true);
      setError(null);
    };
  
    const handleVideoError = () => {
      setIsVideoLoaded(false);
      setError("Impossible de charger la vidéo");
    };
  
    return (
      <Card className={cn(
        "overflow-hidden",
        "transition-all duration-200",
        "hover:shadow-md",
        disabled && "opacity-50"
      )}>
        <CardContent className="p-3">
          <div className={cn(
            "relative aspect-square mb-3",
            "bg-muted rounded-md",
            "flex items-center justify-center",
            "overflow-hidden"
          )}>
            {isImage ? (
              <img
                src={document.file.url}
                alt={document.label || "Image"}
                className={cn(
                  "w-full h-full",
                  "object-cover",
                  "transition-transform duration-200",
                  "hover:scale-105"
                )}
              />
            ) : isVideo ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                  playsInline
                  muted
                >
                  <source src={document.file.url} type={document.file.meta.mimeType} />
                  <track 
                    kind="captions"
                    src={`/captions/${document.id}.vtt`}
                    srcLang="fr"
                    label="Français"
                    default
                  />
                  Votre navigateur ne prend pas en charge la lecture de vidéos.
                </video>
  
                {!isVideoLoaded && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <FileIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
  
                {error ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <p className="text-sm text-destructive px-2 text-center">{error}</p>
                  </div>
                ) : isVideoLoaded && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "absolute inset-0 m-auto",
                      "w-12 h-12 rounded-full",
                      "bg-background/80 hover:bg-background/90",
                      "transition-opacity duration-200",
                      !isPlaying && "opacity-0 hover:opacity-100"
                    )}
                    onClick={(e) => handlePlayPause(e)}
                    disabled={disabled}
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-6 w-6" />
                    ) : (
                      <PlayIcon className="h-6 w-6" />
                    )}
                    <span className="sr-only">
                      {isPlaying ? "Pause" : "Lecture"}
                    </span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4">
                <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <span className="text-xs text-muted-foreground uppercase">
                  {document.file.meta.extension}
                </span>
              </div>
            )}
          </div>
  
          <div className="space-y-3">
            <p className={cn(
              "text-sm font-medium truncate",
              "text-foreground/90"
            )} title={document.label}>
              {document.label || ""}
            </p>
  
            {showRemoveButton && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRemove}
                className="w-full"
                disabled={disabled}
              >
                <XIcon className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  