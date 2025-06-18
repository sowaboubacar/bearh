import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { permissionAndLeaveService } from '~/services/permissionAndLeave.service.server'
import { userService } from '~/services/user.service.server'
import { authService } from '~/services/auth.service.server'
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { PermissionsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
 await authService.requireUser(request, {condition: {any: [PermissionsActions.Create]}})

  try {
    const users = await userService.readMany({})
    return Response.json({ users })
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request }) => {
  // Always require user authentication before any other operation
  const authenticatedUser = await authService.requireUser(request, {condition: {any: [PermissionsActions.Create]}})

  const formData = await request.formData()
  const user = formData.get('user') as string
  const type = formData.get('type') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const reason = formData.get('reason') as string
  const attachments = formData.getAll('attachments') as string[];

  try {
    const newPermissionAndLeave = await permissionAndLeaveService.createOne({
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status: 'Pending',
      attachments,
      user: authenticatedUser.id, // Set the authenticated user as the creator
    })

    
    return redirect(`/o/permission-and-leave/view/${newPermissionAndLeave.id}`)
  } catch (error) {
    console.error("Error creating permission and leave:", error);
    return Response.json({ success: false, error: 'Échec de la création de la demande' }, { status: 400 })
  }
}

export default function NewPermissionAndLeave() {
  const { users } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const submit = useSubmit();
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/permissions-and-leave">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Nouvelle Demande de Permission ou Congé
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
           
            <div className="space-y-3">
              <Label 
                htmlFor="type" 
                className="text-base font-medium"
              >
                Type
              </Label>
              <Select name="type" required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permission" className="text-base">
                    Permission
                  </SelectItem>
                  <SelectItem value="Leave" className="text-base">
                    Congé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-3">
              <Label 
                htmlFor="startDate" 
                className="text-base font-medium"
              >
                Date de début
              </Label>
              <Input 
                type="date" 
                id="startDate" 
                name="startDate" 
                required 
                className="h-12 text-base"
              />
            </div>
  
            <div className="space-y-3">
              <Label 
                htmlFor="endDate" 
                className="text-base font-medium"
              >
                Date de fin
              </Label>
              <Input 
                type="date" 
                id="endDate" 
                name="endDate" 
                required 
                className="h-12 text-base"
              />
            </div>
  
            <div className="space-y-3">
              <Label 
                htmlFor="reason" 
                className="text-base font-medium"
              >
                Raison
              </Label>
              <Textarea 
                id="reason" 
                name="reason" 
                rows={3} 
                required 
                className="min-h-[120px] text-base p-3 resize-y"
              />
            </div>
  
            <div className="space-y-3">
              <Label 
                htmlFor="attachments" 
                className="text-base font-medium"
              >
                Images & Pièces jointes
              </Label>
              <UploadWidget 
                onSelect={handleDocumentSelect} 
                multiple={true}
                accept="image/*,application/pdf" 
                maxSize={5 * 1024 * 1024} 
                onBusyStateChange={setUploadWidgetIsBusy}
              />
            </div> 
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              className="w-full h-12 text-base"
              disabled={isSubmitting || uploadWidgetIsBusy || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                'Créer la demande'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )  
}
