import { useState } from 'react'
import { ActionFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useNavigation, Link} from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { patrimoineTypeService } from '~/services/patrimoineType.service.server'
import { authService } from '~/services/auth.service.server'
import { PatrimoineTypeActions } from "~/core/entities/utils/access-permission";


export const action: ActionFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [PatrimoineTypeActions.Create] },
  });

  const formData = await request.formData()
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  try {
    await patrimoineTypeService.createOne({
      name,
      description,
    })
    return redirect(`/o/patrimoine-type/`)
  } catch (error) {
    console.error("Error creating patrimoine type:", error);
    return Response.json({ success: false, error: 'Échec de la création du type de patrimoine' }, { status: 400 })
  }
}

export default function NewPatrimoineType() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    setIsSubmitting(true)
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
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
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Nouveau Type de Patrimoine
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
                htmlFor="name" 
                className="text-base font-medium"
              >
                Nom
              </Label>
              <Input 
                id="name" 
                name="name" 
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
                className="min-h-[120px] text-base p-3 resize-y"
              />
            </div>
          </CardContent>
  
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              className="w-full h-12 text-base"
              disabled={isSubmitting || navigation.state === 'submitting'}
            >
              {isSubmitting || navigation.state === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                'Créer le type de patrimoine'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )  
}
