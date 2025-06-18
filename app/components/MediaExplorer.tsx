import { useState, useEffect, useRef } from "react";
import { useFetcher, useNavigate, useSearchParams } from "@remix-run/react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  FileIcon,
  SearchIcon,
  PlayIcon,
  PauseIcon,
  ArrowLeft,
  ArrowRightCircle,
  ArrowLeftCircle,
} from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import type { IDocument } from "~/core/entities/document.entity.server";

interface MediaExplorerProps {
  onSelect: (documents: IDocument[]) => void;
  multiple?: boolean;
}

interface VideoPreviewState {
  docId: string | null;
  isPlaying: boolean;
}

export function MediaExplorer({
  onSelect,
  multiple = false,
}: MediaExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const [videoPreview, setVideoPreview] = useState<VideoPreviewState>({
    docId: null,
    isPlaying: false,
  });
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const fetcher = useFetcher<{
    documents: {
      results: IDocument[];
      page: number;
      limit: number;
      totalPages: number;
      totalResults: number;
    };
  }>();
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetcher.load(`/api/media?filter=${searchTerm}&page=${page}`);
  }, [searchTerm, page]);

  const documents = fetcher.data?.documents || [];
  const isLoading = fetcher.state === "loading";

  const handleDocumentSelect = (doc: IDocument) => {
    if (multiple) {
      setSelectedDocuments((prev) =>
        prev.some((d) => d.id === doc.id)
          ? prev.filter((d) => d.id !== doc.id)
          : [...prev, doc]
      );
    } else {
      setSelectedDocuments([doc]);
    }
  };

  const handleVideoPlayPause = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation(); // Prevent document selection when clicking play/pause

    const video = videoRefs.current[docId];
    if (!video) return;

    if (videoPreview.docId === docId && videoPreview.isPlaying) {
      video.pause();
      setVideoPreview({ docId: null, isPlaying: false });
    } else {
      // Pause any other playing video
      if (videoPreview.docId && videoPreview.docId !== docId) {
        videoRefs.current[videoPreview.docId]?.pause();
      }
      video.play().catch(console.error);
      setVideoPreview({ docId, isPlaying: true });
    }
  };

  const handleConfirmSelection = () => {
    onSelect(selectedDocuments);
  };

  const getFileDisplay = (doc: IDocument) => {
    const { mimeType, extension } = doc.file.meta;

    if (mimeType.startsWith("image/")) {
      return (
        <img
          src={doc.file.url}
          alt={doc.label}
          className="w-full h-full object-cover"
        />
      );
    }

    if (mimeType.startsWith("video/")) {
      return (
        <div className="relative w-full h-full">
          <video
            ref={(el) => el && (videoRefs.current[doc.id] = el)}
            className="w-full h-full object-cover"
            src={doc.file.url}
            muted
            playsInline
            onEnded={() => setVideoPreview({ docId: null, isPlaying: false })}
          >
            <track
              kind="captions"
              src={`/captions/${doc.id}.vtt`}
              srcLang="fr"
              label="Français"
              default
            />
          </video>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={cn(
              "absolute inset-0 m-auto",
              "w-10 h-10 rounded-full",
              "bg-background/80 hover:bg-background/90",
              "transition-all duration-200",
              videoPreview.docId === doc.id && videoPreview.isPlaying
                ? "opacity-0 hover:opacity-100"
                : "opacity-100"
            )}
            onClick={(e) => handleVideoPlayPause(e, doc.id)}
          >
            {videoPreview.docId === doc.id && videoPreview.isPlaying ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {videoPreview.docId === doc.id && videoPreview.isPlaying
                ? "Pause"
                : "Lecture"}
            </span>
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <FileIcon className="w-12 h-12 text-muted-foreground" />
        <span className="mt-2 text-xs text-muted-foreground uppercase">
          {extension || "Fichier"}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher des fichiers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <Card
              key={`skeleton-${index}`}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <Skeleton className="aspect-square w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : documents.totalResults < 1 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-xl text-gray-500">
              Aucun fichier trouvé. Veuillez utiliser le media manager pour
              télécharger des fichiers.
            </p>
          </div>
        ) : (
          <>
            {documents?.results?.map((doc) => (
              <Card
                key={doc.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all duration-200",
                  "border-2",
                  selectedDocuments.some((d) => d.id === doc.id)
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
                onClick={() => handleDocumentSelect(doc)}
              >
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "aspect-square mb-2",
                      "bg-muted rounded-md",
                      "overflow-hidden"
                    )}
                  >
                    {getFileDisplay(doc)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="text-sm font-medium truncate flex-1"
                      title={doc.label}
                    >
                      {doc.label || "Sans titre"}
                    </p>
                    <Checkbox
                      checked={selectedDocuments.some((d) => d.id === doc.id)}
                      className="translate-y-[1px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {!isLoading && documents.totalResults > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 mb-2">
          <Button
            variant="outline"
            onClick={() => {
              // const params = new URLSearchParams(searchParams);
              // params.set("page", (documents.page - 1).toString());
              // navigate(`?${params.toString()}`);
              setPage(documents.page - 1);
            }}
            disabled={documents.page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            <ArrowLeftCircle className="h-5 w-5" />
          </Button>
          <span className="text-base">
            Page {documents.page} / {documents.totalResults} media(s)
          </span>
          <Button
            variant="outline"
            onClick={() => {
              // const params = new URLSearchParams(searchParams);
              // params.set("page", (documents.page + 1).toString());
              // navigate(`?${params.toString()}`);
              setPage(documents.page + 1);
            }}
            disabled={documents.page === documents.totalPages}
            className="w-full sm:w-auto h-12 text-base"
          >
            <ArrowRightCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      <Button
        onClick={handleConfirmSelection}
        disabled={selectedDocuments.length === 0}
        className="w-full"
      >
        {multiple ? "Sélectionner des fichiers" : "Sélectionner un fichier"}
      </Button>
    </div>
  );
}
