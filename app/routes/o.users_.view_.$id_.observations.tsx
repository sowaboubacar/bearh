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
  Search,
  Edit,
  Trash2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Badge,
} from "lucide-react";
import { observationService } from "~/services/observation.service.server";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { userService } from "~/services/user.service.server";
import { ObservationActions, UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
 const currentLoggedUser =  await authService.requireUser(request, {condition: UserActions.ViewOnProfileObservationInsight});
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
    const observations = await observationService.readManyPaginated(
      {
        $or: [
          { content: { $regex: search, $options: "i" } },
          { "user.firstName": { $regex: search, $options: "i" } },
          { "user.lastName": { $regex: search, $options: "i" } },
          { "author.firstName": { $regex: search, $options: "i" } },
          { "author.lastName": { $regex: search, $options: "i" } },
        ],
        user: userId
      },
      { limit, page, sortBy: "date:desc", populate: "user,author" }
    );

    const can =  {
      view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
      observation: {
        view: await authService.can(currentLoggedUser?.id as string, ObservationActions.View) 
      }
    }
    return Response.json({ observations, search, page, limit , user, can});
  } catch (error) {
    console.error("Error fetching observations:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des observations.",
      },
      { status: 500 }
    );
  }
};




export default function ObservationList() {
  const {
    observations,
    search,
    page,
    limit,
    user,
    can
  } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams({ search: searchTerm });
  };


  const getTypeIcon = (type: string) => {
    return type === "Positive" ? (
      <ThumbsUp className="h-4 w-4 text-green-500" />
    ) : (
      <ThumbsDown className="h-4 w-4 text-red-500" />
    );
  };

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
          Observation faites à {user.firstName} {user.lastName}
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
  
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Form 
          onSubmit={handleSearch} 
          className="flex items-center gap-2 w-full sm:w-auto sm:flex-1  rounded-full border-2 border-primary"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des remarques..."
            defaultValue={search}
            className="h-12 text-base"
          />
          <Button 
            type="submit"
            className="h-12 w-12 flex-shrink-0  rounded-full border-2 border-primary"
          >
            <Search className="h-5 w-5" />
          </Button>
        </Form>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={"list"} itemCount={limit} />
      ) : observations.results.length > 0 ? (
          <div className="rounded-lg border overflow-scroll">
            <Table className="overflow-scroll">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">Pour</TableHead>
                  <TableHead className="text-base whitespace-nowrap">Type</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Contenu</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Par</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden lg:table-cell">Le</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {observations.results.map((observation) => (
                  <TableRow key={observation.id}>
                    <TableCell className="font-medium text-base">
                      {observation.user.firstName} {observation.user.lastName}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="h-8 text-base px-3 py-1 flex"
                      >
                        {getTypeIcon(observation.type)}
                        <span className="ml-2">{observation.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate hidden md:table-cell text-base">
                      {observation.content}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base">
                      {observation.author.firstName} {observation.author.lastName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-base">
                      {new Date(observation.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.observation?.view && (
                        <Button 
                          asChild 
                          variant="outline"
                          className="h-12 text-base px-3"
                        >
                          <Link prefetch="intent" to={`/o/observation/view/${observation.id}`}>
                            <Eye className="h-5 w-5" />
                          </Link>
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
       : (
        <NoDataMessage
          type="observations"
          createLink="/o/observation/new"
          view={'list'}
        />
      )}
    
  
      {observations.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setSearchParams({ search,  page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-12 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(observations.totalResults / limit)}
          </span>
          <Button
            onClick={() => setSearchParams({ search, page: (page + 1).toString() })}
            disabled={page * limit >= observations.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
    </motion.div>

  </motion.div>
  )
   
}