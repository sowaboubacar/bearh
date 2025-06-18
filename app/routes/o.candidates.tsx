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
import { candidateService } from "~/services/candidate.service.server";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
  User,
  AlertTriangle,
  Eye,
} from "lucide-react";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { getFirstImage } from "~/core/utils/media/attachments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { authService } from "~/services/auth.service.server";
import { CandidateActions } from "~/core/entities/utils/access-permission";


export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser =  await authService.requireUser(request, {condition: {any: [CandidateActions.List]}}); 
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const limit = 20;



  try {
    const candidates = await candidateService.readManyPaginated(
      {
        $or: [
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
        ],
      },
      {
        limit,
        page,
        sortBy: "firstName:asc",
      }
    );
    const can = {
      create: await authService.can(currentLoggedUser?.id as string, CandidateActions.Create),
      edit: await authService.can(currentLoggedUser?.id as string, CandidateActions.Edit),
      delete: await authService.can(currentLoggedUser?.id as string, CandidateActions.Delete),
      view: await authService.can(currentLoggedUser?.id as string, CandidateActions.View),
    }

    return Response.json({ candidates, searchTerm, page, view, can });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des candidats.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {condition: CandidateActions.Delete});
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await candidateService.deleteOne(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    throw Response.json(
      {
        message: "Une erreur est survenue lors de la suppression du candidat.",
      },
      { status: 500 }
    );
  }
};

export default function CandidateListPage() {
  const {
    candidates,
    searchTerm: initialSearchTerm,
    page,
    view: initialView,
    can,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [isProcessing, setIsProcessing] = useState(false);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const view = (searchParams.get("view") as "grid" | "list") || initialView;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ search: searchTerm, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search: searchTerm, view: newView });
  };

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
    setOpenDialog(null);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Liste des Candidats
        </h1>

        {can?.create && (
          <Button
          onClick={() => navigate("/o/candidates/new")}
          className="w-full sm:w-auto h-11 text-base"
        >
          <Plus className="mr-2 h-5 w-5" />
          Ajouter un candidat
        </Button>
        )}
        
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Form onSubmit={handleSearch} className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Rechercher un candidat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base w-full sm:w-[300px]"
          />
        </Form>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => handleViewChange("grid")}
            className="h-11 w-11"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => handleViewChange("list")}
            className="h-11 w-11"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={20} />
      ) : candidates.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {candidates.results.map((candidate) => (
              <Card key={candidate.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {`${candidate.firstName} ${candidate.lastName}`}
                  </CardTitle>
                  {candidate.attachments.length > 0 && (
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={getFirstImage(candidate.attachments)?.file?.url}
                        alt={getFirstImage(candidate.attachments)?.label || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-base text-muted-foreground">
                    {candidate.email}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {candidate.phone}
                  </p>
                  <p className="text-base font-medium mt-3">
                    Poste: {candidate.positionApplied}
                  </p>
                  <p className="text-base font-medium">
                    Statut: {candidate.status}
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
                      to={`/o/candidates/view/${candidate.id}`}
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
                      to={`/o/candidates/edit/${candidate.id}`}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                    </Link>
                  </Button>
                  )}
                  
                  {can?.delete && (
                    <Dialog
                    open={openDialog === candidate.id}
                    onOpenChange={(open) =>
                      setOpenDialog(open ? candidate.id : null)
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
                          Êtes-vous sûr de vouloir supprimer ce candidat ?
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
                          onClick={() => handleDelete(candidate.id)}
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
                    Nom
                  </TableHead>
                  <TableHead className="text-base hidden sm:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="text-base hidden sm:table-cell">
                    Téléphone
                  </TableHead>
                  <TableHead className="text-base">Poste</TableHead>
                  <TableHead className="text-base hidden sm:table-cell">
                    Statut
                  </TableHead>
                  <TableHead className="text-base text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.results.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium text-base">
                      {`${candidate.firstName} ${candidate.lastName}`}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {candidate.email}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {candidate.phone}
                    </TableCell>
                    <TableCell className="text-base">
                      {candidate.positionApplied}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {candidate.status}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">

                        {can?.view && (
                          <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/o/candidates/view/${candidate.id}`)
                          }
                          className="h-11 w-11"
                        >
                          <User className="h-5 w-5" />
                        </Button>
                        )}
                        
                        {can?.edit && (
                          <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/o/candidates/edit/${candidate.id}`)
                          }
                          className="h-11 w-11"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        )}
                        
                        {can?.delete && (
                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="p-4 sm:p-6 max-w-[90vw] sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg sm:text-xl">
                                Êtes-vous sûr ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Cette action ne peut pas être annulée. Cela
                                supprimera définitivement le candidat et toutes
                                les données associées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="h-11 text-base">
                                Annuler
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  fetcher.submit(
                                    { id: candidate.id },
                                    {
                                      method: "delete",
                                      action: "/o/candidates",
                                    }
                                  );
                                }}
                                className="h-11 text-base"
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
          type="candidats"
          createLink="/o/candidates/new"
          view={view}
        />
      )}

      {candidates.totalResults > 0 && (
        <div className="mt-6 flex justify-center gap-3">
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
            className="h-11 text-base"
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
            disabled={candidates.results.length < 20}
            className="h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}

