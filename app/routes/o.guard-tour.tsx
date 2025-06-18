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
import { Search, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { guardTourService } from "~/services/guardTour.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { GuardTourActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [GuardTourActions.List ]}});
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    const guardTours = await guardTourService.readManyPaginated(
      { $or: [{ notes: { $regex: search, $options: "i" } }] },
      { limit, page, sortBy: "startDate:desc" }
    );

   const can = {
    create: await authService.can(currentLoggedUser?.id as string, {any: [GuardTourActions.Create]}),
    edit: await authService.can(currentLoggedUser?.id as string, {any: [GuardTourActions.Edit]}),
    delete: await authService.can(currentLoggedUser?.id as string, {any: [GuardTourActions.Delete]}),
   }

    return Response.json({ guardTours, search, page, limit, can });
  } catch (error) {
    console.error("Error fetching guard tours:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des tours de garde.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [GuardTourActions.Delete] },
  });
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await guardTourService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing guard tour action:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur le tour de garde.",
      },
      { status: 500 }
    );
  }
};

export default function GuardTourList() {
  const { guardTours, search, page, limit, can } =
    useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams({ search: searchTerm });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Tours de Garde
        </h1>

        {can?.create && (
          <Button asChild className="w-full sm:w-auto h-11 text-base">
            <Link prefetch="intent" to="/o/guard-tour/new">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Tour de Garde
            </Link>
          </Button>
        )}
      </div>

      <Form onSubmit={handleSearch} className="flex w-full items-center gap-2">
        <Input
          type="search"
          name="search"
          placeholder="Rechercher des tours de garde..."
          defaultValue={search}
          className="h-11 text-base"
        />
        <Button type="submit" className="h-11 w-11">
          <Search className="h-5 w-5" />
        </Button>
      </Form>

      {isLoading ? (
        <LoadingSkeleton view="list" itemCount={limit} />
      ) : guardTours.results.length > 0 ? (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base whitespace-nowrap">
                  Date de début
                </TableHead>
                <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                  Date de fin
                </TableHead>
                <TableHead className="text-base whitespace-nowrap hidden md:table-cell">
                  Notes
                </TableHead>
                <TableHead className="text-base text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guardTours.results.map((guardTour) => (
                <TableRow key={guardTour.id}>
                  <TableCell className="font-medium text-base">
                    {formatDate(guardTour.startDate)}
                  </TableCell>
                  <TableCell className="text-base hidden sm:table-cell">
                    {formatDate(guardTour.endDate)}
                  </TableCell>
                  <TableCell className="text-base truncate max-w-[200px] hidden md:table-cell">
                    {guardTour.notes}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {can?.edit && (
                        <Button asChild variant="outline" className="h-11 w-11">
                          <Link
                            prefetch="intent"
                            to={`/o/guard-tour/edit/${guardTour.id}`}
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                      )}

                      {can?.delete && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="h-11 w-11">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">
                              Êtes-vous sûr de vouloir supprimer ce tour de
                              garde ?
                            </DialogTitle>
                            <DialogDescription className="text-base">
                              Cette action ne peut pas être annulée.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-3">
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
                              onClick={() => handleDelete(guardTour.id)}
                              disabled={isProcessing}
                              className="h-11 text-base"
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
      ) : (
        <NoDataMessage
          type="tours de garde"
          createLink="/o/guard-tour/new"
          view="list"
        />
      )}

      {guardTours.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() =>
              setSearchParams({ search, page: (page - 1).toString() })
            }
            disabled={page === 1}
            className="w-full sm:w-auto h-11 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(guardTours.totalResults / limit)}
          </span>
          <Button
            onClick={() =>
              setSearchParams({ search, page: (page + 1).toString() })
            }
            disabled={page * limit >= guardTours.totalResults}
            className="w-full sm:w-auto h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
