import { type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, Form, useSearchParams, useNavigation, Link, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
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
import { positionService } from "~/services/position.service.server";
import { LayoutGrid, List, Plus, Search, Trash2, Edit , Info, Users } from 'lucide-react';
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { getFirstImage } from "~/core/utils/media/attachments";
import { authService } from "~/services/auth.service.server";
import {
  DepartmentActions,
  PositionActions,
} from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser =  await authService.requireUser(request, {condition: {any: [PositionActions.List]}})
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = url.searchParams.get("view") as "grid" | "list" || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;

  try {
    const positions = await positionService.readManyPaginated(
      { title: { $regex: search, $options: "i" } },
      {
        limit,
        page,
        sortBy: "updatedAt:asc",
        populate: 'access,attachments',
      }
    );
    const can = {
      create: await authService.can(currentLoggedUser?.id as string, PositionActions.Create ),
      delete: await authService.can(currentLoggedUser?.id as string, PositionActions.Delete ),
      edit: await authService.can(currentLoggedUser?.id as string, PositionActions.Edit ),
      view: await authService.can(currentLoggedUser?.id as string, PositionActions.View ),
    }
    return Response.json({ positions, search, view, page, limit,can });
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la récupération des postes." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request,{condition: {any:[PositionActions.Delete]}});
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await positionService.deleteOne(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting position:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la suppression du poste." }, { status: 500 });
  }
};

export default function PositionListPage() {
  const { positions, search, view: initialView, page, limit,can } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const view = searchParams.get("view") as "grid" | "list" || initialView;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams({ search: searchTerm, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search, view: newView });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Liste des Postes
        </h1>
        {can?.create && (
        <Button 
          asChild 
          className="w-full sm:w-auto h-12 text-base"
        >
          <Link prefetch="intent" to="/o/positions/new">
            <Plus className="mr-2 h-5 w-5" /> 
            Ajouter un poste
          </Link>
        </Button>
        )}
      </div>
  
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Form 
          onSubmit={handleSearch} 
          className="relative w-full sm:w-auto sm:flex-1 max-w-xl"
        >
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            name="search"
            placeholder="Rechercher un poste..."
            defaultValue={search}
            className="pl-10 h-12 text-base"
          />
        </Form>
  
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => handleViewChange("grid")}
            className="flex-1 sm:flex-none h-12 px-4"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => handleViewChange("list")}
            className="flex-1 sm:flex-none h-12 px-4"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={limit} />
      ) : positions.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {positions.results.map((position) => (
              <Card key={position.id} className="flex flex-col">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl font-bold mb-4">
                    {position.title}
                  </CardTitle>
                  {position.attachments.length > 0 && (
                    <img 
                      src={getFirstImage(position.attachments)?.file?.url} 
                      alt={getFirstImage(position.attachments)?.label || ''} 
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                  <p className="text-base text-muted-foreground">
                    {position.description || "Aucune description"}
                  </p>
                  <div className="mt-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-base">{position.members.length} membres</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex flex-wrap gap-2">
                  {can?.view && (
                     <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/positions/view/${o=position.id}`)}
                  >
                    <Info className="h-5 w-5 mr-2" /> 
                  </Button>
                  )}
                 {can?.edit && (
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/positions/edit/${position.id}`)}
                  >
                    <Edit className="h-5 w-5 mr-2" /> 
                  </Button>
                 )}
                  {can?.delete && (
                       <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 text-base"
                      >
                        <Trash2 className="h-5 w-5 mr-2" /> 
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-[425px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">
                          Êtes-vous sûr ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                          Cette action ne peut pas être annulée. Cela supprimera définitivement la fiche.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="h-12 text-base">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            fetcher.submit(
                              { id: position.id },
                              { method: "delete", action: "/o/positions" }
                            );
                          }}
                          className="h-12 text-base"
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
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">Titre</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Pièces Jointes</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Membres</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.results.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium text-base">
                      {position.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base">
                      {position.description || "Aucune description"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {position.attachments?.length}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {position.members?.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.view && (
                            <Button
                          variant="ghost"
                          className="h-12 text-base px-3"
                          asChild
                        >
                          <Link prefetch="intent" to={`/o/positions/view/${position.id}`}>
                            <Info className="h-5 w-5" />
                          </Link>
                        </Button>
                        )}
                      {can?.edit && (
                        <Button
                          variant="ghost"
                          className="h-12 text-base px-3"
                          asChild
                        >
                          <Link prefetch="intent" to={`/o/positions/edit/${position.id}`}>
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                      )}
                        
                        {can?.delete && (
                             <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost"
                              className="h-12 text-base px-3"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl">
                                Êtes-vous sûr ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Cette action ne peut pas être annulée. Cela supprimera définitivement le poste.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3 sm:gap-0">
                              <AlertDialogCancel className="h-12 text-base">
                                Annuler
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  fetcher.submit(
                                    { id: position.id },
                                    { method: "delete", action: "/o/positions" }
                                  );
                                }}
                                className="h-12 text-base"
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
          type="postes"
          createLink="/o/positions/new"
          view={view}
        />
      )}
  
      {positions.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSearchParams({ search, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(positions.totalResults / limit)}
          </span>
          <Button
            variant="outline"
            onClick={() => setSearchParams({ search, view, page: (page + 1).toString() })}
            disabled={page * limit >= positions.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )  
}
