import { useEffect, useState } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { AlertCircle, Plus, Trash2, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { kpiFormService } from '~/services/kpiForm.service.server'
import { authService } from '~/services/auth.service.server'
import { ScrollArea } from '~/components/ui/scroll-area'
import { application } from 'express'
import { userService } from '~/services/user.service.server'
import { positionService } from '~/services/position.service.server'
import { Checkbox } from '~/components/ui/checkbox'
import { KpiFormActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  // Always require user authentication before any other operation
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [KpiFormActions.Edit]}})
  
  try {
    const kpiForm = await kpiFormService.readOne({
      id: params.id
    });
    const users = await userService.readMany({})
    const positions = await positionService.readMany({})

    if (!kpiForm) {
      throw Response.json({ message: "Formulaire KPI non trouvé" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [KpiFormActions.List]}),
    }
    return Response.json({ kpiForm, users, positions, can });
  } catch (error) {
    console.error("Error fetching KPI form:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération du formulaire KPI." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  await authService.requireUser(request, {
    condition: { any: [KpiFormActions.Edit] },
  });

  const formData = await request.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const criteriaCount = parseInt(formData.get('criteriaCount') as string)
  const applicableTo = {
    users: formData.getAll('applicableTo.users') as string[],
    positions: formData.getAll('applicableTo.positions') as string[],
  }

  const criteria = []
  for (let i = 0; i < criteriaCount; i++) {
    criteria.push({
      name: formData.get(`criterionName${i}`) as string,
      maxScore: parseInt(formData.get(`criterionMaxScore${i}`) as string),
      description: formData.get(`criterionDescription${i}`) as string,
    })
  }

  try {
   await kpiFormService.updateOneAfterFindIt(params.id, {
      title,
      description,
      criteria,
      applicableTo
    })
    return redirect(`/o/kpi-form/view/${params.id}`);
  } catch (error) {
    console.error("Error updating KPI form:", error);
    return Response.json({ success: false, message: 'Échec de la mise à jour du formulaire KPI' }, { status: 400 })
  }
}

export default function EditKpiForm() {
  const { kpiForm , users, positions, can} = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [criteria, setCriteria] = useState(kpiForm.criteria)
  const [applicableTo, setApplicableTo] = useState(kpiForm.applicableTo)

  useEffect(() => {
    setApplicableTo(kpiForm.applicableTo)
  }, [kpiForm])
  
  const handleApplicableToChange = (category, id) => {
    setApplicableTo(prev => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter(item => item !== id)
        : [...prev[category], id]
    }))
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
  }

  const addCriterion = () => {
    setCriteria([...criteria, { name: '', maxScore: 0, description: '' }])
  }

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/kpi-forms">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
        </Button>
      )}
  
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier le Formulaire KPI
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
                  defaultValue={kpiForm.title} 
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
                  defaultValue={kpiForm.description}
                  className="min-h-[120px] text-base p-3"
                />
              </div>
  
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Critères
                </h2>
                
                {criteria.map((criterion, index) => (
                  <Card key={index} className="p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">
                        Critère {index + 1}
                      </h3>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={() => removeCriterion(index)}
                        className="h-11 w-11"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
  
                    <div className="space-y-4">
                      <div className="space-y-2 sm:space-y-3">
                        <Label 
                          htmlFor={`criterionName${index}`}
                          className="text-base font-medium"
                        >
                          Nom
                        </Label>
                        <Input 
                          id={`criterionName${index}`} 
                          name={`criterionName${index}`} 
                          defaultValue={criterion.name} 
                          required 
                          className="h-11 text-base"
                        />
                      </div>
  
                      <div className="space-y-2 sm:space-y-3">
                        <Label 
                          htmlFor={`criterionMaxScore${index}`}
                          className="text-base font-medium"
                        >
                          Note maximale
                        </Label>
                        <Input 
                          type="number" 
                          id={`criterionMaxScore${index}`} 
                          name={`criterionMaxScore${index}`} 
                          defaultValue={criterion.maxScore} 
                          required 
                          min="1"
                          className="h-11 text-base"
                        />
                      </div>
  
                      <div className="space-y-2 sm:space-y-3">
                        <Label 
                          htmlFor={`criterionDescription${index}`}
                          className="text-base font-medium"
                        >
                          Description
                        </Label>
                        <Textarea 
                          id={`criterionDescription${index}`} 
                          name={`criterionDescription${index}`} 
                          defaultValue={criterion.description}
                          className="min-h-[120px] text-base p-3"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
  
                <Button 
                  type="button" 
                  onClick={addCriterion} 
                  className="w-full h-11 text-base"
                >
                  <Plus className="mr-2 h-5 w-5" /> 
                  Ajouter un critère
                </Button>
              </div>

              <div className="space-y-4">
                  <Label className="text-base font-medium">Assigné à</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="shadow-none border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">Utilisateurs</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-48 px-4">
                          {users.map((user) => (
                            <div key={user.id} className="flex items-center space-x-3 py-3">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={applicableTo.users.includes(user.id)}
                                onCheckedChange={() => handleApplicableToChange('users', user.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`user-${user.id}`} className="text-base">
                                {user.firstName} {user.lastName}
                              </label>
                              {applicableTo.users.includes(user.id) && (
                                <input type="hidden" name="applicableTo.users" value={user.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">Postes</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-48 px-4">
                          {positions.map((position) => (
                            <div key={position.id} className="flex items-center space-x-3 py-3">
                              <Checkbox
                                id={`position-${position.id}`}
                                checked={applicableTo.positions.includes(position.id)}
                                onCheckedChange={() => handleApplicableToChange('positions', position.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`position-${position.id}`} className="text-base">
                                {position.title}
                              </label>
                              {applicableTo.positions.includes(position.id) && (
                                <input type="hidden" name="applicableTo.positions" value={position.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
  
  
              <input type="hidden" name="criteriaCount" value={criteria.length} />
  
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
                  'Mettre à jour le formulaire KPI'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );  
}
