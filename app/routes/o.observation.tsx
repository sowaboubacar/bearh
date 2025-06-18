import { useState } from "react";
import { LoaderFunction, ActionFunction } from "@remix-run/node";
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
  ThumbsUp,
  ThumbsDown,
  
  Badge,
} from "lucide-react";
import { observationService } from "~/services/observation.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import {
  ObservationActions,
} from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [ObservationActions.ListOwn, ObservationActions.List] }
  });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    // Create base query with search filter
    let query: any = {
      $or: [
        { content: { $regex: search, $options: "i" } },
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
        { "author.firstName": { $regex: search, $options: "i" } },
        { "author.lastName": { $regex: search, $options: "i" } },
      ],
    };

    // If user only has ListOwn permission, filter for their observations
    const hasFullListAccess = await authService.can(currentUser.id, ObservationActions.List);
    if (!hasFullListAccess) {
      query = {
        $and: [
          query,
          { author: currentUser.id }
        ]
      };
    }

    const observations = await observationService.readManyPaginated(
      query,
      { 
        limit, 
        page, 
        sortBy: "date:desc", 
        populate: "user,author" 
      }
    );

    const can = {
      create: await authService.can(currentUser.id, ObservationActions.Create),
      edit: await authService.can(currentUser.id, {
        any: [ObservationActions.Edit, ObservationActions.EditOwn]
      }),
      delete: await authService.can(currentUser.id, {
        any: [ObservationActions.Delete, ObservationActions.DeleteOwn]
      }),
      view: await authService.can(currentUser.id, {
        any: [ObservationActions.View, ObservationActions.ViewOwn]
      })
    };

    return Response.json({ observations, can, search, view, page, limit });
  } catch (error) {
    console.error("Error fetching observations:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération des observations" },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any:[ObservationActions.Delete, ObservationActions.DeleteOwn]}});
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await observationService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing observation action:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur l'observation.",
      },
      { status: 500 }
    );
  }
};

export default function ObservationList() {
  const {
    observations,
    search,
    view: initialView,
    page,
    limit,
    can,
  } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const view = (searchParams.get("view") as "grid" | "list") || initialView;

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams({ search: searchTerm, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search, view: newView });
  };

  const getTypeIcon = (type: string) => {
    return type === "Positive" ? (
      <ThumbsUp className="h-4 w-4 text-green-500" />
    ) : (
      <ThumbsDown className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Remarques
        </h1>

        {can?.create && (
          <Button asChild className="w-full sm:w-auto h-12 text-base">
            <Link prefetch="intent" to="/o/observation/new">
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Remarque
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full sm:w-auto sm:flex-1"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des remarques..."
            defaultValue={search}
            className="h-12 text-base"
          />
          <Button type="submit" className="h-12 w-12 flex-shrink-0">
            <Search className="h-5 w-5" />
          </Button>
        </Form>

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

      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={limit} />
      ) : observations.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {observations.results.map((observation) => (
              <Card key={observation.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-lg font-bold">
                    <span>
                      {observation.user.firstName} {observation.user.lastName}
                    </span>
                    <Badge
                      variant={
                        observation.type === "Positive"
                          ? "default"
                          : "destructive"
                      }
                      className="h-8 text-base px-3 py-1"
                    >
                      {getTypeIcon(observation.type)}
                      <span className="ml-2">{observation.type}</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  <p className="text-base text-muted-foreground line-clamp-2">
                    {observation.content}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Par : {observation.author.firstName}{" "}
                    {observation.author.lastName}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Date : {new Date(observation.createdAt).toLocaleString()}
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-between gap-3">
                  {can?.view && (
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 h-12 text-base"
                    >
                      <Link
                        prefetch="intent"
                        to={`/o/observation/view/${observation.id}`}
                      >
                        <Eye className="mr-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}

                  {can?.edit && (
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 h-12 text-base"
                    >
                      <Link
                        prefetch="intent"
                        to={`/o/observation/edit/${observation.id}`}
                      >
                        <Edit className="mr-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}

                  {can?.delete && (
                    <Dialog>
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
                            Êtes-vous sûr de vouloir supprimer cette remarque ?
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Cette action ne peut pas être annulée.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-3 sm:gap-0">
                          <DialogClose asChild>
                            <Button
                              variant="outline"
                              className="h-12 text-base"
                            >
                              Annuler
                            </Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(observation.id)}
                            disabled={isProcessing}
                            className="h-12 text-base"
                          >
                            {isProcessing ? "Suppression..." : ""}
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
                  <TableHead className="text-base whitespace-nowrap">
                    Employé observé
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap">
                    Type
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">
                    Contenu
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Auteur
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="text-base text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {observations.results.map((observation) => (
                  <TableRow key={observation.id}>
                    <TableCell className="font-medium text-base">
                      {observation.user.firstName} {observation.user.lastName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          observation.type === "Positive"
                            ? "default"
                            : "destructive"
                        }
                        className="h-8 text-base px-3 py-1"
                      >
                        {getTypeIcon(observation.type)}
                        <span className="ml-2">{observation.type}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate hidden md:table-cell text-base">
                      {observation.content}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {observation.author.firstName}{" "}
                      {observation.author.lastName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {new Date(observation.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.view && (
                          <Button
                            asChild
                            variant="outline"
                            className="h-12 text-base px-3"
                          >
                            <Link
                              prefetch="intent"
                              to={`/o/observation/view/${observation.id}`}
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                          </Button>
                        )}

                        {can?.edit && (
                          <Button
                            asChild
                            variant="outline"
                            className="h-12 text-base px-3"
                          >
                            <Link
                              prefetch="intent"
                              to={`/o/observation/edit/${observation.id}`}
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
                                className="h-12 text-base px-3"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle className="text-xl">
                                  Êtes-vous sûr de vouloir supprimer cette
                                  remarque ?
                                </DialogTitle>
                                <DialogDescription className="text-base">
                                  Cette action ne peut pas être annulée.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-3 sm:gap-0">
                                <DialogClose asChild>
                                  <Button
                                    variant="outline"
                                    className="h-12 text-base"
                                  >
                                    Annuler
                                  </Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(observation.id)}
                                  disabled={isProcessing}
                                  className="h-12 text-base"
                                >
                                  {isProcessing ? "Suppression..." : ""}
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
          type="observations"
          createLink="/o/observation/new"
          view={view}
        />
      )}

      {observations.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() =>
              setSearchParams({ search, view, page: (page - 1).toString() })
            }
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(observations.totalResults / limit)}
          </span>
          <Button
            onClick={() =>
              setSearchParams({ search, view, page: (page + 1).toString() })
            }
            disabled={page * limit >= observations.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
