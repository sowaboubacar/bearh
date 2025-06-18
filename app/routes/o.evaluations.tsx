import { LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
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
  Grid,
  List,
  Search,
  Award,
  AlertTriangle,
  BarChart,
  Eye,
} from "lucide-react";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { kpiValueService } from "~/services/kpiValue.service.server";
import { Badge } from "~/components/ui/badge";
import { KpiValueActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [KpiValueActions.List, KpiValueActions.ListOwn] }
  });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    // Create base query
    let query: any = {
      $or: [
        { 'kpiForm.title': { $regex: search, $options: "i" } },
        { 'kpiForm.description': { $regex: search, $options: "i" } },
      ],
    };

    // If user only has ListOwn permission, filter for their evaluations
    const hasFullListAccess = await authService.can(currentLoggedUser.id, KpiValueActions.List);
    if (!hasFullListAccess) {
      query = {
        $and: [
          query,
          {
            $or: [
              { user: currentLoggedUser.id },
              { evaluator: currentLoggedUser.id }
            ]
          }
        ]
      };
    }

    const evaluations = await kpiValueService.readManyPaginated(
      query,
      {
        limit,
        page,
        sortBy: "createdAt:desc",
        populate: "kpiForm,user,evaluator"
      }
    );

    const can = {
      create: await authService.can(currentLoggedUser.id, KpiValueActions.Create),
      edit: await authService.can(currentLoggedUser.id, { any: [KpiValueActions.Edit, KpiValueActions.EditOwn] }),
      delete: await authService.can(currentLoggedUser.id, { any: [KpiValueActions.Delete, KpiValueActions.DeleteOwn] }),
      view: await authService.can(currentLoggedUser.id, { any: [KpiValueActions.View, KpiValueActions.ViewOwn] })
    };

    return Response.json({ evaluations, can, search, page, limit });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération des évaluations." },
      { status: 500 }
    );
  }
};

export default function KpiValueList() {
  const {
    evaluations,
    search,
    view: initialView,
    page,
    limit,
    can
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const view = (searchParams.get("view") as "grid" | "list") || initialView;

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
          Inventaire des Evaluations
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full sm:w-auto sm:flex-1"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher dans l'inventaire des evaluations..."
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
      ) : evaluations?.results?.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {evaluations?.results?.map((kpiValue) => (
              <Card key={kpiValue.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center text-lg font-bold">
                    <div className="space-y-1">
                      <div>
                        Evaluations de {kpiValue.user?.firstName}{" "}
                        {kpiValue.user?.lastName}
                      </div>
                      <div className="text-base font-normal text-muted-foreground">
                        Evalué le{" "}
                        {new Date(kpiValue.createdAt).toLocaleString()}
                      </div>
                      <div className="text-base font-normal text-muted-foreground">
                        Par {kpiValue.evaluator?.firstName}{" "}
                        {kpiValue.evaluator?.lastName}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-6 flex items-center">
                  <div className="space-y-3">
                    <Badge
                      variant="outline"
                      className="mt-2 bg-primary/90 text-white px-3 py-1 text-base"
                    >
                      Moyenne Des Notes: {kpiValue.meanScore.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  KPI: {kpiValue.kpiForm?.title}
                </CardFooter>
                {can?.view && (
                <div className="flex justify-center mb-4">
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 text-base px-3"
                    >
                      <Link
                        prefetch="intent"
                        to={`/o/evaluations/view/${kpiValue.id}`}
                      >
                        <Eye className="h-5 w-5" /> Details
                      </Link>
                    </Button>
                  </div>
                )}
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
                    Date Evaluation
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Evaluateur
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap">
                    Moyenne Des Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.results?.map((kpiValue) => (
                  <TableRow key={kpiValue.id}>
                    <TableCell className="font-medium text-base">
                      {kpiValue.user.firstName} {kpiValue.user.lastName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {new Date(kpiValue.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-base">
                      {kpiValue.evaluator?.firstName}{" "}
                      {kpiValue.evaluator?.lastName}
                    </TableCell>
                    <TableCell className="text-base">
                      {kpiValue.meanScore.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <NoDataMessage type="Evaluations d'Employé" view={view} />
      )}

      {evaluations.totalResults > 0 && (
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
            Page {page} sur {Math.ceil(evaluations.totalResults / limit)}
          </span>
          <Button
            onClick={() =>
              setSearchParams({ search, view, page: (page + 1).toString() })
            }
            disabled={page * limit >= evaluations.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
