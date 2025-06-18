import { useState, useEffect } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { patrimoineTypeService } from "~/services/patrimoineType.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { PatrimoineTypeActions } from "~/core/entities/utils/access-permission";


export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PatrimoineTypeActions.List]}})
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    const patrimoineTypes = await patrimoineTypeService.readManyPaginated(
      { name: { $regex: search, $options: "i" } },
      { limit, page, sortBy: "name:asc" }
    );

    const can = {
      create: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineTypeActions.Create]}),
      edit: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineTypeActions.Edit]}),
      delete: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineTypeActions.Delete]}),
    }
    return Response.json({ patrimoineTypes, search, view, page, limit, can });
  } catch (error) {
    console.error("Error fetching patrimoine types:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des types de patrimoine.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [PatrimoineTypeActions.Delete] },
  });
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await patrimoineTypeService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing patrimoine type action:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur le type de patrimoine.",
      },
      { status: 500 }
    );
  }
};

export default function PatrimoineTypeList() {
  const {
    patrimoineTypes,
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

  const [view, setView] = useState(initialView);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

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
    setSearchParams({ search: searchTerm, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search, view: newView });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Type d'Actif
        </h1>

        {can?.create && (
        <Button 
          asChild 
          className="w-full sm:w-auto h-12 text-base"
        >
          <Link prefetch="intent" to="/o/patrimoine-type/new">
            <Plus className="mr-2 h-5 w-5" /> 
            Nouveau Type de Patrimoine
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
            placeholder="Rechercher des types de patrimoine..."
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
      ) : patrimoineTypes.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {patrimoineTypes.results.map((patrimoineType) => (
              <Card key={patrimoineType.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl font-bold">
                    {patrimoineType.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-base text-muted-foreground">
                    {patrimoineType.description || "Aucune description"}
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-between gap-3">
                  {can?.edit && (
                  <Button 
                    asChild 
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    <Link
                      prefetch="intent"
                      to={`/o/patrimoine-type/edit/${patrimoineType.id}`}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                      
                    </Link>
                  </Button>
                  )}

                  {can?.delete && (
                  <Dialog
                    open={openDialog === patrimoineType.id}
                    onOpenChange={(open) =>
                      setOpenDialog(open ? patrimoineType.id : null)
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
                          Êtes-vous sûr de vouloir supprimer ce type de patrimoine ?
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
                          onClick={() => handleDelete(patrimoineType.id)}
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
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrimoineTypes.results.map((patrimoineType) => (
                  <TableRow key={patrimoineType.id}>
                    <TableCell className="font-medium text-base">
                      {patrimoineType.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base">
                      {patrimoineType.description || "Aucune description"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">

                        {can?.edit && (
                        <Button 
                          asChild 
                          variant="outline"
                          className="h-12 text-base px-3"
                        >
                          <Link
                            prefetch="intent"
                            to={`/o/patrimoine-type/edit/${patrimoineType.id}`}
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                        )}

                        {can?.delete && (
                        <Dialog
                          open={openDialog === patrimoineType.id}
                          onOpenChange={(open) =>
                            setOpenDialog(open ? patrimoineType.id : null)
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
                                Êtes-vous sûr de vouloir supprimer ce type de patrimoine ?
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
                                onClick={() => handleDelete(patrimoineType.id)}
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
          type="types de patrimoine"
          createLink="/o/patrimoine-type/new"
          view={view}
        />
      )}
  
      {patrimoineTypes.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setSearchParams({ search, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(patrimoineTypes.totalResults / limit)}
          </span>
          <Button
            onClick={() => setSearchParams({ search, view, page: (page + 1).toString() })}
            disabled={page * limit >= patrimoineTypes.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )  
}

