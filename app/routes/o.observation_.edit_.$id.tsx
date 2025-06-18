import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AlertCircle, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { observationService } from '~/services/observation.service.server'
import { userService } from '~/services/user.service.server'
import { authService } from '~/services/auth.service.server'
import { IDocument } from '~/core/entities/document.entity.server'
import { UploadWidget } from '~/components/UploadWidget'
import { ObservationActions } from '~/core/entities/utils/access-permission'

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [ObservationActions.Edit, ObservationActions.EditOwn] }
  });

  try {
    const observation = await observationService.readOne({
      id: params.id,
      populate: 'user,author,attachments'
    });

    if (!observation) {
      throw Response.json({ message: "Observation non trouvée" }, { status: 404 });
    }

    // Check if user has permission to edit this specific observation
    const hasFullEditAccess = await authService.can(currentUser.id, ObservationActions.Edit);
    const canEditOwn = await authService.can(currentUser.id, ObservationActions.EditOwn, {
      resourceOwnerId: observation.author.toString(),
      targetUserId: currentUser.id
    });

    if (!hasFullEditAccess && !canEditOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    return Response.json({
      observation,
      can: {
        list: await authService.can(currentUser.id, {
          any: [ObservationActions.List, ObservationActions.ListOwn]
        })
      }
    });
  } catch (error) {
    console.error("Error fetching observation:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération de l'observation" },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  // Always require user authentication before any other operation
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [ObservationActions.Edit, ObservationActions.EditOwn]}})

  const formData = await request.formData()
  const type = formData.get('type') as string
  const content = formData.get('content') as string
  const attachments = formData.getAll("attachments");

  try {
    const updatedObservation = await observationService.updateOne(params.id, {
      type,
      content,
      attachments
    })
    return redirect(`/o/observation/view/${params.id}`);
  } catch (error) {
    console.error("Error updating observation:", error);
    return Response.json({ success: false, message: 'Échec de la mise à jour de l\'observation' }, { status: 400 })
  }
}

export default function EditObservation() {
  const { observation, users, can } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    observation.attachments
  );
  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget);
    selectedDocuments.forEach((doc) => {
      formData.append("attachments", doc.id);
    });
    submit(formData, { method: "post" });
  };

  const handleDocumentSelect = (documents: IDocument[]) => {
    //setSelectedDocuments(prevDocs => [...prevDocs, ...documents]);
    setSelectedDocuments(documents);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
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
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier la remarque
          </CardTitle>
        </CardHeader>
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
          
          <Form method="post" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label 
                  htmlFor="type" 
                  className="text-base font-medium"
                >
                  Type de remarque
                </Label>
                <Select 
                  name="type" 
                  defaultValue={observation.type} 
                  required
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="Positive" 
                      className="text-base"
                    >
                      Positive
                    </SelectItem>
                    <SelectItem 
                      value="Neutral" 
                      className="text-base"
                    >
                      Neutre
                    </SelectItem>
                    <SelectItem 
                      value="Negative" 
                      className="text-base"
                    >
                      Négative
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="content" 
                  className="text-base font-medium"
                >
                  Contenu
                </Label>
                <Textarea 
                  id="content" 
                  name="content" 
                  defaultValue={observation.content} 
                  required
                  className="min-h-[150px] text-base p-3"
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
                defaultSelectedDocuments={observation.attachments}
                multiple={true}
                accept="image/*,application/pdf" 
                maxSize={5 * 1024 * 1024} 
                onBusyStateChange={setUploadWidgetIsBusy}
                className="w-full"
              />
            </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base"
                disabled={isSubmitting || navigation.state === 'submitting'}
              >
                {isSubmitting || navigation.state === 'submitting' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mise à jour...
                  </span>
                ) : (
                  'Mettre à jour l\'observation'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
  
  
}
