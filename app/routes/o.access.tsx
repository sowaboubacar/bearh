import { type LoaderFunction, type ActionFunction } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useFetcher,
  Form,
  useSearchParams,
  useNavigation,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { accessService } from "~/services/access.service.server";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { AccessActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: AccessActions.List});
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = url.searchParams.get("view") || "grid";
  const limit = 20;

  try {
    const accesses = await accessService.readManyPaginated(
      { name: { $regex: searchTerm, $options: "i" } },
      {
        limit,
        page,
        sortBy: "name:asc",
      }
    );

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, AccessActions.List),
      create: await authService.can(currentLoggedUser?.id as string, AccessActions.Create),
      delete: await authService.can(currentLoggedUser?.id as string, AccessActions.Delete),
      view: await authService.can(currentLoggedUser?.id as string, AccessActions.View),
      edit: await authService.can(currentLoggedUser?.id as string, AccessActions.Edit),
    }

    return Response.json({ accesses, searchTerm, page, view, can });
  } catch (error) {
    console.error("Error fetching accesses:", error);
    throw Response.json(
      { message: "Une erreur est survenue lors de la récupération des accès." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
 await authService.requireUser(request, {condition: AccessActions.Delete});
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await accessService.deleteOne({id});
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting access:", error);
    throw Response.json(
      { message: "Une erreur est survenue lors de la suppression de l'accès." },
      { status: 500 }
    );
  }
};

export default function AccessListPage() {
  const {
    accesses,
    searchTerm: initialSearchTerm,
    page,
    view: initialView,
    can
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const view = searchParams.get("view") || initialView;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ search: searchTerm, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search: searchTerm, view: newView });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Liste des Accès</h1>
        {can.create && (
          <Button 
            onClick={() => navigate("/o/access/new")}
            className="h-10 text-sm sm:h-11 sm:text-base w-full sm:w-auto"
          >
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
          Ajouter un accès
        </Button>
        )}
      </div>
  
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <Form onSubmit={handleSearch} className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Rechercher un accès..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 sm:pl-11 h-10 sm:h-11 text-sm sm:text-base w-full sm:w-[300px]"
          />
        </Form>
        <div className="flex space-x-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => handleViewChange("grid")}
            className="h-10 w-10 sm:h-11 sm:w-11"
          >
            <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => handleViewChange("list")}
            className="h-10 w-10 sm:h-11 sm:w-11"
          >
            <List className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={view as "grid" | "list"} itemCount={20} />
      ) : accesses.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {accesses.results.map((access) => (
              <Card key={access.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">{access.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {access.description || "Aucune description"}
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-end space-x-2">
                  {can.view && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/o/access/view/${access.id}`)}
                      className="h-10 w-10 sm:h-11 sm:w-11"
                  >
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  )}
                  {can.edit && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/o/access/edit/${access.id}`)}
                    className="h-10 w-10 sm:h-11 sm:w-11"
                  >
                      <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  )}
                  {can.delete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-10 w-10 sm:h-11 sm:w-11"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-[425px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg sm:text-xl">
                          Êtes-vous sûr ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm sm:text-base">
                          Cette action ne peut pas être annulée. Cela supprimera
                          définitivement l'accès et toutes les données associées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-10 text-sm sm:h-11 sm:text-base">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="h-10 text-sm sm:h-11 sm:text-base"
                          onClick={() => {
                            fetcher.submit(
                              { id: access.id },
                              { method: "delete", action: "/o/access" }
                            );
                          }}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm sm:text-base">Nom</TableHead>
                  <TableHead className="text-sm sm:text-base hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-sm sm:text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesses.results.map((access) => (
                  <TableRow key={access.id}>
                    <TableCell className="font-medium text-sm sm:text-base">
                      {access.name}
                    </TableCell>
                    <TableCell className="text-sm sm:text-base hidden sm:table-cell">
                      {access.description || "Aucune description"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {can.view && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/o/access/view/${access.id}`)}
                          className="h-10 w-10 sm:h-11 sm:w-11"
                        >
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        )}
                        {can.edit && (
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/o/access/edit/${access.id}`)}
                          className="h-10 w-10 sm:h-11 sm:w-11"
                        >
                          <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        )}
                        {can.delete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-10 w-10 sm:h-11 sm:w-11"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg sm:text-xl">
                                Êtes-vous sûr ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-sm sm:text-base">
                                Cette action ne peut pas être annulée. Cela
                                supprimera définitivement l'accès et toutes les
                                données associées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="h-10 text-sm sm:h-11 sm:text-base">
                                Annuler
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="h-10 text-sm sm:h-11 sm:text-base"
                                onClick={() => {
                                  fetcher.submit(
                                    { id: access.id },
                                    { method: "delete", action: "/o/access" }
                                  );
                                }}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
          type="accès"
          createLink="/o/access/new"
          view={view as "grid" | "list"}
        />
      )}
  
      {accesses.results.length > 0 && (
        <div className="mt-6 flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              setSearchParams({
                search: searchTerm,
                view,
                page: (page - 1).toString(),
              })
            }
            disabled={page === 1}
            className="h-10 text-sm sm:h-11 sm:text-base"
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setSearchParams({
                search: searchTerm,
                view,
                page: (page + 1).toString(),
              })
            }
            disabled={accesses.results.length < 20}
            className="h-10 text-sm sm:h-11 sm:text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
  
  
}

