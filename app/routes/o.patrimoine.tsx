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
  PenToolIcon as Tool,
  XCircle,
  CheckCircle,
  Badge,
  
} from "lucide-react";
import { patrimoineService } from "~/services/patrimoine.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { PatrimoineActions} from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
   const currentLoggedUser =  await authService.requireUser(request, {condition: {any: [PatrimoineActions.List]}})
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    const patrimoines = await patrimoineService.readManyPaginated(
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { "type.name": { $regex: search, $options: "i" } },
          { "assignedTo.users.firstName": { $regex: search, $options: "i" } },
          { "assignedTo.users.lastName": { $regex: search, $options: "i" } },
          { "assignedTo.positions.name": { $regex: search, $options: "i" } },
          { "assignedTo.teams.name": { $regex: search, $options: "i" } },
          { "assignedTo.departments.name": { $regex: search, $options: "i" } },
          { "assignedTo.hourGroups.name": { $regex: search, $options: "i" } },
          { "assignedTo.access.name": { $regex: search, $options: "i" } },
        ],
      },
      {
        limit,
        page,
        sortBy: "name:asc",
        populate:
          "type,assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access",
      }
    );
  
    const can = {
      create: await authService.can(currentLoggedUser?.id as string, PatrimoineActions.Create ),
      delete: await authService.can(currentLoggedUser?.id as string, PatrimoineActions.Delete ),
      edit: await authService.can(currentLoggedUser?.id as string, PatrimoineActions.Edit ),
      view: await authService.can(currentLoggedUser?.id as string, PatrimoineActions.View ),
    }
    return Response.json({ patrimoines, search, view, page, limit,can });
  } catch (error) {
    console.error("Error fetching patrimoine:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération du patrimoine.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [PatrimoineActions.Delete] },
  });
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await patrimoineService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing patrimoine action:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur le patrimoine.",
      },
      { status: 500 }
    );
  }
};

export default function PatrimoineList() {
  const {
    patrimoines,
    search,
    view: initialView,
    page,
    limit,
    can
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'Under Maintenance':
        return <Tool className="h-6 w-6 text-yellow-500" />
      case 'Out of Service':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return null
    }
  }
  const countAssignedEntities = (assignedTo: any) => {
    return [
      "users",
      "positions",
      "teams",
      "departments",
      "hourGroups",
      "access",
    ].reduce(
      (total, category) => total + (assignedTo[category]?.length || 0),
      0
    );
  };
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Patrimoine
        </h1>
        {can?.create && (
           <Button 
          asChild 
          className="w-full sm:w-auto h-12 text-base"
        >
          <Link prefetch="intent" to="/o/patrimoine/new">
            <Plus className="mr-2 h-5 w-5" /> 
            Nouvel actif
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
            placeholder="Rechercher dans le patrimoine..."
            defaultValue={search}
            className="h-12 text-base"
          />
          <Button 
            type="submit"
            className="h-12 w-12 flex-shrink-0"
          >
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
      ) : patrimoines.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {patrimoines.results.map((patrimoine) => (
              <Card key={patrimoine.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center justify-between text-lg font-bold">
                    <span>{patrimoine.name}</span>
                    <div className="flex items-center h-8 text-base px-3 py-1 bg-secondary text-secondary-foreground rounded-md whitespace-nowrap overflow-hidden text-ellipsis">
                      {getStatusIcon(patrimoine.status)}
                      <span className="ml-2 text-xs sm:text-sm truncate">{patrimoine.status}</span>
                    </div>
                  </CardTitle>
                 
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  <p className="text-base text-muted-foreground">
                    Type: {patrimoine.type.name}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Date d'achat: {new Date(patrimoine.purchaseDate).toLocaleString()}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Statut: {patrimoine.status}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Pièces Jointes: {patrimoine.attachments.length}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Assigné à {countAssignedEntities(patrimoine.assignedTo)} entité(s)
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-between gap-3">
                  <Button 
                    asChild 
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    <Link prefetch="intent" to={`/o/patrimoine/view/${patrimoine.id}`}>
                      <Eye className="mr-2 h-5 w-5" />
                      
                    </Link>
                  </Button>
                  {can?.edit && (
                      <Button 
                    asChild 
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    <Link prefetch="intent" to={`/o/patrimoine/edit/${patrimoine.id}`}>
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
                          Êtes-vous sûr de vouloir supprimer ce patrimoine ?
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
                          onClick={() => handleDelete(patrimoine.id)}
                          disabled={isProcessing}
                          className="h-12 text-base"
                        >
                          {isProcessing ? "Suppression..." : "Supprimer"}
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
                  <TableHead className="text-base whitespace-nowrap">Nom</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">Date d'achat</TableHead>
                  <TableHead className="text-base whitespace-nowrap">Statut</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Pièces Jointes</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">Assigné à</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrimoines.results.map((patrimoine) => (
                  <TableRow key={patrimoine.id}>
                    <TableCell className="font-medium text-base">
                      {patrimoine.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {patrimoine.type.name}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {new Date(patrimoine.purchaseDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(patrimoine.status)}
                        <span className="text-base">{patrimoine.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base">
                      {patrimoine.attachments.length}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {countAssignedEntities(patrimoine.assignedTo)} entité(s)
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.view && (
                           <Button 
                          asChild 
                          variant="outline"
                          className="h-12 text-base px-3"
                        >
                          <Link prefetch="intent" to={`/o/patrimoine/view/${patrimoine.id}`}>
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
                          <Link prefetch="intent" to={`/o/patrimoine/edit/${patrimoine.id}`}>
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
                                Êtes-vous sûr de vouloir supprimer ce patrimoine ?
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
                                onClick={() => handleDelete(patrimoine.id)}
                                disabled={isProcessing}
                                className="h-12 text-base"
                              >
                                {isProcessing ? "Suppression..." : "Supprimer"}
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
          type="patrimoine"
          createLink="/o/patrimoine/new"
          view={view}
        />
      )}
  
      {patrimoines.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setSearchParams({ search, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(patrimoines.totalResults / limit)}
          </span>
          <Button
            onClick={() => setSearchParams({ search, view, page: (page + 1).toString() })}
            disabled={page * limit >= patrimoines.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}

