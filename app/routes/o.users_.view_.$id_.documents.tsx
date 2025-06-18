/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunction } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  Form,
  useSearchParams,
  useFetcher,
  useNavigate,
} from "@remix-run/react";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  FileIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  EyeIcon,
  Trash2,
  TrendingUp,
  PlayCircle,
  ArrowBigRightIcon,
  Eye,
  Dot,
  Upload,
  User,
  Calendar,
} from "lucide-react";
import { documentService } from "~/services/document.service.server";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { ToastProvider } from "~/components/ui/toast";
import { useState, useEffect, useRef } from "react";
import { Input } from "~/components/ui/input";
import { FilePreview } from "~/components/ui/file-preview";
import { FileUploadZone } from "~/components/ui/file-upload-zone";
import { useToast } from "~/hooks/use-toast";
import { convertFileSize } from "~/core/utils/media/convert.filesize";
import MessageBox from "~/components/val/system-message";
import { userService } from "~/services/user.service.server";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { DocumentActions, UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await authService.requireUser(request, {condition: UserActions.ViewOwnOnProfileDocumentInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentPosition and positionsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const filter = searchParams.get("filter") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 5;

  const documents = await documentService.readManyPaginated(
    {
      $or: [
        { owner: currentUser.id },
        { "availableFor.users": currentUser.id },
        //{ "availableFor.access": "all" },
      ],
      label: { $regex: filter, $options: "i" },
    },
    {
      page,
      limit,
      sortBy: "updatedAt:desc",
      populate:
        "owner,uploadedBy,availableFor.users,availableFor.departments,availableFor.teams,availableFor.positions,availableFor.hourGroups",
    }
  );

  
  const can =  {
    view: await authService.can(currentUser?.id as string, UserActions.View),
    documents: {
      view: await authService.can(currentUser?.id as string, {any: [DocumentActions.View]}),
      delete: await authService.can(currentUser?.id as string, {any: [DocumentActions.Delete]}),
      upload: await authService.can(currentUser?.id as string, {any: [DocumentActions.Upload]}),
      edit: await authService.can(currentUser?.id as string, {any: [DocumentActions.Edit]}),
    }
  }

  return Response.json({ documents, page, limit, user, can });
};

interface FileWithPreview {
  file: File;
  progress: number;
  previewUrl?: string;
}

export default function UserDocumentsPage() {
  const navigate = useNavigate();
  const { documents, user , can} = useLoaderData<typeof loader>();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDocuments, setFilteredDocuments] = useState(documents.results);
  const [_action, setAction] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [showUploadZone, setShowUploadZone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const fetcher = useFetcher();

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
    const newFiles = Array.from(files).map((file) => ({
      file,
      progress: 0,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-6 max-w-6xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <CompactUserHeader user={user}  can={can}/>
        <h1 className="text-3xl font-bold mt-4 text-center">
          Documents et Fichiers
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <ToastProvider>
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 justify-center text-center">
            {can?.documents?.upload && (
            <Button
              onClick={() => setShowUploadZone(!showUploadZone)}
              className="w-full sm:w-auto h-12 text-base mb-6"
            >
              {showUploadZone
                ? "Masquer la zone de téléchargement"
                : "Télécharger des fichiers"}
            </Button>)}

            {can?.documents?.upload && showUploadZone && (
              <Card className="mb-8 text-center justify-center">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl">
                    Télécharger des fichiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <Form
                    ref={formRef}
                    onSubmit={handleUpload}
                    className="space-y-6"
                  >
                    <FileUploadZone
                      maxSize="5MB"
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

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6 mx-auto">
              <div className="relative w-full sm:w-auto sm:min-w-[300px] text-center">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Rechercher des fichiers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base w-full  rounded-full border-2 border-primary"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                            if(can?.documents.view){
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

                    {can?.documents.edit && (
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

                      {can?.documents?.view && (
                      <Button
                        variant="outline"
                        className="flex-1 h-12 text-base"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        <EyeIcon className="mr-2 h-5 w-5" />
                      </Button>
                      )}

                      {can?.documents?.delete && (
                      <Button
                        variant="destructive"
                        className="flex-1 h-12 text-base"
                        disabled={
                          doc.status === "permanent" || doc.usedBy.length > 0 || true
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
          </div>
        </ToastProvider>
      </motion.div>

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
    </motion.div>
  );
}
