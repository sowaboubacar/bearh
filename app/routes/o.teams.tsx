import { type LoaderFunction, type ActionFunction, json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher, Form, useNavigation, useSearchParams, useRouteError, isRouteErrorResponse, Link } from "@remix-run/react";
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
import { teamService } from "~/services/team.service.server";
import { LayoutGrid, List, Plus, Search, Trash2, Edit, Users,  Info } from 'lucide-react';
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { useState } from "react";
import { getFirstImage } from "~/core/utils/media/attachments";
import { authService } from "~/services/auth.service.server";
import { DepartmentActions, TaskActions } from "~/core/entities/utils/access-permission";
import { TeamActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
 const currentLoggedUser = await authService.requireUser(request, {condition: {any: [TaskActions.List] }});
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = url.searchParams.get("view") || "grid";
  const limit = 20;

  try {
    const teams = await teamService.readManyPaginated(
      { name: { $regex: searchTerm, $options: "i" } },
      {
        limit,
        page,
        sortBy: "name:asc",
        populate: 'leader,members,attachments',
      }
    );
  
    const can = {
      create: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Create ),
      delete: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Delete ),
      edit: await authService.can(currentLoggedUser?.id as string, DepartmentActions.Edit ),
      view: await authService.can(currentLoggedUser?.id as string, DepartmentActions.View ),
    }
    return Response.json({ teams, searchTerm, page, view,can });
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la récupération des équipes." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request,{condition:{any :[TeamActions.Delete]}});
  const formData = await request.formData();
  const id = formData.get("id") as string;

  try {
    await teamService.deleteOne(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    throw Response.json({ message: "Une erreur est survenue lors de la suppression de l'équipe." }, { status: 500 });
  }
};



export default function TeamListPage() {
  const { teams, searchTerm: initialSearchTerm, page, view,can } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isLoading = navigation.state === "loading";

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(`?search=${searchTerm}&view=${view}`);
  };

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", newView);
    navigate(`?${params.toString()}`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Liste des Équipes
        </h1>
        {can?.create && (
           <Button 
          onClick={() => navigate("/o/teams/new")}
          className="w-full sm:w-auto h-12 text-base"
        >
          <Plus className="mr-2 h-5 w-5" /> 
          Ajouter une équipe
        </Button>
        )}
       
      </div>
  
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
        <Form 
          onSubmit={handleSearch} 
          className="relative w-full sm:w-auto sm:flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Rechercher une équipe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base w-full sm:max-w-md"
          />
        </Form>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => handleViewChange("grid")}
            className="flex-1 sm:flex-none h-12"
          >
            <LayoutGrid className="h-5 w-5" />
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
        <LoadingSkeleton view={view} itemCount={20} />
      ) : teams.results.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {teams.results.map((team) => (
              <Card key={team.id} className="flex flex-col">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-xl font-bold mb-4">
                    {team.name}
                  </CardTitle>
                  {team.attachments.length > 0 && (
                    <img 
                      src={getFirstImage(team.attachments)?.file?.url} 
                      alt={getFirstImage(team.attachments)?.label || ''} 
                      className="w-full h-48 object-cover rounded-md"
                    />
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                  <p className="text-base text-muted-foreground">
                    {team.description || "Aucune description"}
                  </p>
                  <div className="mt-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-base">{team.members.length} membres</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex flex-wrap gap-2">
                  {can?.view && (
                     <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/teams/view/${team.id}`)}
                  >
                    <Info className="h-5 w-5 mr-2" /> 
                  </Button>
                  )}
                 {can?.edit && (
                   <Button
                    variant="outline"
                    className="flex-1 h-12 text-base"
                    onClick={() => navigate(`/o/teams/edit/${team.id}`)}
                  >
                    <Edit className="h-5 w-5 mr-2" /> 
                  </Button>
                 )}
                 {can.delete && (
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
                          Cette action ne peut pas être annulée. Cela supprimera définitivement l&#39;équipe.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="h-12 text-base">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            fetcher.submit(
                              { id: team.id },
                              { method: "delete", action: "/o/teams" }
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
                  <TableHead className="text-base">Nom</TableHead>
                  <TableHead className="text-base hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-base hidden sm:table-cell">Pièces Jointes</TableHead>
                  <TableHead className="text-base">Membres</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.results.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium text-base">
                      {team.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base">
                      {team.description || "Aucune description"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {team.attachments?.length}
                    </TableCell>
                    <TableCell className="text-base">
                      {team.members.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {can?.view && (                  
                        <Button
                          variant="ghost"
                          className="h-12"
                          onClick={() => navigate(`/o/teams/view/${team.id}`)}
                        >
                          <Info className="h-5 w-5" />
                        </Button>
                        )}
                       {can?.edit (
                         <Button
                          variant="ghost"
                          className="h-12"
                          onClick={() => navigate(`/o/teams/edit/${team.id}`)}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                       )}
                       {can?.delete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="h-12">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl">
                                Êtes-vous sûr ?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                Cette action ne peut pas être annulée. Cela supprimera définitivement l'équipe.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3 sm:gap-0">
                              <AlertDialogCancel className="h-12 text-base">
                                Annuler
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  fetcher.submit(
                                    { id: team.id },
                                    { method: "delete", action: "/o/teams" }
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
        <NoDataMessage type="équipes" createLink="/o/teams/new" view={view} /> //TODO: to update
      )}
  
      {teams.results.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("page", (page - 1).toString());
              navigate(`?${params.toString()}`);
            }}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page}
          </span>
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("page", (page + 1).toString());
              navigate(`?${params.toString()}`);
            }}
            disabled={teams.results.length < 20}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
  
}

