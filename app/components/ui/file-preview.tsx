import { FileIcon, XIcon, PlayIcon, PauseIcon, SubtitlesIcon } from 'lucide-react'
import { Progress } from "./progress"
import { Button } from "./button"
import { useState, useRef } from 'react'
import { cn } from "~/lib/utils"
import type { IDocument } from '~/core/entities/document.entity.server'

interface FilePreviewProps {
  file: File | undefined
  document?: IDocument // If this is present, ignore file and use document.file.url
  progress?: number
  onRemove: () => void
  previewUrl?: string
  disabled?: boolean

  className?: string;
}

export function FilePreview({ 
  file, 
  progress, 
  onRemove, 
  previewUrl,
  disabled = false ,
  className,
}: FilePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          setError("Erreur de lecture de la vidéo");
          console.error(err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setError(null);
  };

  const handleVideoError = () => {
    setIsVideoLoaded(false);
    setError("Impossible de charger la vidéo");
  };

  const toggleCaptions = () => {
    if (videoRef.current && videoRef.current.textTracks.length > 0) {
      const track = videoRef.current.textTracks[0];
      if (showCaptions) {
        track.mode = 'hidden';
      } else {
        track.mode = 'showing';
      }
      setShowCaptions(!showCaptions);
    }
  };

  const getCaptionFileName = () => {
    if (!file.name) return '';
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return `${baseName}.vtt`;
  };

  return (
    <div className={cn(
      "relative p-4 rounded-xl border",
      "bg-background text-foreground",
      "dark:border-border",
      className
    )}>
      {isImage && previewUrl ? (
        <div className="relative mb-3 w-full aspect-square">
          <img 
            src={previewUrl} 
            alt={file.name}
            className={cn(
              "absolute inset-0 w-full h-full object-cover rounded-lg",
              "bg-muted"
            )}
          />
        </div>
      ) : isVideo && previewUrl ? (
        <div className="relative mb-3 w-full aspect-video">
          <div className={cn(
            "absolute inset-0 rounded-lg overflow-hidden",
            "bg-muted"
          )}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              playsInline
              controls={isVideoLoaded}
            >
              <source src={previewUrl} type={file.type} />
              <track 
                kind="captions"
                src={`/captions/${getCaptionFileName()}`}
                srcLang="fr"
                label="Français"
                default
              />
              Votre navigateur ne prend pas en charge la lecture de vidéos.
            </video>
          </div>

          {!isVideoLoaded && (
            <div className={cn(
              "absolute inset-0 flex flex-col items-center justify-center",
              "rounded-lg bg-muted"
            )}>
              <FileIcon className="h-10 w-10 text-muted-foreground" />
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          {isVideoLoaded && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleCaptions}
                className={cn(
                  "w-8 h-8 rounded-full",
                  "bg-background/80 hover:bg-background/90",
                  "dark:bg-background/90 dark:hover:bg-background"
                )}
                disabled={!isVideoLoaded || disabled}
                title={showCaptions ? "Désactiver les sous-titres" : "Activer les sous-titres"}
              >
                <SubtitlesIcon className="h-4 w-4" />
                <span className="sr-only">
                  {showCaptions ? "Désactiver les sous-titres" : "Activer les sous-titres"}
                </span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handlePlayPause}
                className={cn(
                  "w-8 h-8 rounded-full",
                  "bg-background/80 hover:bg-background/90",
                  "dark:bg-background/90 dark:hover:bg-background"
                )}
                disabled={!isVideoLoaded || disabled}
                title={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isPlaying ? "Pause" : "Lecture"}
                </span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={cn(
          "relative mb-3 w-full aspect-square",
          "flex items-center justify-center",
          "rounded-lg bg-muted"
        )}>
          <FileIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-3">
        <div className={cn(
          "text-sm truncate",
          "text-muted-foreground"
        )} title={file.name}>
          {file.name}
        </div>

        <div className="flex items-center gap-3">

          {progress && (<>
          <div className="min-w-[2.5rem] text-sm">
            {progress}%
          </div>

          <Progress 
            value={progress} 
            className={cn(
              "flex-1",
              "[&>div]:bg-primary"
            )} 
          /></>)}

          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className={cn(
              "min-w-[2rem] h-8",
              "hover:bg-muted",
              "focus-visible:ring-1 focus-visible:ring-ring"
            )}
            disabled={disabled}
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Supprimer le fichier</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

