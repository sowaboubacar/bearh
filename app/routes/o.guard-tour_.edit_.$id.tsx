import { useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AlertCircle, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { guardTourService } from '~/services/guardTour.service.server'
import { authService } from '~/services/auth.service.server'
import { GuardTourActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [GuardTourActions.Edit,]}});

  try {
    const guardTour = await guardTourService.readOne({
      id: params.id,
    });

    if (!guardTour) {
      throw Response.json({ message: "Tour de garde non trouvé" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [GuardTourActions.List]}),
    }
    return Response.json({ guardTour, can });
  } catch (error) {
    console.error("Error fetching guard tour:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération du tour de garde." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  await authService.requireUser(request, {
    condition: { any: [GuardTourActions.Edit] },
  });

  const formData = await request.formData()
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const notes = formData.get('notes') as string

  try {
    await guardTourService.updateOne(params.id, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
    })
    return redirect(`/o/guard-tour`);
  } catch (error) {
    console.error("Error updating guard tour:", error);
    return Response.json({ success: false, message: 'Échec de la mise à jour du tour de garde' }, { status: 400 })
  }
}

export default function EditGuardTour() {
  const { guardTour, can} = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    setIsSubmitting(true)
  }

  const formatDate = (date: string) => {
    return new Date(date).toISOString().slice(0, 16)
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/guard-tours">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier le Tour de Garde
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
          
          <Form method="post" onSubmit={handleSubmit} className="space-y-6">
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
                defaultValue={formatDate(guardTour.startDate)} 
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
                defaultValue={formatDate(guardTour.endDate)} 
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
                defaultValue={guardTour.notes}
                className="min-h-[120px] text-base p-3"
              />
            </div>
  
            <Button 
              type="submit" 
              className="w-full h-11 text-base"
              disabled={isSubmitting || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mise à jour...
                </span>
              ) : (
                'Mettre à jour le tour de garde'
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );  
}
