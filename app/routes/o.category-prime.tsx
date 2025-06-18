import { type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, Form, useSearchParams, useNavigation, Link, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import { useState } from "react";
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
import { bonusCategoryService } from "~/services/bonusCategory.service.server";
import { LayoutGrid, List, Plus, Search, Trash2, Edit, Loader2, AlertTriangle, Eye, Info, Users } from 'lucide-react';
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { authService } from "~/services/auth.service.server";
 import { BonusCategoryActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const loggedUser = await authService.requireUser(request, {condition: {any: [BonusCategoryActions.List]}});
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = url.searchParams.get("view") as "grid" | "list" || "grid";
  const limit = 20;

  try {
    const bonusCategories = await bonusCategoryService.readManyPaginated(
      { name: { $regex: searchTerm, $options: "i" } },
      {
        limit,
        page,
        sortBy: "name:asc",
        populate: 'members'
      }
    );

    const can = {
      create: await authService.can(loggedUser?.id as string, {any: [BonusCategoryActions.Create]}),
      edit: await authService.can(loggedUser?.id as string, {any: [BonusCategoryActions.Edit]}),
      delete: await authService.can(loggedUser?.id as string, {any: [BonusCategoryActions.Delete]}),
      view: await authService.can(loggedUser?.id as string, {any: [BonusCategoryActions.View]}),
    };

    return Response.json({ bonusCategories, searchTerm, page, view, can });
  } catch (error) {
    console.error("Error fetching bonusCategories:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la récupération des catégorie de Prime." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [BonusCategoryActions.Delete] },
  });
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await bonusCategoryService.deleteOne(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting bonusCategory:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la suppression du département." }, { status: 500 });
  }
};

export default function DepartmentListPage() {
  const { bonusCategories, searchTerm: initialSearchTerm, page, view: initialView,can } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const view = searchParams.get("view") as "grid" | "list" || initialView;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ search: searchTerm, view });
  };

  const handleViewChange = (newView: "grid" | "list") => {
    setSearchParams({ search: searchTerm, view: newView });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Liste des Catégorie de Prime
        </h1>
        {can?.create && (
        <Button 
          onClick={() => navigate("/o/category-prime/new")}
          className="w-full sm:w-auto h-11 text-base"
        >
          <Plus className="mr-2 h-5 w-5" /> 
            Ajouter une catégorie
          </Button>
        )}
      </div>
  
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Form onSubmit={handleSearch} className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Rechercher une categorie..."
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
      ) : bonusCategories.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {bonusCategories.results.map((bonusCategory) => (
              <Card key={bonusCategory.id} className="flex flex-col">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl font-bold mb-4">
                    {bonusCategory.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                  <p className="text-base text-muted-foreground">
                    {bonusCategory.description || "Aucune description"}
                  </p>
                  <div className="mt-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-base">{bonusCategory.members.length} membres</span>
                  </div>
                  <p className="text-base text-muted-foreground">
                    {bonusCategory.baseAmount} FCFA de base
                  </p>
                  <p className="text-base text-muted-foreground">
                    {bonusCategory.coefficient} de coefficient multiplicateur de la moyenne des notes KPI
                  </p>
                  <p className="text-base text-muted-foreground">
                    +/- {bonusCategory.remarkBonusAmount} FCFA par une remarque
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex flex-wrap gap-2">
                  {can?.view && (
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/category-prime/view/${bonusCategory.id}`)}
                  >
                      <Info className="h-5 w-5 mr-2" /> 
                    </Button>
                  )}
                  {can?.edit && (
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/category-prime/edit/${bonusCategory.id}`)}
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
                          Cette action ne peut pas être annulée. Cela supprimera définitivement la catégorie.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="h-12 text-base">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            fetcher.submit(
                              { id: bonusCategory.id },
                              { method: "delete", action: "/o/categor-prime" }
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
                  <TableHead className="text-base whitespace-nowrap">Nom</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Montant de base
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Coéfficient KPI
                  </TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                    Bonus Remarque
                  </TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonusCategories.results.map((bonusCategory) => (
                  <TableRow key={bonusCategory.id}>
                    <TableCell className="font-medium text-base">
                      {bonusCategory.name}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {bonusCategory.baseAmount} FCFA
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {bonusCategory.coefficient}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      +/- {bonusCategory.remarkBonusAmount} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {can?.view && (
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/o/category-prime/view/${bonusCategory.id}`)}
                          className="h-11 w-11"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        )}
                        {can?.edit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/o/category-prime/edit/${bonusCategory.id}`)}
                          className="h-11 w-11"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        )}
                        {can?.delete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="p-4 sm:p-6 max-w-[90vw] sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg sm:text-xl">
                                Êtes-vous sûr ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Cette action ne peut pas être annulée. Cela supprimera définitivement la catégorie.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="h-11 text-base">
                                Annuler
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  fetcher.submit(
                                    { id: bonusCategory.id },
                                    { method: "delete", action: "/o/category-prime" }
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
        <NoDataMessage type="catégorie de Prime" createLink="/o/category-prime/new" view={view} />
      )}
  
      {bonusCategories.totalResults > 0 && (
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSearchParams({ search: searchTerm, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="h-11 text-base"
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            onClick={() => setSearchParams({ search: searchTerm, view, page: (page + 1).toString() })}
            disabled={bonusCategories.results.length < 20}
            className="h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}
