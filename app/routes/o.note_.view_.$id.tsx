import { LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  ArrowLeft,
  Edit,
  Lock,
  Globe,
  Users,
  AlertTriangle,
} from "lucide-react";
import { noteService } from "~/services/note.service.server";
import { authService } from "~/services/auth.service.server";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { NoteActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [NoteActions.ViewOwn, NoteActions.View] }
  });

  try {
    const note = await noteService.readOne({
      id: params.id,
      populate: "attachments,author,sharedWith.users,sharedWith.positions,sharedWith.teams,sharedWith.departments,sharedWith.hourGroups,sharedWith.access"
    });

    if (!note) {
      throw Response.json({ message: "Note non trouvée" }, { status: 404 });
    }

    // Check if user has permission to view this specific note
    const hasFullViewAccess = await authService.can(currentUser.id, NoteActions.View);
    const canViewOwn = await authService.can(currentUser.id, NoteActions.ViewOwn, {
      resourceOwnerId: note.author.toString(),
      targetUserId: currentUser.id
    });

    if (!hasFullViewAccess && !canViewOwn && note.visibility !== "Public" && 
        !note.sharedWith?.users?.includes(currentUser.id)) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      edit: await authService.can(currentUser.id, {
        any: [NoteActions.Edit, NoteActions.EditOwn]
      }, {
        resourceOwnerId: note.author.toString(),
        targetUserId: currentUser.id
      }),
      list: await authService.can(currentUser.id, {
        any: [NoteActions.List, NoteActions.ListOwn]
      })
    };

    return Response.json({ note, can });
  } catch (error) {
    console.error("Error fetching note:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération de la note" },
      { status: 500 }
    );
  }
};

export default function NoteDetails() {
  const { note, can } = useLoaderData<typeof loader>();

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

  const renderSharedWithSection = (title: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    return (
      <Card className="shadow-none border">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-48 px-4">
            {items.map((item) => (
              <div key={item.id} className="py-3">
                <p className="text-base">
                  {item.firstName && item.lastName
                    ? `${item.firstName} ${item.lastName}`
                    : item.name || item.title}
                </p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {can?.list && (
      <Button asChild variant="outline" className="mb-6 h-12 text-base">
        <Link prefetch="intent" to="/o/note">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {note.title}
            </span>
            <span className="flex items-center text-base font-medium">
              {getVisibilityIcon(note.visibility)}
              <span className="ml-2">{note.visibility}</span>
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">Contenu</h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {note.content}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">Auteur</h3>
            <p className="text-base">
              {note.author.firstName} {note.author.lastName}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Date de création
            </h3>
            <p className="text-base">
              {new Date(note.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Dernière mise à jour
            </h3>
            <p className="text-base">
              {new Date(note.updatedAt).toLocaleString()}
            </p>
          </div>

          {note.visibility === "Shared" && note.sharedWith && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Partagée avec
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderSharedWithSection("Utilisateurs", note.sharedWith.users)}
                {renderSharedWithSection("Postes", note.sharedWith.positions)}
                {renderSharedWithSection("Équipes", note.sharedWith.teams)}
                {renderSharedWithSection(
                  "Départements",
                  note.sharedWith.departments
                )}
                {renderSharedWithSection(
                  "Groupes Horaires",
                  note.sharedWith.hourGroups
                )}
                {renderSharedWithSection(
                  "Groupes d'Accès",
                  note.sharedWith.access
                )}
              </div>
            </div>
          )}

          {note.attachments && note.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={note.attachments} />
            </div>
          )}
        </CardContent>
        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">

         
            <Button asChild className="w-full sm:w-auto h-12 text-base">
            <Link prefetch="intent" to={`/o/note/edit/${note.id}`}>
              <Edit className="mr-2 h-5 w-5" />
              Modifier la note
            </Link>
          </Button>
          
          
        </CardFooter>
        )}
      </Card>
    </div>
  );
}
