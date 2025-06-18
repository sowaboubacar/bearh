import { useState, useEffect } from "react";
import { LoaderFunction, ActionFunction, json } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  Form,
  useFetcher,
  useSearchParams,
  useNavigation,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import {
  Grid,
  List,
  Search,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { noteService } from "~/services/note.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { getFirstImage } from "~/core/utils/media/attachments";
import { NoteActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [NoteActions.ListOwn, NoteActions.List] }
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const filter = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  // Create base query for shared notes
  let query: any = {
    title: { $regex: filter, $options: "i" },
    $or: [
      { visibility: "Public" },
      { "sharedWith.users": currentUser.id }
    ]
  };

  // If user only has ListOwn permission, ensure they can only see shared notes
  const hasFullListAccess = await authService.can(currentUser.id, NoteActions.List);
  if (!hasFullListAccess) {
    query = {
      $and: [
        query,
        {
          $or: [
            { "sharedWith.users": currentUser.id },
            { visibility: "Public" }
          ]
        }
      ]
    };
  }

  const notes = await noteService.readManyPaginated(query, {
    page,
    limit,
    sortBy: "updatedAt:desc",
    populate: "author,attachments,sharedWith"
  });

  const can = {
    view: await authService.can(currentUser.id, {
      any: [NoteActions.ViewOwn, NoteActions.View]
    }),
    edit: await authService.can(currentUser.id, {
      any: [NoteActions.EditOwn, NoteActions.Edit]
    }),
    delete: await authService.can(currentUser.id, {
      any: [NoteActions.DeleteOwn, NoteActions.Delete]
    })
  };

  return Response.json({ notes, can });
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await noteService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing note action:", error);
    throw json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur la note.",
      },
      { status: 500 }
    );
  }
};

export default function NoteList() {
  const {
    notes,
    search,
    view: initialView,
    page,
    limit,
  } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const [view, setView] = useState(initialView);
  const [isClient, setIsClient] = useState(false);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setView((searchParams.get("view") as "grid" | "list") || initialView);
  }, [searchParams, initialView]);

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
    setOpenDialog(null);
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setIsProcessing(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams((prev) => {
      prev.set("search", searchTerm);
      return prev;
    });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams((prev) => {
      prev.set("view", newView);
      return prev;
    });
  };


  const getAuthorName = (author) => {
    if (!author) return "Unknown Author";
    return (
      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
      "Unknown Author"
    );
  };

  if (!isClient) {
    return null; // or a loading indicator
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Notes Partagés avec moi</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full sm:w-auto sm:flex-1"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des notes..."
            defaultValue={search}
            className="h-12 text-base"
          />
          <Button type="submit" className="h-12 w-12 flex-shrink-0">
            <Search className="h-5 w-5" />
          </Button>
        </Form>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex gap-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              onClick={() => handleViewChange("grid")}
              className="flex-1 sm:flex-none h-12"
            >
              <Grid className="h-5 w-5" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              onClick={() => handleViewChange("list")}
              className="flex-1 sm:flex-none h-12"
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={limit} />
      ) : notes.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {notes.results.map((note) => (
              <Card key={note.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-lg font-bold">{note.title}</span>
                  </CardTitle>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={getFirstImage(note.attachments)?.file?.url}
                      alt={getFirstImage(note.attachments)?.label || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  <p className="text-base text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Auteur : {getAuthorName(note.author)}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Créée le : {new Date(note.createdAt).toLocaleString()}
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-between gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    <Link prefetch="intent" to={`/o/note/view/${note.id}`}>
                      <Eye className="mr-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    <Link prefetch="intent" to={`/o/note/edit/${note.id}`}>
                      <Edit className="mr-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Dialog
                    open={openDialog === note.id}
                    onOpenChange={(open) =>
                      setOpenDialog(open ? note.id : null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex-1 h-12 text-base"
                      >
                        <Trash2 className="mr-2 h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          Êtes-vous sûr de vouloir supprimer cette note ?
                        </DialogTitle>
                        <DialogDescription className="text-base">
                          Cette action ne peut pas être annulée.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-3 sm:gap-0">
                        <Button
                          variant="outline"
                          onClick={() => setOpenDialog(null)}
                          className="h-12 text-base"
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(note.id)}
                          disabled={isProcessing}
                          className="h-12 text-base"
                        >
                          {isProcessing ? "Suppression..." : "Supprimer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">
                    Titre
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Auteur
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap">
                    Visibilité
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">
                    Date de création
                  </TableHead>
                  <TableHead className="text-base text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.results.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium text-base">
                      {note.title}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {getAuthorName(note.author)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          note.visibility === "Private"
                            ? "secondary"
                            : note.visibility === "Public"
                            ? "default"
                            : "outline"
                        }
                        className="h-8 text-base px-3 py-1"
                      >
                        {getVisibilityIcon(note.visibility)}
                        <span className="ml-2">{note.visibility}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-base hidden md:table-cell">
                      {new Date(note.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="h-12 text-base px-3"
                        >
                          <Link
                            prefetch="intent"
                            to={`/o/note/view/${note.id}`}
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="h-12 text-base px-3"
                        >
                          <Link
                            prefetch="intent"
                            to={`/o/note/edit/${note.id}`}
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                        <Dialog
                          open={openDialog === note.id}
                          onOpenChange={(open) =>
                            setOpenDialog(open ? note.id : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="h-12 text-base px-3"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-xl">
                                Êtes-vous sûr de vouloir supprimer cette note ?
                              </DialogTitle>
                              <DialogDescription className="text-base">
                                Cette action ne peut pas être annulée.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-3 sm:gap-0">
                              <Button
                                variant="outline"
                                onClick={() => setOpenDialog(null)}
                                className="h-12 text-base"
                              >
                                Annuler
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(note.id)}
                                disabled={isProcessing}
                                className="h-12 text-base"
                              >
                                {isProcessing ? "Suppression..." : "Supprimer"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <NoDataMessage type="notes"  view={view} />
      )}

      {notes.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() =>
              setSearchParams((prev) => {
                prev.set("page", (page - 1).toString());
                return prev;
              })
            }
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(notes.totalResults / limit)}
          </span>
          <Button
            onClick={() =>
              setSearchParams((prev) => {
                prev.set("page", (page + 1).toString());
                return prev;
              })
            }
            disabled={page * limit >= notes.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

