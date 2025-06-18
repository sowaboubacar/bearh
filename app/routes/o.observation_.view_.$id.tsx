import { LoaderFunction } from '@remix-run/node'
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowLeft, Edit, ThumbsUp, ThumbsDown, AlertTriangle, Badge } from 'lucide-react'
import { observationService } from '~/services/observation.service.server'
import { authService } from '~/services/auth.service.server'
import { AttachmentGallery } from '~/components/AttachmentGallery'
import {ObservationActions} from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [ObservationActions.View, ObservationActions.ViewOwn] }
  });

  try {
    const observation = await observationService.readOne({
      id: params.id,
      populate: 'user,author,attachments'
    });

    if (!observation) {
      throw Response.json({ message: "Observation non trouvée" }, { status: 404 });
    }

    // Check if user has permission to view this specific observation
    const hasFullViewAccess = await authService.can(currentUser.id, ObservationActions.View);
    const canViewOwn = await authService.can(currentUser.id, ObservationActions.ViewOwn, {
      resourceOwnerId: observation.author.toString(),
      targetUserId: currentUser.id
    });

    if (!hasFullViewAccess && !canViewOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      edit: await authService.can(currentUser.id, {
        any: [ObservationActions.Edit, ObservationActions.EditOwn]
      }, {
        resourceOwnerId: observation.author.toString(),
        targetUserId: currentUser.id
      }),
      list: await authService.can(currentUser.id, {
        any: [ObservationActions.List, ObservationActions.ListOwn]
      })
    };

    return Response.json({ observation, can });
  } catch (error) {
    console.error("Error fetching observation:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération de l'observation" },
      { status: 500 }
    );
  }
};

export default function ObservationDetails() {
  const { observation, can } = useLoaderData<typeof loader>()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Positive':
        return <ThumbsUp className="h-6 w-6 text-green-500" />;
      case 'Neutral': 
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'Negative':
        return <ThumbsDown className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/observation">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xl sm:text-2xl font-bold">
              Remarque pour {observation.user.firstName} {observation.user.lastName}
            </span>
            <Badge 
              variant={
                observation.type === 'Positive' 
                  ? 'default' 
                  : observation.type === 'Neutral'
                    ? 'secondary'
                    : 'destructive'
              }
              className="h-8 text-base px-3 py-1"
            >
              {observation.type === 'Positive' && <ThumbsUp className="h-6 w-6 text-green-500" />}
              {observation.type === 'Neutral' && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
              {observation.type === 'Negative' && <ThumbsDown className="h-6 w-6 text-red-500" />}
              <span className="ml-2">
                {observation.type === 'Positive' 
                  ? 'Positive' 
                  : observation.type === 'Neutral'
                    ? 'Neutre'
                    : 'Négative'
                }
              </span>
            </Badge>
          </CardTitle>
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Contenu
            </h3>
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {observation.content}
            </p>
          </div>
  
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Auteur
            </h3>
            <p className="text-base">
              {observation.author.firstName} {observation.author.lastName}
            </p>
          </div>
  
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Date de la remarque
            </h3>
            <p className="text-base">
              {new Date(observation.createdAt).toLocaleString()}
            </p>
          </div>
  
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">
              Dernière mise à jour
            </h3>
            <p className="text-base">
              {new Date(observation.updatedAt).toLocaleString()}
            </p>
          </div>


          {observation.attachments && observation.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={observation.attachments} />
            </div>
          )}
        </CardContent>
  
        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
            <Button 
            asChild
            className="w-full sm:w-auto h-12 text-base"
          >
            <Link prefetch="intent" to={`/o/observation/edit/${observation.id}`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier la remarque
            </Link>
          </Button>
        </CardFooter>
         )}
      </Card>
    </div>
  )  
}
