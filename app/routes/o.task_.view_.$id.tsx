import { LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  Link,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeft, Edit, CheckCircle2, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { taskService } from "~/services/task.service.server";
import { authService } from "~/services/auth.service.server";
import { TaskActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [TaskActions.View, TaskActions.ViewOwn] }
  });

  try {
    const task = await taskService.readOne({
      id: params.taskId,
      populate: "assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access,author"
    });

    if (!task) {
      throw Response.json({ message: "Tâche non trouvée" }, { status: 404 });
    }

    // Check if user has permission to view this specific task
    const hasFullViewAccess = await authService.can(currentLoggedUser.id, TaskActions.View);
    const isOwner = task.author.id === currentLoggedUser.id || 
                    task.assignedTo.users.some(user => user.id === currentLoggedUser.id);

    if (!hasFullViewAccess && !isOwner) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      list: await authService.can(currentLoggedUser.id, { any: [TaskActions.List, TaskActions.ListOwn] }),
      edit: await authService.can(currentLoggedUser.id, { any: [TaskActions.Edit, TaskActions.EditOwn] }, {
        resourceOwnerId: task.author.id,
        targetUserId: currentLoggedUser.id
      })
    };

    return Response.json({ task, can });
  } catch (error) {
    console.error("Error fetching task:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération de la tâche." }, { status: 500 });
  }
};


export default function TaskDetails() {
  const { task, can } = useLoaderData<typeof loader>();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "To Do":
        return (
          <Badge variant="secondary" className="text-base px-3 py-1">
            <Clock className="mr-2 h-5 w-5" /> À faire
          </Badge>
        );
      case "In Progress":
        return (
          <Badge variant="default" className="text-base px-3 py-1">
            <AlertCircle className="mr-2 h-5 w-5" /> En cours
          </Badge>
        );
      case "Completed":
        return (
          <Badge variant="success" className="text-base px-3 py-1">
            <CheckCircle2 className="mr-2 h-5 w-5" /> Terminé
          </Badge>
        );
      default:
        return <Badge className="text-base px-3 py-1">{status}</Badge>;
    }
  };

  const renderAssignedToSection = (title: string, items: any[]) => (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">{title}</h4>
      {items.length > 0 ? (
        <ScrollArea className="h-[200px] w-full rounded-md border">
          <ul className="p-4">
            {items.map((item) => (
              <li key={item.id} className="text-base py-2 border-b last:border-0">
                {item.firstName && item.lastName
                  ? `${item.firstName} ${item.lastName}`
                  : item.name || item.title}
              </li>
            ))}
          </ul>
        </ScrollArea>
      ) : (
        <p className="text-base text-muted-foreground">Aucun élément assigné</p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/task">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-2xl sm:text-3xl font-bold">{task.title}</span>
            {getStatusBadge(task.status)}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-8">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Description</h3>
            <p className="text-base">
              {task.description || "Aucune description fournie"}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Assigné à</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {renderAssignedToSection("Utilisateurs", task.assignedTo.users)}
              {renderAssignedToSection("Postes", task.assignedTo.positions)}
              {renderAssignedToSection("Équipes", task.assignedTo.teams)}
              {renderAssignedToSection("Départements", task.assignedTo.departments)}
              {renderAssignedToSection("Groupes Horaires", task.assignedTo.hourGroups)}
              {renderAssignedToSection("Groupes d'Accès", task.assignedTo.access)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Date d'échéance</h3>
              <p className="text-base">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleString()
                  : "Non spécifiée"}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Auteur</h3>
              <p className="text-base">
                {task.author.firstName} {task.author.lastName}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Date de création</h3>
              <p className="text-base">
                {new Date(task.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Dernière mise à jour</h3>
              <p className="text-base">
                {new Date(task.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>

        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
          <Button 
            asChild
            className="w-full sm:w-auto h-12 text-base"
          >
            <Link prefetch="intent" to={`/o/task/edit/${task.id}`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier la tâche
            </Link>
          </Button>
        </CardFooter>
        )}
      </Card>
    </div>
  );
}


