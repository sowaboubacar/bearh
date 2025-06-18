import { useState } from 'react'
import { ActionFunction, redirect, json } from '@remix-run/node'
import { Form, useActionData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { enterpriseVideoService } from '~/services/enterpriseVideo.service.server'
import { authService } from '~/services/auth.service.server'
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { EnterpriseVideoActions } from "~/core/entities/utils/access-permission";


export const action: ActionFunction = async ({ request }) => {
  // Always require user authentication before any other operation
  const authenticatedUser = await authService.requireUser(request, {
    condition: { any: [EnterpriseVideoActions.Create] },
  });

  const formData = await request.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const attachments = formData.getAll("attachments") as string[];

  try {
    const newVideo = await enterpriseVideoService.createOne({
      title,
      description,
      attachments,
      uploadedBy: authenticatedUser.id, // Set the authenticated user as the uploader
    })

   
    return redirect(`/o/enterprise-videos/view/${newVideo.id}`)
  } catch (error) {
    console.error("Error creating enterprise video:", error);
    return Response.json({ success: false, error: 'Échec de la création de la vidéo' }, { status: 400 })
  }
}

export default function NewEnterpriseVideo() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

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
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
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
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouvelle Connaissance Générale
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base font-medium">
                  Erreur
                </AlertTitle>
                <AlertDescription className="text-base">
                  {actionData.error}
                </AlertDescription>
              </Alert>
            )}
            
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
                accept="image/*,video/*,application/pdf" 
                maxSize={5 * 1024 * 1024} 
                onBusyStateChange={setUploadWidgetIsBusy}
                className="w-full"
              />
            </div>
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isSubmitting || uploadWidgetIsBusy || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enregistrement en cours...
                </span>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
