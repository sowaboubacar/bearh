import { useState, useRef, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { FileIcon, UploadIcon, FolderOpenIcon } from 'lucide-react';
import { FilePreview } from "~/components/ui/file-preview";
import { FileUploadZone } from "~/components/ui/file-upload-zone";
import { Progress } from "~/components/ui/progress";
import { MediaExplorer } from "./MediaExplorer";
import { ToastProvider, ToastViewport } from "~/components/ui/toast";
import { useToast } from "~/hooks/use-toast";
import type { IDocument } from "~/core/entities/document.entity.server";
import { DocumentPreview } from "./ui/document-preview";
import { cn } from "~/lib/utils";
import { AvatarUpload } from "~/components/ui/avatar-upload";

interface UploadWidgetProps {
  /**
   * Called when the user selects a file or files by uploading or from the media explorer
   * @param documents - The selected documents
   * @returns void
   */
  onSelect: (documents: IDocument[]) => void;

  /**
   * Called when the busy state of the component changes
   * @param busy - The busy state of the component
   * @returns void
   */
  onBusyStateChange?: (busy: boolean) => void;

  /**
   * Allow multiple file selection
   * @default false
   */
  multiple?: boolean;

  /**
   * The file types that the input should accept
   * @default undefined
   * @example "image/*,.pdf,.doc"
   */
  accept?: string;

  /**
   * The maximum file size in bytes
   * @default undefined
   */
  maxSize?: number;

  /**
   * The default selected documents
   * @default []
   */
  defaultSelectedDocuments?: IDocument[];

  className?: string;

  can?: Record<string,boolean>;
  isAvatar?: boolean;
}

interface FileWithPreview {
  file: File;
  progress: number;
  previewUrl?: string;
}

export function UploadWidget({
  onSelect,
  onBusyStateChange,
  multiple = false,
  accept,
  maxSize,
  defaultSelectedDocuments = [],
  className = "",
  can,
  isAvatar = false,
}: UploadWidgetProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    defaultSelectedDocuments
  );
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isBusy, setIsBusy] = useState(false);
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const fetcherDocument = useFetcher();


  // Track busy state changes
  useEffect(() => {
    const isUploading = fetcher.state !== "idle";
    const hasIncompleteUploads = Object.values(uploadProgress).some(
      (progress) => progress < 100
    );
    const newBusyState = isUploading || hasIncompleteUploads || isExplorerOpen;

    setIsBusy(newBusyState);
    onBusyStateChange?.(newBusyState);
  }, [fetcher.state, uploadProgress, isExplorerOpen]);

  useEffect(() => {
    if (defaultSelectedDocuments.length > 0) {
      setSelectedDocuments(defaultSelectedDocuments);
      onSelect(defaultSelectedDocuments);
    }
  }, []);


  // useEffect(() => {
  //   fetcherDocument.load(`/api/media?needCan=${true}`);


  // }, []);

  // const canD = fetcher.data?.can || [];
  // console.log(canD)


  useEffect(() => {
    if (fetcher.data && fetcher.data.success) {

      // Set the selected documents
      const newDocuments = fetcher.data.documents;
      setSelectedDocuments((prevDocs) => {
        const mergedDocs = multiple
          ? [...prevDocs, ...newDocuments]
          : newDocuments;
        onSelect(mergedDocs);
        return mergedDocs;
      });

      setSelectedFiles([]);
      setUploadProgress({});
    } else if (fetcher.data && fetcher.data.error) {
      setError(fetcher.data.error);
      toast({
        title: "Erreur",
        description: `Erreur lors du téléchargement: ${fetcher.data.error}`,
        variant: "destructive",
      });
      resetForm();
    }
  }, [fetcher.data, multiple]);


  const handleFilesSelect = (files: FileList) => {
    if (isAvatar) {
      // Add size validation for avatar mode
      const tooLargeFiles = Array.from(files).filter(
        (file) => maxSize && file.size > maxSize
      );

      if (tooLargeFiles.length > 0) {
        setError(
          `L'image dépasse la taille maximale autorisée de ${
            maxSize / 1024 / 1024
          } MB.`
        );
        return;
      }

      // Existing avatar validation
      const validFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .slice(0, 1)
        .map(file => ({
          file,
          progress: 0,
          previewUrl: URL.createObjectURL(file),
        }));
      
      if (validFiles.length === 0) {
        setError("Veuillez sélectionner une image valide");
        return;
      }

      setSelectedFiles(validFiles);
      handleUpload(validFiles);
      return;
    }

    // Vérifier si des fichiers dépassent la taille maximale
    const tooLargeFiles = Array.from(files).filter(
      (file) => maxSize && file.size > maxSize
    );

    if (tooLargeFiles.length > 0) {
      setError(
        `Un ou plusieurs fichiers dépassent la taille maximale autorisée de ${
          maxSize / 1024 / 1024
        } MB.`
      );
      //setShowUploadZone(false); // Masquer la zone de téléversement

      return;
    }

    const validFiles: FileWithPreview[] = Array.from(files).map((file) => ({
      file,
      progress: 0,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    if (!multiple) {
      setSelectedFiles(validFiles.slice(0, 1));
      handleUpload(validFiles.slice(0, 1));
    } else {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      handleUpload(validFiles);
    }
  };

  // Fonction pour réinitialiser l'erreur et réafficher la zone de téléversement
  const resetError = () => {
    setError(null);
    setShowUploadZone(true);
    // Réinitialiser les fichiers sélectionnés
    setSelectedFiles([]);
    // Réinitialiser la progression de téléversement
    setUploadProgress({});
  };
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });

    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  const removeDocument = (index: number) => {
    setSelectedDocuments((prev) => {
      const newDocs = [...prev];
      newDocs.splice(index, 1);
      onSelect(newDocs);
      return newDocs;
    });
  };

  const handleUpload = (files: FileWithPreview[]) => {
    const formData = new FormData();
    formData.append("_action", "upload");

    files.forEach((fileData) => {
      formData.append(`files`, fileData.file);
    });

    fetcher.submit(formData, {
      method: "post",
      action: "/api/media",
      encType: "multipart/form-data",
    });

    files.forEach((_, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) {
          clearInterval(interval);
          progress = 100;
        }
        setUploadProgress((prev) => ({
          ...prev,
          [index]: Math.round(progress),
        }));
      }, 200);
    });
  };

  useEffect(() => {
    if (fetcher.state === "idle") {
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        Object.keys(newProgress).forEach((key) => {
          newProgress[key] = 100;
        });
        return newProgress;
      });
    }
  }, [fetcher.state]);

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
      setSelectedFiles([]);
      setUploadProgress({});
    }
  };

  const handleExplorerSelect = (documents: Document[]) => {
    if (!multiple) {
      const newDocs = documents.slice(-1);
      setSelectedDocuments(newDocs);
      onSelect(newDocs);
    } else {
      setSelectedDocuments((prev) => {
        const mergedDocs = [...prev, ...documents];
        onSelect(mergedDocs);
        return mergedDocs;
      });
    }
    setIsExplorerOpen(false);
    setShowUploadZone(false);
  };

  const handleMediaExplorerOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExplorerOpen(true);
    setShowUploadZone(false);
  };

  const toggleUploadZone = () => {
    setShowUploadZone((prev) => !prev);
    if (isExplorerOpen) {
      setIsExplorerOpen(false);
    }
  };

  return (
    <ToastProvider>
    {isAvatar ? (
      <div className="mb-8">
        <AvatarUpload
          previewUrl={selectedDocuments[0]?.file?.url || selectedFiles[0]?.previewUrl}
          onUploadClick={toggleUploadZone}
          onExplorerClick={handleMediaExplorerOpen}
          isBusy={isBusy}
        />
        {showUploadZone && (
          <>
              {error ? (
                 <div className="text-center">
                 <p className="text-red-500 font-medium mb-4">{error}</p>
                 <Button onClick={resetError}>
                   Ressayer
                 </Button>
               </div>
              ) : (
                <form
                  ref={formRef}
                  className="space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <FileUploadZone
                    maxSize={maxSize ? `${maxSize / 1024 / 1024}MB` : "5MB"}
                    multiple={multiple}
                    accept={accept}
                    onFileSelect={handleFilesSelect}
                    maxFilesNumber={multiple ? undefined : 1}
                    disabled={isBusy}
                  />

                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {selectedFiles.map((fileData, index) => (
                        <FilePreview
                          key={`${fileData.file.name}-${index}`}
                          file={fileData.file}
                          progress={uploadProgress[index] || 0}
                          previewUrl={fileData.previewUrl}
                          onRemove={() => removeFile(index)}
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}

                  {fetcher.state !== "idle" && selectedFiles.length > 0 && (
                    <Progress
                      value={
                        Object.values(uploadProgress).reduce(
                          (a, b) => a + b,
                          0
                        ) / selectedFiles.length
                      }
                      className="w-full"
                    />
                  )}
                </form>
              )}
            </>
        )}
      </div>
    ) : (
      <Card className={cn("mb-8 val-card-media-zone", className)}>
        <CardHeader>
          <CardTitle className="text-center text-base sm:text-lg md:text-xl">
            Choisissez une méthode pour sélectionner
            {multiple ? " des fichiers" : " un fichier"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4 text-center justify-center items-center">
            <Button
              type="button"
              onClick={toggleUploadZone}
              className="w-full sm:w-auto"
              disabled={isBusy}
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Téléverser {multiple ? " des fichiers" : " un fichier"}
            </Button>
            <Button
              type="button"
              onClick={handleMediaExplorerOpen}
              className="w-full sm:w-auto"
              disabled={isBusy}
            >
              <FolderOpenIcon className="mr-2 h-4 w-4" />
              Choisir depuis la médiathèque
            </Button>
          </div>

          {showUploadZone && (
            <>
              {error ? (
                 <div className="text-center">
                 <p className="text-red-500 font-medium mb-4">{error}</p>
                 <Button onClick={resetError}>
                   Ressayer
                 </Button>
               </div>
              ) : (
                <form
                  ref={formRef}
                  className="space-y-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <FileUploadZone
                    maxSize={maxSize ? `${maxSize / 1024 / 1024}MB` : "5MB"}
                    multiple={multiple}
                    accept={accept}
                    onFileSelect={handleFilesSelect}
                    maxFilesNumber={multiple ? undefined : 1}
                    disabled={isBusy}
                  />

                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {selectedFiles.map((fileData, index) => (
                        <FilePreview
                          key={`${fileData.file.name}-${index}`}
                          file={fileData.file}
                          progress={uploadProgress[index] || 0}
                          previewUrl={fileData.previewUrl}
                          onRemove={() => removeFile(index)}
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}

                  {fetcher.state !== "idle" && selectedFiles.length > 0 && (
                    <Progress
                      value={
                        Object.values(uploadProgress).reduce(
                          (a, b) => a + b,
                          0
                        ) / selectedFiles.length
                      }
                      className="w-full"
                    />
                  )}
                </form>
              )}
            </>
          )}

          {selectedDocuments.length > 0 && (
            <div className="mt-4">
              <h6 className="text-sm font-medium mb-2">
                Sélections depuis le Média Manager
              </h6>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedDocuments.map((doc, index) => (
                  <DocumentPreview
                    key={doc.id}
                    document={doc}
                    onRemove={() => removeDocument(index)}
                    disabled={isBusy}
                    showRemoveButton={true}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )}

    <Dialog open={isExplorerOpen} onOpenChange={setIsExplorerOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Sélectionner {multiple ? "des fichiers" : "un fichier"}
          </DialogTitle>
        </DialogHeader>
        <MediaExplorer onSelect={handleExplorerSelect} multiple={multiple} />
      </DialogContent>
    </Dialog>

    <ToastViewport />
  </ToastProvider>
  );
}

