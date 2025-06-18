/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Link,
  useLoaderData,
  Form,
  useSearchParams,
  useFetcher,
  useNavigation,
} from "@remix-run/react";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { useEffect, useState } from "react";
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
  Search,
  Edit,
  Trash2,
  Eye,
  Badge,
  Lock,
  Globe,
  Users,
} from "lucide-react";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { userService } from "~/services/user.service.server";
import { noteService } from "~/services/note.service.server";
import { LoaderFunction } from "@remix-run/node";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { NoteActions, UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await authService.requireUser(request, {condition: UserActions.ViewOneOwnProfileNotesInsight});
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;
  const visibility = url.searchParams.get("visibility") || "all";
  const user = await userService.readOne({
    id: params.id,
    populate: "avatar,currentHourGroup,currentPosition",
  });

  try {
    const filters: any = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ],
      author: params.id
    };

   

    const notes = await noteService.readManyPaginated(filters, {
      limit,
      page,
      sortBy: "createdAt:desc",
      populate: "author,attachments",
    });

    const can =  {
      view: await authService.can(currentUser?.id as string, UserActions.View),
      note: {
        view: await authService.can(currentUser?.id as string, NoteActions.View)
      }
    }

    return Response.json({ notes, search, user, page, limit, visibility, can });
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw Response.json(
      { message: "Une erreur est survenue lors de la récupération des notes." },
      { status: 500 }
    );
  }
};

export default function TaskList() {
  const { notes, search, page, limit, user, can } = useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const [isClient, setIsClient] = useState(false);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit(
      { id, action: "delete" },
      { method: "post", action: "/o/notes" }
    );
    setOpenDialog(null);
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setIsProcessing(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams((prev) => {
      prev.set("search", searchTerm);
      return prev;
    });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "Private":
        return <Lock className="h-5 w-5" />;
      case "Public":
        return <Globe className="h-5 w-5" />;
      case "Shared":
        return <Users className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getAuthorName = (author) => {
    if (!author) return "Unknown Author";
    return (
      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
      "Unknown Author"
    );
  };

  if (!isClient) {
    return null; // or a loading indicator
  }

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
        <CompactUserHeader user={user} can={can}/>
        <h1 className="text-3xl font-bold mt-4 text-center">
          Prise de notes Partagées
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
                placeholder="Rechercher des notes..."
                defaultValue={search}
                className="h-12 text-base"
              />
              <Button type="submit" className="h-12 w-12 flex-shrink-0  rounded-full border-2 border-primary">
                <Search className="h-5 w-5" />
              </Button>
            </Form>
          </div>

          {isLoading ? (
            <LoadingSkeleton view={"list"} itemCount={limit} />
          ) : notes.results.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base whitespace-nowrap">
                      Titre
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Auteur
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap">
                      Visibilité
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden md:table-cell">
                      Date de création
                    </TableHead>
                    <TableHead className="text-base text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.results.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium text-base">
                        {note.title}
                      </TableCell>
                      <TableCell className="text-base hidden sm:table-cell">
                        {getAuthorName(note.author)}
                      </TableCell>
                      <TableCell>
                        <div
                          className="h-8 text-base px-3 py-1 flex"
                        >
                          {getVisibilityIcon(note.visibility)}
                          <span className="ml-2">{note.visibility}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-base hidden md:table-cell">
                        {new Date(note.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {can?.note?.view && (
                          <Button
                            asChild
                            variant="outline"
                            className="h-12 text-base px-3"
                          >
                            <Link
                              prefetch="intent"
                              to={`/o/note/view/${note.id}`}
                            >
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
          ) : (
            <NoDataMessage
              type="notes"
              createLink="/o/task/new"
              view={"list"}
            />
          )}

          {notes.totalResults > 0 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                onClick={() =>
                  setSearchParams((prev) => {
                    prev.set("page", (page - 1).toString());
                    return prev;
                  })
                }
                disabled={page === 1}
                className="w-full sm:w-auto h-12 text-base"
              >
                Précédent
              </Button>
              <span className="text-base">
                Page {page} sur {Math.ceil(notes.totalResults / limit)}
              </span>
              <Button
                onClick={() =>
                  setSearchParams((prev) => {
                    prev.set("page", (page + 1).toString());
                    return prev;
                  })
                }
                disabled={page * limit >= notes.totalResults}
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
