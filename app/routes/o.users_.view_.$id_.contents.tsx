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
import { Search, Edit, Trash2, Eye } from "lucide-react";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { userService } from "~/services/user.service.server";
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
import { collaboratorVideoService } from "~/services/collaboratorVideo.service.server";
import { CollaboratorVideoActions, UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentLoggedUser =   await authService.requireUser(request, {condition: {any: [UserActions.ViewOnProfileVideoInsight] }});
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
    const videos = await collaboratorVideoService.readManyPaginated(
      {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
        user: userId,
      },
      { limit, page, sortBy: "createdAt:desc" }
    );

    const can = {
      view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
      collaboratorVideo: {
        view: await authService.can(currentLoggedUser?.id as string, CollaboratorVideoActions.View)
      }
    }
    return Response.json({ videos, search, page, limit, user, can });
  } catch (error) {
    console.error("Error fetching collaborator videos:", error);
    throw Response.json(
      {
        message:
          "Une erreur est survenue lors de la récupération des unité de connaissances collaborateurs.",
      },
      { status: 500 }
    );
  }
};

export default function VideosAndContentsList() {
  const { videos, search, user, page, limit, can } = useLoaderData<typeof loader>();
  const [isDeleting, setIsDeleting] = useState(false);
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [searchParams, setSearchParams] = useSearchParams();

  const handleDelete = (id: string) => {
    setIsDeleting(true);
    submit({ id }, { method: "delete", action: `/o/collaborator-videos}` });
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchParams({ search });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-6 max-w-6xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <CompactUserHeader user={user}  can={can} />
        <h1 className="text-3xl font-bold mt-4 text-center">
          Vidéos et Contenus Associés
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
              className="flex items-center gap-2 w-full sm:w-auto sm:flex-1"
              onSubmit={handleSearch}
            >
              <Input
                type="search"
                name="search"
                placeholder="Rechercher des unité de connaissances..."
                onChange={(e) => setSearchParams({ search: e.target.value })}
                defaultValue={search ?? ""}
                className="h-12 text-base  rounded-full border-2 border-primary"
              />
              <Button type="submit" className="h-12 w-12 flex-shrink-0  rounded-full border-2 border-primary">
                <Search className="h-5 w-5" />
              </Button>
            </Form>
          </div>

          {isLoading ? (
            <LoadingSkeleton view={"list"} itemCount={limit} />
          ) : videos.results.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">Titre</TableHead>
                    <TableHead className="text-base hidden sm:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="text-base text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.results.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium text-base">
                        {video.title}
                      </TableCell>
                      <TableCell className="text-base hidden sm:table-cell">
                        {video.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {can?.collaboratorVideo?.view && (
                          <Button
                            asChild
                            variant="outline"
                            className="h-11 w-11"
                          >
                            <Link
                              prefetch="intent"
                              to={`/o/collaborator-videos/view/${video.id}`}
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                          </Button>)}
                        </div>
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

          {videos.totalResults > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                onClick={() =>
                  setSearchParams({ search, page: (page - 1).toString() })
                }
                disabled={page === 1}
                className="w-full sm:w-auto h-11 text-base"
              >
                Précédent
              </Button>
              <span className="text-base">
                Page {page} sur {Math.ceil(videos.totalResults / limit)}
              </span>
              <Button
                onClick={() =>
                  setSearchParams({ search, page: (page + 1).toString() })
                }
                disabled={page * limit >= videos.totalResults}
                className="w-full sm:w-auto h-11 text-base"
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
