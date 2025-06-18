import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect, json } from '@remix-run/node'
import { Form, useActionData, useNavigation, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { guardTourService } from '~/services/guardTour.service.server'
import { authService } from '~/services/auth.service.server'
import { GuardTourActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [GuardTourActions.Create]}});

  try {

    return Response.json({ })
  } catch (error) {
    console.error("Error in loader:", error);
    throw json({ message: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [GuardTourActions.Create]}});
 

  const formData = await request.formData()
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const notes = formData.get('notes') as string

  try {
    await guardTourService.createOne({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
    })
    return redirect(`/o/guard-tour`)
  } catch (error) {
    console.error("Error creating guard tour:", error);
    return Response.json({ success: false, error: 'Échec de la création du tour de garde' }, { status: 400 })
  }
}

export default function NewGuardTour() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    setIsSubmitting(true)
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/guard-tour">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouveau Tour de Garde
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
                htmlFor="startDate" 
                className="text-base font-medium"
              >
                Date de début
              </Label>
              <Input 
                type="datetime-local" 
                id="startDate" 
                name="startDate" 
                required 
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label 
                htmlFor="endDate" 
                className="text-base font-medium"
              >
                Date de fin
              </Label>
              <Input 
                type="datetime-local" 
                id="endDate" 
                name="endDate" 
                required 
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label 
                htmlFor="notes" 
                className="text-base font-medium"
              >
                Notes
              </Label>
              <Textarea 
                id="notes" 
                name="notes" 
                className="min-h-[120px] text-base p-3"
              />
            </div>
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isSubmitting || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                'Créer le tour de garde'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
