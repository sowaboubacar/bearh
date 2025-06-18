import { useState } from "react";
import { LoaderFunction, ActionFunction, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  Form,
  useFetcher,
  useNavigation,
  Link,
  isRouteErrorResponse,
  useRouteError,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Grid,
  List,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { taskService } from "~/services/task.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { ErrorComponent } from "~/components/val/error-component";
import { authService } from "~/services/auth.service.server";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskActions } from "~/core/entities/utils/access-permission";


export const loader: LoaderFunction = async ({ request }) => {

  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [TaskActions.List, TaskActions.ListOwn] }
  });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const view = url.searchParams.get("view") || "pills";
  const limit = 12;

  try {
    // Create query based on permissions
    let query: any = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ],
    };

    // If user only has ListOwn permission, filter for their tasks
    const hasFullListAccess = await authService.can(currentLoggedUser.id, TaskActions.List);
    if (!hasFullListAccess) {
      query = {
        $and: [
          query,
          {
            $or: [
              { author: currentLoggedUser.id },
              { 'assignedTo.users': currentLoggedUser.id }
            ]
          }
        ]
      };
    }

    const tasks = await taskService.readManyPaginated(query, {
      limit,
      page,
      sortBy: "createdAt:desc",
      populate: "assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access,author"
    });

    const can = {
      create: await authService.can(currentLoggedUser?.id as string, {any: [TaskActions.Create]}),
      edit: await authService.can(currentLoggedUser?.id as string, {any: [TaskActions.Edit, TaskActions.EditOwn]}),
      delete: await authService.can(currentLoggedUser?.id as string, {any: [TaskActions.Delete, TaskActions.DeleteOwn]}),
    }
    return Response.json({ tasks, search, view, page, limit, can });
  } catch (error) {
    console.error("Error fetching task items:", error);
    throw Response.json(
      {
        message:
          "Nous avons rencontré une erreur lors de la récupération des données",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
 
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;
  let requirement;

  switch(action) {
    case 'delete':
    requirement = {any: [TaskActions.Delete, TaskActions.DeleteOwn]};
    break;
    case 'toggleComplete':
    requirement = {any: [TaskActions.Edit, TaskActions.EditOwn]}
    break;
    default: 
    requirement = {any: [TaskActions.Delete, TaskActions.DeleteOwn]};
  }

 await authService.requireUser(request, {
    condition: requirement,
  });

  try {
    if (action === "delete") {
      await taskService.deleteOne(id);
    } else if (action === "toggleComplete") {
      const task = await taskService.readOne(id);
      const newStatus = task.status === "Completed" ? "To Do" : "Completed";
      await taskService.updateOne(id, { status: newStatus });
    }

    return redirect("/o/task");
  } catch (error) {
    console.error("Error processing task action:", error);
    throw Response.json(
      { message: "Error processing task action" },
      { status: 500 }
    );
  }
};

export default function TaskList() {
  const { tasks, search, page, limit, can } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigation = useNavigation();

  const todoTasks = tasks.results.filter(task => task.status !== "Completed");
  const completedTasks = tasks.results.filter(task => task.status === "Completed");

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const taskId = result.draggableId;
    const isMovingToCompleted = destination.droppableId === "completed";

    fetcher.submit(
      { id: taskId, action: "toggleComplete" },
      { method: "post" }
    );
  };

  const TaskPill = ({ task, index }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group relative flex items-center gap-2 p-4 rounded-full bg-card hover:bg-accent transition-all duration-200 border shadow-sm hover:shadow-md ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
          }`}
        >
          <Checkbox
            checked={task.status === "Completed"}
            onCheckedChange={() => handleToggleComplete(task.id)}
            aria-label={`Marquer la tâche "${task.title}" comme ${
              task.status === "Completed" ? "non terminée" : "terminée"
            }`}
            className="h-5 w-5 flex-shrink-0"
          />
          
          <span className="flex-1 font-medium truncate text-base">
            {task.title}
          </span>

          <div className="flex items-center gap-1">

            {can?.view && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Link to={`/o/task/view/${task.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            )}
            
            {can?.edit && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Link to={`/o/task/edit/${task.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            )}

            {can?.delete && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    Êtes-vous sûr de vouloir supprimer cette tâche ?
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Cette action ne peut pas être annulée.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-3 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline" className="h-12 text-base">
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(task.id)}
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

          <div className="absolute -top-2 -right-2">
            {getStatusBadge(task.status)}
          </div>
        </div>
      )}
    </Draggable>
  );

  const TaskGroup = ({ title, tasks, droppableId }) => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold px-4">{title}</h2>
      <Droppable droppableId={droppableId} direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="overflow-x-auto pb-4"
          >
            <div className="flex gap-4 px-4 min-w-full w-max">
              {tasks.map((task, index) => (
                <div key={task.id} className="w-[300px] sm:w-[400px] flex-shrink-0">
                  <TaskPill task={task} index={index} />
                </div>
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
  };

  const handleToggleComplete = (id: string) => {
    fetcher.submit({ id, action: "toggleComplete" }, { method: "post" });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "To Do": "bg-secondary text-secondary-foreground",
      "In Progress": "bg-primary text-primary-foreground",
      "Completed": "bg-green-500 text-white dark:bg-green-600",
    };

    const icons = {
      "To Do": Clock,
      "In Progress": AlertCircle,
      "Completed": CheckCircle2,
    };

    const Icon = icons[status] || AlertTriangle;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[status] || "bg-gray-100 text-gray-800"}`}>
        <Icon className="h-3 w-3" />
      </span>
    );
  };
  
  const renderAssignedTo = (assignedTo) => {
    const allAssigned = [
      ...assignedTo.users,
      ...assignedTo.positions,
      ...assignedTo.teams,
      ...assignedTo.departments,
      ...assignedTo.hourGroups,
      ...assignedTo.access,
    ];
  
    const displayNames = allAssigned.map((item) =>
      item.firstName && item.lastName
        ? `${item.firstName} ${item.lastName}`
        : item.name || item.title
    );
  
    return displayNames.join(", ");
  };
  
  const isLoading = navigation.state === "loading";
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Gestion des Tâches
        </h1>
        {can?.create && (
        <Button asChild className="w-full sm:w-auto h-12 text-base">
          <Link to="/o/task/new">
            <Plus className="mr-2 h-5 w-5" /> Nouvelle Tâche
          </Link>
        </Button>
        )}
      </div>
  
      <div className="flex items-stretch gap-4">
        <Form className="flex items-center gap-2 w-full">
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des tâches..."
            defaultValue={search ?? ""}
            className="h-12 text-base"
          />
          <Button type="submit" className="h-12 w-12 flex-shrink-0">
            <Search className="h-5 w-5" />
          </Button>
        </Form>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton itemCount={limit} view="pills" />
      ) : tasks.results.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-8">
            <TaskGroup
              title="À faire"
              tasks={todoTasks}
              droppableId="todo"
            />
            <TaskGroup
              title="Terminées"
              tasks={completedTasks}
              droppableId="completed"
            />
          </div>
        </DragDropContext>
      ) : (
        <NoDataMessage type="tâches" createLink="/o/task/new" view="pills" />
      )}
  
      {tasks.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => submit({ page: page - 1 }, { method: "get" })}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(tasks.totalResults / limit)}
          </span>
          <Button
            onClick={() => submit({ page: page + 1 }, { method: "get" })}
            disabled={page * limit >= tasks.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}
