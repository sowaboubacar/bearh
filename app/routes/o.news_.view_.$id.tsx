import { useState } from "react";
import {
  LoaderFunction,
  ActionFunction,
  json,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  useNavigation,
  Link,
  useRouteError,
  isRouteErrorResponse,
  useFetcher,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Lock,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { newsService } from "~/services/news.service.server";
import { authService } from "~/services/auth.service.server";
import { DialogClose } from "@radix-ui/react-dialog";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { getFirstImage } from "~/core/utils/media/attachments";
import { NewsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition:{any: [NewsActions.List]}});
  const { id } = params;

  try {
    const news = await newsService.readOne({
      id,
      populate:
        "author,attachments,targetAudience.users,targetAudience.access,targetAudience.teams,targetAudience.departments,targetAudience.positions",
    });
    const can = {
      edit: await authService.can(
        currentLoggedUser?.id as string,
        NewsActions.Edit
      ),
      delete: await authService.can(
        currentLoggedUser?.id as string,
        NewsActions.Delete
      ),
      list: await authService.can(currentLoggedUser?.id as string, {any: [NewsActions.List]}),
    };
    return Response.json({ news, can });
  } catch (error) {
    console.error("Error in loader:", error);
    throw json(
      { message: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [NewsActions.Delete]}})
  const { id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    try {
      await newsService.deleteOne(id);
      return redirect("/o/news");
    } catch (error) {
      console.error("Error deleting news:", error);
      return Response.json(
        { success: false, error: "Échec de la suppression de l'actualité" },
        { status: 400 }
      );
    }
  }

  return Response.json(
    { success: false, error: "Action non reconnue" },
    { status: 400 }
  );
};

export default function ViewNews() {
  const { news, can } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    fetcher.submit({ intent: "delete" }, { method: "post" });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "Private":
        return <Lock className="h-4 w-4" />;
      case "Public":
        return <Globe className="h-4 w-4" />;
      case "Shared":
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {can?.list && (
      <Button asChild variant="outline" className="mb-6 h-12 text-base">
        <Link prefetch="intent" to="/o/news">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {news.title}
            </CardTitle>
            <Badge
              variant={news.isPublic ? "default" : "secondary"}
              className="h-8 text-base px-3 py-1"
            >
              {getVisibilityIcon(news.isPublic ? "Public" : "Private")}
              <span className="ml-2">{news.isPublic ? "Public" : "Privé"}</span>
            </Badge>
          </div>
        </CardHeader>

        {news.attachments?.length > 0 && (
          <div className="relative w-full">
            {/* <img
              src={getFirstImage(news.attachments)?.file?.url}
              alt={getFirstImage(news.attachments)?.label || ""}
              className="w-full h-[200px] sm:h-[300px] lg:h-[400px] object-cover"
            /> */}
            <div
              className="w-full h-[200px] sm:h-[300px] lg:h-[400px] object-cover relativ  bg-cover bg-center rounded-md mt-4"
              style={{
                backgroundImage: `url(${
                  getFirstImage(news.attachments)?.file?.url
                })`,
              }}
            >
              {news.isEmergency == true && (
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-md">
                  Urgence
                </div>
              )}
            </div>
          </div>
        )}

        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">Contenu</h3>
            <p className="text-base leading-relaxed">{news.content}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">Détails</h3>
            <div className="space-y-2 text-base">
              <p>
                <span className="font-medium">Type:</span> {news.type}
              </p>
              <p>
                <span className="font-medium">Auteur:</span>{" "}
                {news.author.firstName} {news.author.lastName}
              </p>
              <p>
                <span className="font-medium">Date de création:</span>{" "}
                {new Date(news.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Dernière mise à jour:</span>{" "}
                {new Date(news.updatedAt).toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Statut de publication:</span>{" "}
                {news.isPublished ? "Publié" : "Non publié"}
              </p>
              {news.publishedAt && (
                <p>
                  <span className="font-medium">Date de publication:</span>{" "}
                  {new Date(news.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {!news.isPublic && news.targetAudience && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">Public cible</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "users",
                  "positions",
                  "teams",
                  "departments",
                  "hourGroups",
                  "access",
                ].map(
                  (category) =>
                    news.targetAudience[category] &&
                    news.targetAudience[category].length > 0 && (
                      <Card key={category} className="shadow-none border">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base font-semibold capitalize">
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-40 px-4">
                            {news.targetAudience[category].map((item) => (
                              <div key={item.id} className="py-2 text-base">
                                {category === "users"
                                  ? `${item.firstName} ${item.lastName}`
                                  : item.name || item.title}
                              </div>
                            ))}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )
                )}
              </div>
            </div>
          )}

          {news.attachments && news.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={news.attachments} />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 sm:p-6 flex justify-between gap-4">
          {can?.edit && (
            <Button
            asChild
            variant="outline"
            className="h-12 text-base flex-1 sm:flex-none"
          >
            <Link prefetch="intent" to={`/o/news/edit/${news.id}`}>
              <Edit className="mr-2 h-5 w-5" />
              Modifier
            </Link>
          </Button>
          )}

          {can?.delete && (
            <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-12 text-base flex-1 sm:flex-none"
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Supprimer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Êtes-vous sûr de vouloir supprimer cette actualité ?
                </DialogTitle>
                <DialogDescription className="text-base">
                  Cette action ne peut pas être annulée. Cela supprimera
                  définitivement cette actualité.
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
                  onClick={handleDelete}
                  disabled={isDeleting || navigation.state === "submitting"}
                  className="h-12 text-base"
                >
                  {isDeleting || navigation.state === "submitting"
                    ? "Suppression..."
                    : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
          
        </CardFooter>
      </Card>
    </div>
  );
}
