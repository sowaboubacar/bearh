import { useState, useEffect } from "react";
import { LoaderFunction, ActionFunction, json } from "@remix-run/node";
import {
  useLoaderData,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Globe,
  Lock,
} from "lucide-react";
import { newsService } from "~/services/news.service.server";
import NoDataMessage from "~/components/val/no-data-message";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import { getFirstImage } from "~/core/utils/media/attachments";
import { authService } from "~/services/auth.service.server";
import { NewsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition:{any: [NewsActions.List]}});
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 5;
  const visibility = url.searchParams.get("visibility") || "all";

  try {
    const filters: any = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ],
    };

    if (visibility !== "all") {
      filters.isPublic = visibility === "public";
    }

    const news = await newsService.readManyPaginated(filters, {
      limit,
      page,
      sortBy: "updatedAt:desc",
      populate: "author,attachments",
    });
    const can = {
      create: await authService.can(
        currentLoggedUser?.id as string,
        NewsActions.Create
      ),
      edit: await authService.can(
        currentLoggedUser?.id as string,
        NewsActions.Edit
      ),
      delete: await authService.can(
        currentLoggedUser?.id as string,
        NewsActions.Delete
      ),
      view: await authService.can(
        currentLoggedUser?.id as string,
        NewsActions.View
      ),
    };

    return Response.json({ news, search, page, limit, visibility, can });
  } catch (error) {
    console.error("Error fetching news:", error);
    throw json(
      {
        message:
          "Une erreur est survenue lors de la récupération des notes de services.",
      },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {condition: {any: [NewsActions.Delete]}});
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  try {
    if (action === "delete") {
      await newsService.deleteOne(id);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error processing news action:", error);
    throw json(
      {
        message:
          "Une erreur est survenue lors du traitement de l'action sur l'actualité.",
      },
      { status: 500 }
    );
  }
};

export default function NewsList() {
  const { news, search, page, limit, visibility, can } =
    useLoaderData<typeof loader>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const [isClient, setIsClient] = useState(false);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setIsProcessing(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleDelete = (id: string) => {
    setIsProcessing(true);
    fetcher.submit({ id, action: "delete" }, { method: "post" });
    setOpenDialog(null);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchTerm = formData.get("search") as string;
    setSearchParams((prev) => {
      prev.set("search", searchTerm);
      return prev;
    });
  };

  const handleVisibilityChange = (newVisibility: string) => {
    setSearchParams((prev) => {
      prev.set("visibility", newVisibility);
      return prev;
    });
  };

  const getVisibilityIcon = (isPublic: boolean) => {
    return isPublic ? (
      <Globe className="h-4 w-4" />
    ) : (
      <Lock className="h-4 w-4" />
    );
  };

  // if (!isClient) {
  //   return null
  // }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Notes de Services
        </h1>

        {can?.create && (
          <Button asChild className="w-full sm:w-auto h-12 text-base">
          <Link prefetch="intent" to="/o/news/new">
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle Publication
          </Link>
        </Button>
        )}
        
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <Form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full sm:w-auto sm:flex-1"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des notes de services..."
            defaultValue={search}
            className="h-12 text-base"
          />
          <Button type="submit" className="h-12 w-12 flex-shrink-0">
            <Search className="h-5 w-5" />
          </Button>
        </Form>

        <Select value={visibility} onValueChange={handleVisibilityChange}>
          <SelectTrigger className="h-12 text-base w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer par visibilité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-base">
              Toutes
            </SelectItem>
            <SelectItem value="public" className="text-base">
              Publiques
            </SelectItem>
            <SelectItem value="private" className="text-base">
              Privées
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {news.totalResults > 0 && (
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
            Page {page} sur {Math.ceil(news.totalResults / limit)} /{" "}
            {news.totalResults} notes de services
          </span>
          <Button
            onClick={() =>
              setSearchParams((prev) => {
                prev.set("page", (page + 1).toString());
                return prev;
              })
            }
            disabled={page * limit >= news.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
      {isLoading ? (
        <LoadingSkeleton view="timeline" itemCount={limit} />
      ) : news.results.length > 0 ? (
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200 hidden sm:block"></div>
          <div className="space-y-6 sm:space-y-12">
            {news.results.map((item, index) => (
              <div
                key={item.id}
                className={`relative ${
                  index % 2 === 0 ? "sm:ml-auto sm:pl-8" : "sm:mr-auto sm:pr-8"
                } sm:w-1/2 w-full`}
              >
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full hidden sm:block"></div>
                <Card
                  className={`w-full ${
                    index % 2 === 0 ? "sm:ml-4" : "sm:mr-4"
                  }`}
                >
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {can?.view && (
                        <Link prefetch="intent" to={`/o/news/view/${item.id}`}>
                        <span className="text-xl sm:text-2xl">
                          {item.title}
                        </span>
                      </Link>
                      )}
                      
                      <Badge
                        variant={item.isPublic ? "default" : "secondary"}
                        className="h-8 text-base px-3 py-1"
                      >
                        {getVisibilityIcon(item.isPublic)}
                        <span className="ml-2">
                          {item.isPublic ? "Public" : "Privé"} 
                        </span>
                      </Badge>
                      
                    </CardTitle>

                      {can?.view && (
                         <Link prefetch="intent" to={`/o/news/view/${item.id}`}>
                         <div
                           className="relative w-full h-40 sm:h-48 bg-cover bg-center rounded-md mt-4 text-center justify-center"
                           style={{
                             backgroundColor: " #00787d",
                             backgroundImage: `url(${
                               getFirstImage(item.attachments || [])?.file?.url
                             })`,
                           }}
                         >
                           {(item.isEmergency==true) && (
                             <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md">
                               Urgence
                             </div>
                           )}
                         </div>
                       </Link>
                      )}
                     
                    
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-2">
                    <p className="text-base text-muted-foreground">
                      Type : {item.type}
                    </p>
                    <p className="text-base text-muted-foreground">
                      Auteur : {item.author.firstName} {item.author.lastName}
                    </p>
                    <p className="text-base text-muted-foreground">
                      Mis à jour le :{" "}
                      {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 sm:p-6 flex justify-between gap-3">
                    {can?.view  && (

                      <Button
                      asChild
                      variant="outline"
                      className="h-12 text-base flex-1"
                      >
                      <Link prefetch="intent" to={`/o/news/view/${item.id}`}>
                        <Eye className="mr-2 h-5 w-5" />
                      </Link>
                    </Button>
                    )}

                    {can?.edit && (
                      <Button
                      asChild
                      variant="outline"
                      className="h-12 text-base flex-1"
                      >
                        <Link prefetch="intent" to={`/o/news/edit/${item.id}`}>
                          <Edit className="mr-2 h-5 w-5" />
                        </Link>
                      </Button>
                    )}
                    
                    {can?.delete && (
                      <Dialog
                      open={openDialog === item.id}
                      onOpenChange={(open) =>
                        setOpenDialog(open ? item.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="h-12 text-base flex-1"
                        >
                          <Trash2 className="mr-2 h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="text-xl">
                            Êtes-vous sûr de vouloir supprimer cette actualité ?
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Cette action ne peut pas être annulée.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-3 sm:gap-0">
                          <Button
                            variant="outline"
                            onClick={() => setOpenDialog(null)}
                            className="h-12 text-base"
                          >
                            Annuler
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                            disabled={isProcessing}
                            className="h-12 text-base"
                          >
                            {isProcessing ? "Suppression..." : "Supprimer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    )}
                    
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <NoDataMessage
          type="notes de services"
          createLink="/o/news/new"
          view="timeline"
        />
      )}

      {news.totalResults > 0 && (
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
            Page {page} sur {Math.ceil(news.totalResults / limit)} /{" "}
            {news.totalResults} notes de services
          </span>
          <Button
            onClick={() =>
              setSearchParams((prev) => {
                prev.set("page", (page + 1).toString());
                return prev;
              })
            }
            disabled={page * limit >= news.totalResults}
            className="w-full sm:w-auto h-12 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
