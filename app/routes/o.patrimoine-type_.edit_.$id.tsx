import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { AlertCircle, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { patrimoineTypeService } from '~/services/patrimoineType.service.server'
import { authService } from '~/services/auth.service.server'
import { PatrimoineTypeActions } from '~/core/entities/utils/access-permission'

export const loader: LoaderFunction = async ({ params, request }) => {
  // Always require user authentication before any other operation
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PatrimoineTypeActions.Edit]}})

  try {
    const patrimoineType = await patrimoineTypeService.readOne({
      id: params.id
    });

    if (!patrimoineType) {
      throw Response.json({ message: "Type de patrimoine non trouvé" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineTypeActions.List]}),
    }
    return Response.json({ patrimoineType, can });
  } catch (error) {
    console.error("Error fetching patrimoine type:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération du type de patrimoine." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  // Always require user authentication before any other operation
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PatrimoineTypeActions.Edit]}})

  const formData = await request.formData()
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  try {
  await patrimoineTypeService.updateOne(params.id, {
      name,
      description,
    })
    return redirect(`/o/patrimoine-type`);
  } catch (error) {
    console.error("Error updating patrimoine type:", error);
    return Response.json({ success: false, message: 'Échec de la mise à jour du type de patrimoine' }, { status: 400 })
  }
}

export default function EditPatrimoineType() {
  const { patrimoineType,can } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    setIsSubmitting(true)
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/patrimoine-type">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Modifier le Type de Patrimoine
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
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
          
          <Form method="post" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label 
                  htmlFor="name" 
                  className="text-base font-medium"
                >
                  Nom
                </Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={patrimoineType.name} 
                  required 
                  className="h-12 text-base"
                />
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="description" 
                  className="text-base font-medium"
                >
                  Description
                </Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  rows={4} 
                  defaultValue={patrimoineType.description}
                  className="min-h-[120px] text-base p-3 resize-y"
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
                    Mise à jour en cours...
                  </span>
                ) : (
                  'Mettre à jour le type de patrimoine'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )  
}
