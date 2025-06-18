/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunction } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  Form,
  useSearchParams,
  useFetcher,
  useSubmit,
  useNavigation,
} from "@remix-run/react";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import NoDataMessage from "~/components/val/no-data-message";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Badge,
  AlertCircle,
  Clock,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { taskService } from "~/services/task.service.server";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { userService } from "~/services/user.service.server";
import { Checkbox } from "~/components/ui/checkbox";
import { TaskActions, UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: UserActions.ViewOnProfileTaskInsight});
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentDepartment and departmentsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  try {

    //@TODO: Update the query to only retrieve tasks assigned to the user or authored by the user
    //author: userId,
    //"assignedTo.users": userId,
    const tasks = await taskService.readManyPaginated(
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { status: { $regex: search, $options: "i" } },
          { "assignedTo.users": userId },
          { "assignedTo.positions": user?.currentPosition?.id },
          { "assignedTo.teams": user?.currentTeam },
          { "assignedTo.departments": user?.currentDepartment },
          { "assignedTo.hourGroups": user?.currentHourGroup },
          { "assignedTo.access": user?.access },
          { "assignedTo.access": user?.currentPosition?.access },
          {author: userId}
        ],
      },
      {
        limit,
        page,
        sortBy: "createdAt:desc",
        populate:
          "assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access,author",
      }
    );

    const can =  {
      view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
      task: {
        view: await authService.can(currentLoggedUser?.id as string, {any: [TaskActions.View]})
      }
    }
    return Response.json({ tasks, search, page, limit, user, can });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw Response.json(
      {
        message: "Une erreur est survenue lors de la récupération des tasks.",
      },
      { status: 500 }
    );
  }
};

export default function TaskList() {
  const { tasks, search, user, page, limit, can } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigation = useNavigation();

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
  };

  const handleToggleComplete = (id: string) => {
    fetcher.submit(
      { id, action: "toggleComplete" },
      { method: "post", action: "/o/task" }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "To Do":
        return (
          <div className="text-base px-3 py-1 text-yellow-500 font-bold flex">
            <Clock className="mr-2 h-5 w-5" /> À faire
          </div>
        );
      case "In Progress":
        return (
          <div className="text-base px-3 py-1 text-primary font-bold flex">
            <AlertCircle className="mr-2 h-5 w-5" /> En cours
          </div>
        );
      case "Completed":
        return (
          <Badge className="text-base px-3 py-1 text-green-500 font-bold flex">
            <CheckCircle2 className="mr-2 h-5 w-5" /> Terminé
          </Badge>
        );
      default:
        return <Badge className="text-base px-3 py-1">{status}</Badge>;
    }
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-6 max-w-8xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <CompactUserHeader user={user} can={can} />
        <h1 className="text-3xl font-bold mt-4 text-center">
          Tâche en Eours/Assigné/Effectué
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <Form className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
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
            <LoadingSkeleton view={"list"} itemCount={limit} />
          ) : tasks.results.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">Titre</TableHead>
                    <TableHead className="text-base hidden md:table-cell">
                      Statut
                    </TableHead>
                    <TableHead className="text-base text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.results.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-base">
                        {task.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {can?.task?.view && (
                        <Link to={`/o/task/view/${task.id}`}>
                          <Button variant="ghost" className="h-12 w-12">
                            <Eye className="h-5 w-5" />
                            <span className="sr-only">Voir</span>
                          </Button>
                        </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <NoDataMessage
              type="tasks"
              createLink="/o/task/new"
              view={"list"}
            />
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
      </motion.div>
    </motion.div>
  );
}
