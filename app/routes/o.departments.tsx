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
import { departmentService } from "~/services/department.service.server";
import { LayoutGrid, List, Plus, Search, Trash2, Edit, Loader2, AlertTriangle, Info, Users } from 'lucide-react';
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { getFirstImage } from "~/core/utils/media/attachments";
import { authService } from "~/services/auth.service.server";
import { DepartmentActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [DepartmentActions.List]}});
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = url.searchParams.get("view") as "grid" | "list" || "grid";
  const limit = 20;

  try {
    const departments = await departmentService.readManyPaginated(
      { name: { $regex: searchTerm, $options: "i" } },
      {
        limit,
        page,
        sortBy: "name:asc",
        populate: 'manager,members,attachments'
      }
    );
  

    const can = {
      create: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Create ),
      delete: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Delete ),
      edit: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Edit ),
      view: await authService.can(currentLoggedUser?.id as string, DepartmentActions.View ),
    }
    return Response.json({ departments, searchTerm, page, view , can });
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la récupération des départements." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [DepartmentActions.Delete]},
  });
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await departmentService.deleteOne(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la suppression du département." }, { status: 500 });
  }
};

export default function DepartmentListPage() {
  const { departments, searchTerm: initialSearchTerm, page, view: initialView, can } = useLoaderData<typeof loader>();
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
    <div className="container mx-auto p-4 sm:p-6 lg:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Liste des Départements
        </h1>

        { can?.create && ( <Button 
          onClick={() => navigate("/o/departments/new")}
          className="w-full sm:w-auto h-11 text-base"
        >
          <Plus className="mr-2 h-5 w-5" /> 
          Ajouter un département
        </Button>)}
       
      </div>
  
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Form 
          onSubmit={handleSearch} 
          className="relative w-full sm:w-auto"
        >
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Rechercher un département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base w-full sm:w-[300px]"
          />
        </Form>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => handleViewChange("grid")}
            className="flex-1 sm:flex-none h-11 w-11"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => handleViewChange("list")}
            className="flex-1 sm:flex-none h-11 w-11"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={20} />
      ) : departments.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {departments.results.map((department) => (
              <Card key={department.id} className="flex flex-col">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl font-bold mb-4">
                    {department.name}
                  </CardTitle>
                  {department.attachments.length > 0 && (
                    <img 
                      src={getFirstImage(department.attachments)?.file?.url} 
                      alt={getFirstImage(department.attachments)?.label || ''} 
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                  <p className="text-base text-muted-foreground">
                    {department.description || "Aucune description"}
                  </p>
                  <div className="mt-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-base">{department.members.length} membres</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex flex-wrap gap-2">
                {can?.view && 
                  (
                    <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/departments/view/${department.id}`)}
                  >
                    <Info className="h-5 w-5 mr-2" /> 
                  </Button>
                  )
                }
                  {can?.edit && (
                    <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/departments/edit/${department.id}`)}
                  >
                    <Edit className="h-5 w-5 mr-2" /> 
                  </Button>
                  )}
                  
                  {can?.delete && (<AlertDialog>
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
                          Cette action ne peut pas être annulée. Cela supprimera définitivement le departement.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="h-12 text-base">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            fetcher.submit(
                              { id: department.id },
                              { method: "delete", action: "/o/departments" }  
                            );
                          }}
                          className="h-12 text-base"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent> 
                  </AlertDialog>)}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">Nom</TableHead>
                  <TableHead className="text-base hidden sm:table-cell">Manager</TableHead>
                  <TableHead className="text-base hidden sm:table-cell">Pièces Jointes</TableHead>
                  <TableHead className="text-base hidden sm:table-cell">Membres</TableHead>
                  <TableHead className="text-base hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.results.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium text-base">
                      {department.name}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {department.manager?.firstName} {department.manager?.lastName}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {department.attachments?.length}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {department.members?.length} membres
                    </TableCell>
                    <TableCell className="text-base hidden lg:table-cell">
                      {department.description || "Aucune description"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.view && ( <Button
                          variant="ghost"
                          onClick={() => navigate(`/o/departments/view/${department.id}`)} 
                          className="h-11 w-11"
                        >
                          <Info className="h-5 w-5" />
                        </Button>)} 
                        
                       { can?.edit && (
                         <Button
                          variant="ghost"
                          onClick={() => navigate(`/o/departments/edit/${department.id}`)}
                          className="h-11 w-11"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                       )}
                       
                       {can?.delete && (
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="h-11 w-11">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="p-4 sm:p-6 max-w-[90vw] sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg sm:text-xl">
                                Êtes-vous sûr ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Cette action ne peut pas être annulée. Cela supprimera définitivement le département.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="h-11 text-base">
                                Annuler
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  fetcher.submit(
                                    { id: department.id },
                                    { method: "delete", action: "/o/departments" }
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
      ) : <NoDataMessage  
      type="départements"  
      createLink="/o/departments/new" 
      view={view} 
    />
        
      } 
  
      {departments.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSearchParams({ search: searchTerm, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-11 text-base"
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            onClick={() => setSearchParams({ search: searchTerm, view, page: (page + 1).toString() })}
            disabled={departments.results.length < 20}
            className="w-full sm:w-auto h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}
