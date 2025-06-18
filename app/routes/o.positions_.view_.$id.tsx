import { type LoaderFunction } from "@remix-run/node";
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
  CardHeader,
  CardTitle,
  CardFooter,
} from "~/components/ui/card";
import { positionService } from "~/services/position.service.server";
import { ArrowLeft, Edit, AlertTriangle, SaveOff, KeyIcon } from "lucide-react";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { authService } from "~/services/auth.service.server";
import { PositionActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PositionActions.List]}})
  try {
    const position = await positionService.readOne({
      id: params.id,
      populate: "access,attachments,members",
    });

    if (!position) {
      throw Response.json({ message: "Position non trouvée" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [PositionActions.List]}),
    }
    return Response.json({ position, can });
  } catch (error) {
    console.error("Error fetching position:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération de la position.",
      },
      { status: 500 }
    );
  }
};

export default function PositionDetailPage() {
  const { position, can } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/positions">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
        </Button>
      )}
  
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {position.title}
            </CardTitle>
            {can?.edit && (
            <Button 
              asChild
              className="w-full sm:w-auto h-12 text-base"
            >
              <Link prefetch="intent" to={`/o/positions/edit/${position.id}`}>
                <Edit className="mr-2 h-5 w-5" />
                Modifier
              </Link>
            </Button>
            )}
          </div>
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-8">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Description
            </h3>
            <p className="text-base text-muted-foreground whitespace-pre-wrap">
              {position.description || "Aucune description fournie"}
            </p>
          </div>
  
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Droit d'Accès
            </h3>
            <div className="flex items-center gap-3">
              <KeyIcon className="h-5 w-5" />
              <span className="text-base">
                {position.access?.name}
              </span>
            </div>
          </div>
  
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">
              Membres
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {position.members?.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={member.avatar} 
                      alt={`${member.firstName} ${member.lastName}`} 
                    />
                    <AvatarFallback className="text-base">
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
              ))}
            </div>
          </div>
  
          {position.attachments && position.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={position.attachments} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )  
}
