import { useState } from "react";
import { LoaderFunction } from "@remix-run/node";
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
import { Grid, List, Search, Plus, Award, AlertTriangle } from "lucide-react";
import { primeService } from "~/services/prime.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
import { PrimeActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [PrimeActions.List, PrimeActions.ListOwn] }
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
        { period: { $regex: search, $options: "i" } },
      ],
    };

    // Add ownership filter if user only has ListOwn permission
    // const hasFullListAccess = await authService.can(currentUser.id, PrimeActions.List);
    // if (!hasFullListAccess) {
    //   query = {
    //     $and: [
    //       query,
    //       { user: currentUser.id }
    //     ]
    //   };
    // }

    // const primes = await primeService.readManyPaginated(
    //   query,
    //   { limit, page, sortBy: "createdAt:desc", populate: "user" }
    // );


    const primes = await primeService.samples(currentUser);

    return Response.json({ primes, search, view, page, limit });
  } catch (error) {
    console.error("Error fetching primes:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération des primes" },
      { status: 500 }
    );
  }
};

export default function PrimeList() {
  const {
    primes,
    search,
    view: initialView,
    page,
    limit,
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
          Gestion des Primes
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
            placeholder="Rechercher des primes..."
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
      ) : primes?.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {primes.map((prime) => (
              <Card key={prime.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center text-lg font-bold">
                    <Award className="mr-3 h-5 w-5" />
                    <div className="space-y-1">
                      <div>Prime de {prime.user?.firstName} {prime.user?.lastName}</div>
                      <div className="text-base font-normal text-muted-foreground">
                        {new Date(prime.startTrackingDate).toLocaleString()} - {new Date(prime.endTrackingDate).toLocaleString()}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
                  <div className="space-y-3">
                    <p className="text-base text-muted-foreground">
                      Montant total: {prime.totalAmount.toFixed(2)} F CFA
                    </p>
                    <p className="text-base text-muted-foreground">
                      Date de calcul: {new Date(prime.calculationDate).toLocaleString()}
                    </p>
                  </div>
  
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-center">Details du Calcul</h5>
                    <ol className="space-y-3 text-base">
                      <li>
                        <span className="font-medium">KPIs:</span>{" "}
                        {prime.calculationDetails.kpiValue?.title}
                      </li>
                      <li>
                        <span className="font-medium">Catégorie:</span>{" "}
                        {prime.calculationDetails.bonusCategory?.title}
                      </li>
                      <li>
                        <span className="font-medium">Remarques:</span>{" "}
                        {prime.calculationDetails.observations?.length} Remarque(s)
                      </li>
                      <li className="pt-2">
                        <span className="font-medium">Formule:</span>{" "}
                        <i>{prime.calculationDetails.formula}</i>
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">Employé</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Période</TableHead>
                  <TableHead className="text-base whitespace-nowrap">Montant total</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">Bonus de performance</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">Bonus de remarque</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Remarques</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden xl:table-cell">Formule</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {primes.map((prime) => (
                  <TableRow key={prime.id}>
                    <TableCell className="font-medium text-base">
                      {prime.user.firstName} {prime.user.lastName}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {new Date(prime.startTrackingDate).toLocaleString()} -{" "}
                      {new Date(prime.endTrackingDate).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-base">
                      {prime.totalAmount.toFixed(2)} F CFA
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {prime.calculationDetails.kpiValue?.title}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {prime.calculationDetails.bonusCategory?.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base">
                      {prime.calculationDetails.observations?.length}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-base">
                      <i>{prime.calculationDetails.formula}</i>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <NoDataMessage type="Primes" view={view} />
      )}
  
      {primes.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setSearchParams({ search, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(primes.totalResults / limit)}
          </span>
          <Button
            onClick={() => setSearchParams({ search, view, page: (page + 1).toString() })}
            disabled={page * limit >= primes.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )  
}
