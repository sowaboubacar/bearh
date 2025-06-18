import { useState } from "react";
import { LoaderFunction, ActionFunction } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  Form,
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Grid,
  List,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  
} from "lucide-react";
import { collaboratorVideoService } from "~/services/collaboratorVideo.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { CollaboratorVideoActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [CollaboratorVideoActions.List, CollaboratorVideoActions.ListOwn] }
  });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    // Create base query
    let query: any = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    // If user only has ListOwn permission, filter for their videos
    const hasFullListAccess = await authService.can(currentLoggedUser.id, CollaboratorVideoActions.List);
    if (!hasFullListAccess) {
      query = {
        $and: [
          query,
          {
            $or: [
              { user: currentLoggedUser.id },
              { uploadedBy: currentLoggedUser.id }
            ]
          }
        ]
      };
    }

    const videos = await collaboratorVideoService.readManyPaginated(
      query,
      {
        limit,
        page,
        sortBy: "createdAt:desc",
        populate: "user,uploadedBy,attachments"
      }
    );

    const can = {
      create: await authService.can(currentLoggedUser.id, CollaboratorVideoActions.Create),
      edit: await authService.can(currentLoggedUser.id, { any: [CollaboratorVideoActions.Edit, CollaboratorVideoActions.EditOwn] }),
      delete: await authService.can(currentLoggedUser.id, { any: [CollaboratorVideoActions.Delete, CollaboratorVideoActions.DeleteOwn] }),
      view: await authService.can(currentLoggedUser.id, { any: [CollaboratorVideoActions.View, CollaboratorVideoActions.ViewOwn] }),
    };

    return Response.json({ videos, search, view, page, limit, can });
  } catch (error) {
    console.error("Error fetching collaborator videos:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des unité de connaissances collaborateurs.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [CollaboratorVideoActions.Delete, CollaboratorVideoActions.DeleteOwn]},
  });
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await collaboratorVideoService.deleteOne(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting collaborator video:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la suppression de la unité de connaissance collaborateur.",
      },
      { status: 500 }
    );
  }
};

export default function CollaboratorVideoList() {
  const { videos, search, view, page, limit,can } = useLoaderData<typeof loader>();
  const [isDeleting, setIsDeleting] = useState(false);
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [searchParams, setSearchParams] = useSearchParams();

  const handleDelete = (id: string) => {
    setIsDeleting(true);
    submit({ id }, { method: "delete" });
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ search, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search, view: newView });
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Connaissance des Collaborateurs
        </h1>

        {can?.create && (
        <Button 
          asChild 
          className="w-full sm:w-auto h-11 text-base"
        >
          <Link prefetch="intent" to="/o/collaborator-videos/new">
            <Plus className="mr-2 h-5 w-5" /> 
           Nouvelle Entrée
          </Link>
        </Button>
        )}
      </div>
  
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Form 
          onSubmit={handleSearch} 
          className="flex w-full sm:w-auto items-center gap-2"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des unité de connaissances..."
            defaultValue={search}
            onChange={(e) => setSearchParams({ search: e.target.value, view })}
            className="h-11 text-base w-full sm:w-[300px]"
          />
          <Button 
            type="submit" 
            className="h-11 w-11"
          >
            <Search className="h-5 w-5" />
          </Button>
        </Form>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => handleViewChange("grid")}
            className="flex-1 sm:flex-none h-11"
          >
            <Grid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => handleViewChange("list")}
            className="flex-1 sm:flex-none h-11"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={limit} />
      ) : videos.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {videos.results.map((video) => (
              <Card key={video.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {video.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-base text-muted-foreground">
                    {video.description}
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-between gap-2">
                  {can?.view && (
                     <Button 
                    asChild 
                    variant="outline"
                    className="h-11 w-11"
                  >
                    <Link
                      prefetch="intent"
                      to={`/o/collaborator-videos/view/${video.id}`}
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </Button>
                  )}

                  {can?.edit && (
                     <Button 
                    asChild 
                    variant="outline"
                    className="h-11 w-11"
                  >
                    <Link
                      prefetch="intent"
                      to={`/o/collaborator-videos/edit/${video.id}`}
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                  </Button>
                  )}
                 
                 {can?.delete && (
                      <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        className="h-11 w-11"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">
                          Êtes-vous sûr de vouloir supprimer cette unité de connaissance ?
                        </DialogTitle>
                        <DialogDescription className="text-base">
                          Cette action ne peut pas être annulée.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                          <Button 
                            variant="outline"
                            className="h-11 text-base"
                          >
                            Annuler
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(video.id)}
                          disabled={isDeleting}
                          className="h-11 text-base"
                        >
                          {isDeleting ? "Suppression..." : "Supprimer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                 )}
              
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Titre</TableHead>
                  <TableHead className="text-base hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.results.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium text-base">
                      {video.title}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {video.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">

                        {can?.view && (
                           <Button 
                          asChild 
                          variant="outline" 
                          className="h-11 w-11"
                        >
                          <Link
                            prefetch="intent"
                            to={`/o/collaborator-videos/view/${video.id}`}
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                        </Button>
                        )}
                       {can?.edit && (
                         <Button 
                          asChild 
                          variant="outline"
                          className="h-11 w-11"
                        >
                          <Link
                            prefetch="intent"
                            to={`/o/collaborator-videos/edit/${video.id}`}
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                       )}
                       {can?.delete && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              className="h-11 w-11"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl">
                                Êtes-vous sûr de vouloir supprimer cette unité de connaissance ?
                              </DialogTitle>
                              <DialogDescription className="text-base">
                                Cette action ne peut pas être annulée.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                              <DialogClose asChild>
                                <Button 
                                  variant="outline"
                                  className="h-11 text-base"
                                >
                                  Annuler
                                </Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(video.id)}
                                disabled={isDeleting}
                                className="h-11 text-base"
                              >
                                {isDeleting ? "Suppression..." : "Supprimer"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                       )}
                        
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <NoDataMessage
          type="Entrée"
          createLink="/o/collaborator-videos/new"
          view={view}
        />
      )}
  
      {videos.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            onClick={() =>
              setSearchParams({ search, view, page: (page - 1).toString() })
            }
            disabled={page === 1}
            className="w-full sm:w-auto h-11 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(videos.totalResults / limit)}
          </span>
          <Button
            onClick={() =>
              setSearchParams({ search, view, page: (page + 1).toString() })
            }
            disabled={page * limit >= videos.totalResults}
            className="w-full sm:w-auto h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}
