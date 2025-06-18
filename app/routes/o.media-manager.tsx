/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  useLoaderData,
  Form,
  useSearchParams,
  useFetcher,
  useNavigate,
} from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { documentService } from "~/services/document.service.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { authService } from "~/services/auth.service.server";
import {
  FileIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  EyeIcon,
  Trash2,
  TrendingUp,
  PlayCircle,
  UserCheck,
  ArrowBigRightIcon,
  Eye,
  Upload,
  User,
  TimerIcon,
  Clock,
  Calendar,
  Dot,
} from "lucide-react";
import { Switch } from "~/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { FilePreview } from "~/components/ui/file-preview";
import { FileUploadZone } from "~/components/ui/file-upload-zone";
import { ToastProvider, ToastViewport } from "~/components/ui/toast";
import { useToast } from "~/hooks/use-toast";
import { convertFileSize } from "~/core/utils/media/convert.filesize";
import MessageBox from "~/components/val/system-message";
import { DocumentActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [DocumentActions.List, DocumentActions.ListOwn] }
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const filter = searchParams.get("filter") || "";
  const view = searchParams.get("view") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 8;

  try {
    // Create base query
    let query: any = {
      label: { $regex: filter, $options: "i" }
    };

    // If user only has ListOwn permission, filter for their documents
    const hasFullListAccess = await authService.can(currentLoggedUser.id, DocumentActions.List);
    if (!hasFullListAccess) {
      query = {
        $and: [
          query,
          {
            $or: [
              { owner: currentLoggedUser.id },
              { uploadedBy: currentLoggedUser.id },
              { "availableFor.users": currentLoggedUser.id },
              { "availableFor.access": "all" }
            ]
          }
        ]
      };
    }

    const documents = await documentService.readManyPaginated(
      query,
      {
        page,
        limit,
        sortBy: "updatedAt:desc",
        populate: "owner,uploadedBy,availableFor.users,availableFor.departments,availableFor.teams,availableFor.positions,availableFor.hourGroups"
      }
    );

    const can = {
      view: await authService.can(currentLoggedUser.id, { 
        any: [DocumentActions.ViewOwn, DocumentActions.View] 
      }),
      edit: await authService.can(currentLoggedUser.id, { 
        any: [DocumentActions.EditOwn, DocumentActions.Edit] 
      }),
      delete: await authService.can(currentLoggedUser.id, { 
        any: [DocumentActions.DeleteOwn, DocumentActions.Delete] 
      }),
      upload: await authService.can(currentLoggedUser.id, { 
        any: [DocumentActions.Upload, DocumentActions.InFormUpload] 
      }),
      share: await authService.can(currentLoggedUser.id, DocumentActions.Share)
    };

    return Response.json({ documents, page, limit, view, can });
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération des documents." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const documentId = formData.get("documentId") as string;

  try {
    const document = await documentService.readOne({
      id: documentId,
      populate: "owner,uploadedBy"
    });

    if (!document) {
      throw Response.json({ message: "Document non trouvé" }, { status: 404 });
    }

    switch (action) {
      case "delete":
        // Check delete permission
        const hasFullDeleteAccess = await authService.can(currentLoggedUser.id, DocumentActions.Delete);
        const canDeleteOwn = await authService.can(currentLoggedUser.id, DocumentActions.DeleteOwn, {
          resourceOwnerId: document.owner.id,
          targetUserId: currentLoggedUser.id
        });

        if (!hasFullDeleteAccess && !canDeleteOwn) {
          throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
        }

        await documentService.deleteOne(documentId);
        return Response.json({ success: true });

      default:
        throw Response.json({ message: "Action non valide" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing document action:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors du traitement de l'action." },
      { status: 500 }
    );
  }
};

interface FileWithPreview {
  file: File;
  progress: number;
  previewUrl?: string;
}

export default function MediaManager() {
  const navigate = useNavigate();
  const { documents, view: initialView, can } = useLoaderData<typeof loader>();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isGridView, setIsGridView] = useState(initialView === "grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDocuments, setFilteredDocuments] = useState(documents.results);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [_action, setAction] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [showUploadZone, setShowUploadZone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const fetcher = useFetcher();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilteredDocuments(
      documents?.results?.filter((doc) =>
        doc.label?.toLowerCase().includes(searchTerm?.toLowerCase())
      )
    );
  }, [documents.results, searchTerm]);

  useEffect(() => {
    if (fetcher?.state === "idle") {
      MessageBox({
        title: "Succès",
        message:
          _action === "upload"
            ? "Fichier(s) téléchargé(s) avec succès!"
            : _action === "update"
            ? "Fichier mis à jour avec succès!"
            : _action === "delete"
            ? "Fichier supprimé avec succès!"
            : "Action terminée avec succès",
        layoutStyle: "macos",
        type: "success",
        onClose: () => {
          resetForm();
        },
      });

      if (fetcher.data?.success) {
        toast({
          title: "Succès",
          description:
            _action === "upload"
              ? "Fichier(s) téléchargé(s) avec succès!"
              : _action === "update"
              ? "Fichier mis à jour avec succès!"
              : _action === "delete"
              ? "Fichier supprimé avec succès!"
              : "Action terminée avec succès",
        });
        if (_action === "upload") {
          resetForm();
        }
      }
    } else if (fetcher.data?.error) {
      toast({
        title: "Erreur",
        description: `Erreur: ${fetcher.data?.error}`,
        variant: "destructive",
      });
      resetForm();
    }
  }, [fetcher.state, fetcher.data, _action, toast]);

  const resetForm = () => {
    if (formRef.current) {
      formRef.current.reset();
      setSelectedFiles([]);
      setUploadProgress({});
    }
  };

  const handleFilesSelect = (files: FileList) => {
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 5MB en octets
    const tooLargeFiles = Array.from(files).filter(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (tooLargeFiles.length > 0) {
      setError(
        `Un ou plusieurs fichiers dépassent la taille maximale autorisée de ${
          MAX_FILE_SIZE / 1024 / 1024
        } MB.`
      );
      setShowUploadZone(false); // Masquer la zone de téléversement
      return;
    }

    const validFiles = Array.from(files).map((file) => ({
      file,
      progress: 0,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const resetError = () => {
    setError(null);
    setShowUploadZone(true);
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

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("_action", "upload");
    setAction("upload");

    selectedFiles.forEach((fileData, index) => {
      formData.append(`files`, fileData.file);
    });

    const upload = fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
      action: "/api/media",
    });

    // Simulate progress for each file
    selectedFiles.forEach((_, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) {
          clearInterval(interval);
          progress = 90;
        }
        setUploadProgress((prev) => ({
          ...prev,
          [index]: Math.round(progress),
        }));
      }, 200);

      upload.then(() => {
        clearInterval(interval);
        setUploadProgress((prev) => ({ ...prev, [index]: 100 }));
      });
    });
  };

  const handleDelete = (documentId: string) => {
    setDocumentToDelete(documentId);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      const formData = new FormData();
      formData.append("_action", "delete");
      setAction("delete");
      formData.append("documentId", documentToDelete);
      fetcher.submit(formData, {
        method: "post",
        encType: "multipart/form-data",
        action: "/api/media",
      });
      setDocumentToDelete(null);
    }
  };

  const toggleView = () => {
    const newView = !isGridView;
    setIsGridView(newView);
    searchParams.set("view", newView ? "grid" : "list");
    setSearchParams(searchParams);
  };

  const handleQuickLabelChange = (documentId: string, newLabel: string) => {
    const formData = new FormData();
    formData.append("_action", "update");
    formData.append("documentId", documentId);
    formData.append("label", newLabel);
    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
      action: "/api/media",
    });
  };

  const updateDocLabel = (docId: string, newLabel: string) => {
    setFilteredDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === docId ? { ...doc, label: newLabel } : doc
      )
    );
  };

  return (
    <ToastProvider>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          Gestionnaire de médias
        </h1>

        {can?.upload && (
          <Button
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="w-full sm:w-auto h-12 text-base mb-6"
          >
            {showUploadZone
              ? "Masquer la zone de téléchargement"
              : "Télécharger des fichiers"}
          </Button>
        )}

        {error && (
          <div className="text-center">
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <Button onClick={resetError}>Ressayer</Button>
          </div>
        )}

        {can?.upload && showUploadZone && (
          <Card className="mb-8">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">
                Télécharger des fichiers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Form ref={formRef} onSubmit={handleUpload} className="space-y-6">
                <FileUploadZone
                  maxSize="1MB"
                  multiple={true}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  onFileSelect={handleFilesSelect}
                />

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {selectedFiles?.map((fileData, index) => (
                      <FilePreview
                        key={index}
                        file={fileData.file}
                        progress={uploadProgress[index] || 0}
                        previewUrl={fileData.previewUrl}
                        onRemove={() => removeFile(index)}
                      />
                    ))}
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <Button
                    type="submit"
                    className="w-full h-12 text-base"
                    disabled={fetcher.state !== "idle"}
                  >
                    {fetcher.state !== "idle"
                      ? "Téléchargement..."
                      : `Télécharger ${selectedFiles.length} fichier${
                          selectedFiles.length === 1 ? "" : "s"
                        }`}
                  </Button>
                )}
              </Form>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Label htmlFor="view-toggle" className="text-base">
              Vue :
            </Label>
            <Switch
              id="view-toggle"
              checked={isGridView}
              onCheckedChange={toggleView}
            />
            <span className="text-xl">
              {isGridView ? <GridIcon /> : <ListIcon />}
            </span>
          </div>
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Rechercher des fichiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base w-full"
            />
          </div>
        </div>

        {documents.results.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 mb-2">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (documents.page - 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={documents.page === 1}
              className="w-full sm:w-auto h-12 text-base"
            >
              Précédent
            </Button>
            <span className="text-base">
              Page {documents.page} / {documents.totalResults} media(s)
            </span>
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (documents.page + 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={documents.page === documents.totalPages}
              className="w-full sm:w-auto h-12 text-base"
            >
              Suivant
            </Button>
          </div>
        )}

        {isGridView ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredDocuments?.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center mb-4 relative group">
                    {doc.file.meta.mimeType.startsWith("image/") ? (
                      <img
                        src={doc.file.url}
                        alt={doc.label}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : doc.file.meta.mimeType.startsWith("video/") ? (
                      <div
                        className="relative cursor-pointer w-full h-full"
                        onClick={() => {
                          if (can?.view) {
                            setPreviewDocument(doc);
                          }
                        }}
                      >
                        <video
                          src={doc.file.url}
                          className="max-w-full max-h-full object-contain"
                          preload="metadata"
                        >
                          <track kind="captions" />
                        </video>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <PlayCircle className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center truncate">
                        <FileIcon className="w-16 h-16 text-gray-400" />
                        <span className="mt-3 text-sm text-gray-500 uppercase truncate">
                          {doc.file.meta.extension || "fichier"}
                        </span>
                      </div>
                    )}
                  </div>

                  {can?.edit && (
                  <Input
                    value={doc.label}
                    onChange={(e) => updateDocLabel(doc.id, e.target.value)}
                    onBlur={(e) =>
                      handleQuickLabelChange(doc.id, e.target.value)
                    }
                      className="mb-3 h-12 text-base"
                    />
                  )}
                  <p className="text-base text-gray-500 mb-1 truncate">
                    {doc.file.meta.mimeType}
                  </p>
                  <p className="text-base text-gray-500 mb-3">
                    {convertFileSize(doc.file.meta.size)}
                  </p>
                  <div className="border-t pt-3 mb-3">
                    <p className="flex items-center text-base mt-2">
                      <ArrowBigRightIcon className="mr-2 h-5 w-5" />{" "}
                      {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                    </p>
                    {doc.status === "permanent" && (
                      <p className="flex items-center text-base mt-2">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        {doc.usedBy.length} utilisation(s)
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 text-base"
                      onClick={() => {
                        if (can?.view) {
                          setPreviewDocument(doc);
                        }
                      }}
                    >
                      <EyeIcon className="mr-2 h-5 w-5" />
                    </Button>

                    {can?.delete && (
                      <Button
                        variant="destructive"
                        className="flex-1 h-12 text-base"
                        disabled={
                          doc.status === "permanent" || doc.usedBy.length > 0
                        }
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="mr-2 h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Aperçu</TableHead>
                  <TableHead className="text-base">Étiquette</TableHead>
                  <TableHead className="text-base hidden md:table-cell">
                    Type de fichier
                  </TableHead>
                  <TableHead className="text-base hidden sm:table-cell">
                    Taille
                  </TableHead>
                  <TableHead className="text-base">Par</TableHead>
                  <TableHead className="text-base hidden lg:table-cell">
                    Usage
                  </TableHead>
                  <TableHead className="text-base">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments?.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="relative">
                        {doc.file.meta.mimeType.startsWith("image/") ? (
                          <img
                            src={doc.file.url}
                            alt={doc.label}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : doc.file.meta.mimeType.startsWith("video/") ? (
                          <div
                            className="relative cursor-pointer"
                            onClick={() => {
                              if (can?.view) {
                                setPreviewDocument(doc);
                              }
                            }}
                          >
                            <video
                              src={doc.file.url}
                              className="w-16 h-16 object-cover rounded"
                              preload="metadata"
                            >
                              <track kind="captions" />
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
                              <PlayCircle className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-16 h-16">
                            <FileIcon className="w-12 h-12 text-gray-400" />
                            <span className="text-xs text-gray-500 uppercase truncate">
                              {doc.file.meta.extension || "fichier"}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {can?.edit && (
                        <Input
                          value={doc.label}
                          onChange={(e) => updateDocLabel(doc.id, e.target.value)}
                          onBlur={(e) =>
                            handleQuickLabelChange(doc.id, e.target.value)
                          }
                          className="h-12 text-base min-w-[200px]"
                        />
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base truncate">
                      {doc.file.meta.extension}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {convertFileSize(doc.file.meta.size)}
                    </TableCell>
                    <TableCell className="text-base">
                      {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {doc.status === "permanent" && doc.usedBy.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-12 text-base px-3"
                          onClick={() => {
                            if (can?.view) {
                              setPreviewDocument(doc);
                            }
                          }}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Button>
                       
                       {can?.delete && (
                       <Button
                          variant="destructive"
                          className="h-12 text-base px-3"
                          disabled={
                            doc.status === "permanent" || doc.usedBy.length > 0
                          }
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {documents.totalResults < 1 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-xl text-gray-500">
              Aucun fichier trouvé. Veuillez télverser des fichiers.
            </p>
          </div>
        ) : null}

        {documents.results.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 mb-2">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (documents.page - 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={documents.page === 1}
              className="w-full sm:w-auto h-12 text-base"
            >
              Précédent
            </Button>
            <span className="text-base">
              Page {documents.page} / {documents.totalResults} media(s)
            </span>
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (documents.page + 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={documents.page === documents.totalPages}
              className="w-full sm:w-auto h-12 text-base"
            >
              Suivant
            </Button>
          </div>
        )}

        <AlertDialog
          open={!!documentToDelete}
          onOpenChange={() => setDocumentToDelete(null)}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">
                Êtes-vous sûr de vouloir supprimer ce fichier ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Cette action ne peut pas être annulée. Cela supprimera
                définitivement le fichier.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="h-12 text-base">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="h-12 text-base"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={!!previewDocument}
          onOpenChange={() => setPreviewDocument(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">
                {previewDocument?.label || "Aperçu du fichier"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
              {previewDocument?.file.meta.mimeType.startsWith("image/") ? (
                <img
                  src={previewDocument.file.url}
                  alt={previewDocument.label || "Aperçu"}
                  className="max-w-full max-h-full object-contain"
                />
              ) : previewDocument?.file.meta.mimeType.startsWith("video/") ? (
                <video
                  src={previewDocument.file.url}
                  controls
                  preload="metadata"
                  playsInline
                  className="max-w-full max-h-[70vh] object-contain"
                >
                  <track kind="captions" src="" srcLang="fr" label="Français" />
                  Votre navigateur ne prend pas en charge la lecture de vidéos.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
                  <FileIcon className="w-20 h-20 text-muted-foreground mb-4" />
                  <a
                    href={previewDocument?.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium text-lg"
                  >
                    Télécharger {previewDocument?.label || "le fichier"}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground px-4 text-center">
              <p className="space-x-2 text-[11px] xs:text-xs text-muted-foreground font-semibold sm:mb-6">
                <span className="inline-flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(previewDocument?.updatedAt).toLocaleString()}
                  <span>
                    <Dot />
                  </span>
                </span>
                <span className="inline-flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {previewDocument?.owner?.firstName}{" "}
                  {previewDocument?.owner?.lastName}
                  <span>
                    <Dot />
                  </span>
                </span>
                <span className="inline-flex items-center">
                  <Upload className="h-4 w-4 mr-1" />
                  {previewDocument?.uploadedBy?.firstName}{" "}
                  {previewDocument?.uploadedBy?.lastName}
                  <span>
                    <Dot />
                  </span>
                </span>
                <span className="inline-flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Utilisé{" "}
                  {previewDocument?.status === "permanent"
                    ? previewDocument?.usedBy.length
                    : 0}{" "}
                  fois
                  <span>
                    {" "}
                    <Dot />
                  </span>
                </span>
                <span className="inline-flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {previewDocument?.availableFor?.access === "all"
                    ? "Tous"
                    : "Restreint"}
                </span>
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <ToastViewport className="fixed bottom-0 right-0 flex flex-col gap-2 p-4 sm:p-6 max-w-[90vw] sm:max-w-[420px]" />
      </div>
    </ToastProvider>
  );
}
