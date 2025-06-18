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
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { teamService } from "~/services/team.service.server";
import { ArrowLeft, Edit, AlertTriangle } from "lucide-react";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { authService } from "~/services/auth.service.server";
import { TeamActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [TeamActions.View] }});
  try {
    const team = await teamService.readOne({
      id: params.id,
      populate: "leader,members,attachments",
    });

    if (!team) {
      throw Response.json({ message: "Équipe non trouvée" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, TeamActions.List),
      edit: await authService.can(currentLoggedUser?.id as string, TeamActions.Edit),
    }

    return Response.json({ team, can });
  } catch (error) {
    console.error("Error fetching team:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération de l'équipe.",
      },
      { status: 500 }
    );
  }
};


export default function TeamDetailPage() {
  const { team, can } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/teams">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {team.name}
          </CardTitle>

          {can?.edit && (
          <Button 
            asChild
            className="h-12 text-base"
          >
            <Link prefetch="intent" to={`/o/teams/edit/${team.id}`}>
              <Edit className="mr-2 h-5 w-5" />
              <span>Modifier</span>
            </Link>
          </Button>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-8">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Description</h3>
            <p className="text-base text-muted-foreground">
              {team.description || "Aucune description fournie"}
            </p>
          </div>

          {team.leader && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Chef d'équipe</h3>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={team.leader.avatar}
                    alt={`${team.leader.firstName} ${team.leader.lastName}`}
                  />
                  <AvatarFallback className="text-base">
                    {team.leader.firstName[0]}
                    {team.leader.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-base">
                  {team.leader.firstName} {team.leader.lastName}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Membres de l'équipe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={member.avatar}
                      alt={`${member.firstName} ${member.lastName}`}
                    />
                    <AvatarFallback className="text-base">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base">
                    {member.firstName} {member.lastName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {team.attachments && team.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={team.attachments} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



