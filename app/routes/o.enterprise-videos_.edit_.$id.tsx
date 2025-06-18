import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { AlertCircle, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { enterpriseVideoService } from '~/services/enterpriseVideo.service.server'
import { userService } from '~/services/user.service.server'
import { authService } from '~/services/auth.service.server'
import { UploadWidget } from '~/components/UploadWidget'
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { EnterpriseVideoActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
   const currentLoggedUser = await authService.requireUser(request,{condition: {any: [EnterpriseVideoActions.List]}});

  try {
    const video = await enterpriseVideoService.readOne({
      id: params.id,
      populate: 'uploadedBy'
    });
    const users = await userService.readMany({});

    if (!video) {
      throw Response.json({ message: "Vidéo d'entreprise non trouvée" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [EnterpriseVideoActions.List]})
    }
    return Response.json({ video, users, can });
  } catch (error) {
    console.error("Error fetching enterprise video:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération de la vidéo d'entreprise." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  // Always require user authentication before any other operation
  const authenticatedUser = await authService.requireUser(request, {
    condition: { any: [EnterpriseVideoActions.Edit] },
  });

  const formData = await request.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const attachments = formData.getAll("attachments");

  try {
   const newVideo = await enterpriseVideoService.updateOneAfterFindIt(params.id, {
      title,
      description,
      attachments,
    })

   
    return redirect(`/o/enterprise-videos/view/${params.id}`);
  } catch (error) {
    console.error("Error updating enterprise video:", error);
    return Response.json({ success: false, message: 'Échec de la mise à jour de la vidéo d\'entreprise' }, { status: 400 })
  }
}

export default function EditEnterpriseVideo() {
  const { video, users, can } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    video.attachments || []
  );

  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    selectedDocuments.forEach(doc => {
      formData.append('attachments', doc.id);
    });
    submit(formData, { method: 'post' });
  };

  const handleDocumentSelect = (documents: IDocument[]) => {
    //setSelectedDocuments(prevDocs => [...prevDocs, ...documents]);
    setSelectedDocuments(documents);
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">

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
            Modifier la Connaissance Génrale
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {actionData?.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-base font-medium">
                Erreur
              </AlertTitle>
              <AlertDescription className="text-base">
                {actionData.error}
              </AlertDescription>
            </Alert>
          )}
          
          <Form method="post" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Label 
                htmlFor="title" 
                className="text-base font-medium"
              >
                Titre
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={video.title}
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label 
                htmlFor="description" 
                className="text-base font-medium"
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={video.description}
                rows={5}
                className="min-h-[120px] text-base p-3"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label 
                htmlFor="attachments" 
                className="text-base font-medium"
              >
                Images & Pièces jointes
              </Label>
              <UploadWidget 
                onSelect={handleDocumentSelect} 
                multiple={true}
                accept="image/*, video/*,application/pdf" 
                maxSize={5 * 1024 * 1024} 
                defaultSelectedDocuments={video.attachments || []}
                onBusyStateChange={setUploadWidgetIsBusy}
                className="w-full"
              />
            </div>
  
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isSubmitting || uploadWidgetIsBusy || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mise à jour...
                </span>
              ) : (
                'Mettre à jour la vidéo'
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );  
}

