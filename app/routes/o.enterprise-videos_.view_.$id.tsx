import { LoaderFunction } from '@remix-run/node'
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Edit, ArrowLeft, AlertTriangle } from 'lucide-react'
import { enterpriseVideoService } from '~/services/enterpriseVideo.service.server'
import { authService } from '~/services/auth.service.server'
import { AttachmentGallery } from '~/components/AttachmentGallery'
import { EnterpriseVideoActions } from '~/core/entities/utils/access-permission'

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request,{condition: {any: [EnterpriseVideoActions.List]}});
  try {
    const video = await enterpriseVideoService.readOne({
      id: params.id,
      populate: 'uploadedBy,attachments'
    });

    if (!video) {
      throw Response.json({ message: "Vidéo d'entreprise non trouvée" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [EnterpriseVideoActions.List]}),
      edit: await authService.can(currentLoggedUser?.id as string, {any: [EnterpriseVideoActions.Edit]}),
    }
    return Response.json({ video, can });
  } catch (error) {
    console.error("Error fetching enterprise video:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération de la vidéo d'entreprise." }, { status: 500 });
  }
}

export default function EnterpriseVideoDetails() {
  const { video, can } = useLoaderData<typeof loader>()


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/enterprise-videos">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {video.title}
          </CardTitle>
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Description</h3>
            <p className="text-base text-muted-foreground whitespace-pre-wrap">
              {video.description || 'No description provided'}
            </p>
          </div>
  
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Auteur</h3>
            <p className="text-base">
              {video.uploadedBy.firstName} {video.uploadedBy.lastName}
            </p>
          </div>
  
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Publier le</h3>
            <p className="text-base">
              {new Date(video.createdAt).toLocaleString()}
            </p>
          </div>
  
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Mise à jour le:</h3>
            <p className="text-base">
              {new Date(video.updatedAt).toLocaleString()}
            </p>
          </div>
  
          {video.attachments && video.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={video.attachments} />
            </div>
          )}
        </CardContent>
  
        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
          <Button 
            asChild
            className="h-11 text-base"
          >
            <Link prefetch="intent" to={`/o/enterprise-videos/edit/${video.id}`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier
            </Link>
          </Button>
        </CardFooter>
        )}
      </Card>
    </div>
  );  
}
