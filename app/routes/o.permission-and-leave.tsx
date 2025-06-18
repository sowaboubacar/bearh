/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { permissionAndLeaveService } from "~/services/permissionAndLeave.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { PermissionsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [PermissionsActions.List, PermissionsActions.ListOwn] }
  });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    // Create base query with existing search filter
    let query = {
      $or: [
        { "user.firstName": { $regex: search, $options: "i" } },
        { "user.lastName": { $regex: search, $options: "i" } },
        { reason: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ],
    };

    // Add ownership filter if user only has ListOwn permission
    const hasFullListAccess = await authService.can(currentUser.id, PermissionsActions.List);
    if (!hasFullListAccess) {
      query = {
        // @ts-ignore
        $and: [
          query,
          { user: currentUser.id }
        ]
      };
    }

    const permissionAndLeaves = await permissionAndLeaveService.readManyPaginated(
      query,
      { limit, page, sortBy: "startDate:desc", populate: "user,approver" }
    );

    const can = {
      create: await authService.can(currentUser.id, PermissionsActions.Create),
      edit: await authService.can(currentUser.id, {
        any: [PermissionsActions.Edit, PermissionsActions.EditOwn]
      }),
      delete: await authService.can(currentUser.id, {
        any: [PermissionsActions.Delete, PermissionsActions.DeleteOwn]
      }),
      view: await authService.can(currentUser.id, {
        any: [PermissionsActions.View, PermissionsActions.ViewOwn]
      })
    };

    return Response.json({ permissionAndLeaves, search, view, page, limit, can });
  } catch (error) {
    console.error("Error fetching permissions and leaves:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération des demandes" },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request);
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await permissionAndLeaveService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing permission and leave action:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur la permission ou le congé.",
      },
      { status: 500 }
    );
  }
};

export default function PermissionAndLeaveList() {
  const {
    permissionAndLeaves,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">En attente</Badge>;
      case "Approved":
        return <Badge variant="success">Approuvé</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Permissions et Congés
        </h1>

        {can?.create && (
          <Button asChild className="w-full sm:w-auto h-12 text-base">
            <Link prefetch="intent" to="/o/permission-and-leave/new">
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle Demande
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
            placeholder="Rechercher des demandes..."
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
      ) : permissionAndLeaves.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {permissionAndLeaves.results.map((item) => (
              <Card key={item.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center text-lg font-bold">
                    <Calendar className="mr-3 h-5 w-5" />
                    {item.user.firstName} {item.user.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  <p className="text-base text-muted-foreground">
                    Type: {item.type === "Permission" ? "Permission" : "Congé"}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Du: {new Date(item.startDate).toLocaleString()}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Au: {new Date(item.endDate).toLocaleString()}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Raison: {item.reason}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Pièces Jointes: {item.attachments.length}
                  </p>
                  <div className="pt-2">{getStatusBadge(item.status)}</div>
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
                        to={`/o/permission-and-leave/view/${item.id}`}
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
                        to={`/o/permission-and-leave/edit/${item.id}`}
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
                            Êtes-vous sûr de vouloir supprimer cette demande ?
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
                            onClick={() => handleDelete(item.id)}
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
                  <TableHead className="text-base whitespace-nowrap">
                    Employé
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Type
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">
                    Du
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">
                    Au
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">
                    Raison
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap">
                    Statut
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Pièces Jointes
                  </TableHead>
                  <TableHead className="text-base text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionAndLeaves.results.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-base">
                      {item.user.firstName} {item.user.lastName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {item.type === "Permission" ? "Permission" : "Congé"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {new Date(item.startDate).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {new Date(item.endDate).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base max-w-xs truncate">
                      {item.reason}
                    </TableCell>
                    <TableCell className="text-base">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {item.attachments.length}
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
                              to={`/o/permission-and-leave/view/${item.id}`}
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
                              to={`/o/permission-and-leave/edit/${item.id}`}
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
                                  demande ?
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
                                  onClick={() => handleDelete(item.id)}
                                  disabled={isProcessing}
                                  className="h-12 text-base"
                                >
                                  {isProcessing
                                    ? "Suppression..."
                                    : "Supprimer"}
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
          type="permissions et congés"
          createLink="/o/permission-and-leave/new"
          view={view}
        />
      )}

      {permissionAndLeaves.totalResults > 0 && (
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
            Page {page} sur{" "}
            {Math.ceil(permissionAndLeaves.totalResults / limit)}
          </span>
          <Button
            onClick={() =>
              setSearchParams({ search, view, page: (page + 1).toString() })
            }
            disabled={page * limit >= permissionAndLeaves.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
