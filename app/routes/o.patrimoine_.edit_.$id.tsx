import { useState, useEffect } from 'react'
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Checkbox } from '~/components/ui/checkbox'
import { patrimoineService } from '~/services/patrimoine.service.server'
import { patrimoineTypeService } from '~/services/patrimoineType.service.server'
import { userService } from '~/services/user.service.server'
import { positionService } from '~/services/position.service.server'
import { teamService } from '~/services/team.service.server'
import { departmentService } from '~/services/department.service.server'
import { hourGroupService } from '~/services/hourGroup.service.server'
import { accessService } from '~/services/access.service.server'
import { authService } from '~/services/auth.service.server'
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { PatrimoineActions } from '~/core/entities/utils/access-permission'

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PatrimoineActions.Edit]}})

  try {
    const patrimoineId = params.id
    const patrimoine = await patrimoineService.readOne({id: patrimoineId, populate: 'attachments'})
    if (!patrimoine) {
      throw new Response("Patrimoine non trouvé", { status: 404 })
    }

    const patrimoineTypes = await patrimoineTypeService.readMany({})
    const users = await userService.readMany({})
    const positions = await positionService.readMany({})
    const teams = await teamService.readMany({})
    const departments = await departmentService.readMany({})
    const hourGroups = await hourGroupService.readMany({})
    const access = await accessService.readMany({})

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineActions.List]}),
    }
    return Response.json({ patrimoine, patrimoineTypes, users, positions, teams, departments, hourGroups, access, can })
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PatrimoineActions.Edit]}})

  const formData = await request.formData()
  const patrimoineId = params.id
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const purchaseDate = formData.get('purchaseDate') as string
  const status = formData.get('status') as string
  const assignedTo = {
    users: formData.getAll('assignedTo.users') as string[],
    positions: formData.getAll('assignedTo.positions') as string[],
    teams: formData.getAll('assignedTo.teams') as string[],
    departments: formData.getAll('assignedTo.departments') as string[],
    hourGroups: formData.getAll('assignedTo.hourGroups') as string[],
    access: formData.getAll('assignedTo.access') as string[],
  }
  const attachments = formData.getAll('attachments') as string[];

  try {
    const updatedPatrimoine = await patrimoineService.updateOneAfterFindIt(patrimoineId, {
      name,
      type,
      purchaseDate: new Date(purchaseDate),
      status,
      assignedTo,
      attachments
    })

  
    return redirect(`/o/patrimoine/view/${patrimoineId}`)
  } catch (error) {
    console.error("Error updating patrimoine:", error);
    return Response.json({ success: false, error: 'Échec de la mise à jour du patrimoine' }, { status: 400 })
  }
}

export default function EditPatrimoine() {
  const { patrimoine, patrimoineTypes, users, positions, teams, departments, hourGroups, access,can } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignedTo, setAssignedTo] = useState(patrimoine.assignedTo)
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    patrimoine.attachments
  );
  useEffect(() => {
    setAssignedTo(patrimoine.assignedTo)
  }, [patrimoine])
  
  const handleAssignedToChange = (category, id) => {
    setAssignedTo(prev => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter(item => item !== id)
        : [...prev[category], id]
    }))
  }

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to={`/o/patrimoine/view/${patrimoine.id}`}>
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour au détail
        </Link>
      </Button>
      )}
  
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Modifier le Patrimoine
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6">
            <ScrollArea className="h-[70vh] sm:h-[600px] pr-4">
              <div className="space-y-6">
                {actionData?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-base font-medium">Erreur</AlertTitle>
                    <AlertDescription className="text-base">{actionData.error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-medium">
                    Dénomination
                  </Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={patrimoine.name} 
                    required 
                    className="h-12 text-base"
                  />
                </div>
  
                <div className="space-y-3">
                  <Label htmlFor="type" className="text-base font-medium">
                    Type
                  </Label>
                  <Select name="type" defaultValue={patrimoine.type} required>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {patrimoineTypes.map((type) => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id}
                          className="text-base"
                        >
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
  
                <div className="space-y-3">
                  <Label htmlFor="purchaseDate" className="text-base font-medium">
                    Date d'achat
                  </Label>
                  <Input 
                    type="date" 
                    id="purchaseDate" 
                    name="purchaseDate" 
                    defaultValue={new Date(patrimoine.purchaseDate).toISOString().split('T')[0]}
                    required 
                    className="h-12 text-base"
                  />
                </div>
  
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-base font-medium">
                    Statut
                  </Label>
                  <Select name="status" defaultValue={patrimoine.status} required>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active" className="text-base">Actif</SelectItem>
                      <SelectItem value="Under Maintenance" className="text-base">En maintenance</SelectItem>
                      <SelectItem value="Out of Service" className="text-base">Hors service</SelectItem>
                    </SelectContent>
                  </Select>
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
                                checked={assignedTo.users.includes(user.id)}
                                onCheckedChange={() => handleAssignedToChange('users', user.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`user-${user.id}`} className="text-base">
                                {user.firstName} {user.lastName}
                              </label>
                              {assignedTo.users.includes(user.id) && (
                                <input type="hidden" name="assignedTo.users" value={user.id} />
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
                                checked={assignedTo.positions.includes(position.id)}
                                onCheckedChange={() => handleAssignedToChange('positions', position.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`position-${position.id}`} className="text-base">
                                {position.title}
                              </label>
                              {assignedTo.positions.includes(position.id) && (
                                <input type="hidden" name="assignedTo.positions" value={position.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
  
                    <Card className="shadow-none border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">Équipes</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-48 px-4">
                          {teams.map((team) => (
                            <div key={team.id} className="flex items-center space-x-3 py-3">
                              <Checkbox
                                id={`team-${team.id}`}
                                checked={assignedTo.teams.includes(team.id)}
                                onCheckedChange={() => handleAssignedToChange('teams', team.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`team-${team.id}`} className="text-base">
                                {team.name}
                              </label>
                              {assignedTo.teams.includes(team.id) && (
                                <input type="hidden" name="assignedTo.teams" value={team.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
  
                    <Card className="shadow-none border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">Départements</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-48 px-4">
                          {departments.map((department) => (
                            <div key={department.id} className="flex items-center space-x-3 py-3">
                              <Checkbox
                                id={`department-${department.id}`}
                                checked={assignedTo.departments.includes(department.id)}
                                onCheckedChange={() => handleAssignedToChange('departments', department.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`department-${department.id}`} className="text-base">
                                {department.name}
                              </label>
                              {assignedTo.departments.includes(department.id) && (
                                <input type="hidden" name="assignedTo.departments" value={department.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
  
                    <Card className="shadow-none border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">Groupes Horaires</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-48 px-4">
                          {hourGroups.map((hourGroup) => (
                            <div key={hourGroup.id} className="flex items-center space-x-3 py-3">
                              <Checkbox
                                id={`hourGroup-${hourGroup.id}`}
                                checked={assignedTo.hourGroups.includes(hourGroup.id)}
                                onCheckedChange={() => handleAssignedToChange('hourGroups', hourGroup.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`hourGroup-${hourGroup.id}`} className="text-base">
                                {hourGroup.name}
                              </label>
                              {assignedTo.hourGroups.includes(hourGroup.id) && (
                                <input type="hidden" name="assignedTo.hourGroups" value={hourGroup.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
  
                    <Card className="shadow-none border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base font-semibold">Groupes d'Accès</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-48 px-4">
                          {access.map((item) => (
                            <div key={item.id} className="flex items-center space-x-3 py-3">
                              <Checkbox
                                id={`access-${item.id}`}
                                checked={assignedTo.access.includes(item.id)}
                                onCheckedChange={() => handleAssignedToChange('access', item.id)}
                                className="h-5 w-5"
                              />
                              <label htmlFor={`access-${item.id}`} className="text-base">
                                {item.name}
                              </label>
                              {assignedTo.access.includes(item.id) && (
                                <input type="hidden" name="assignedTo.access" value={item.id} />
                              )}
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
  
                <div className="space-y-3">
                  <Label htmlFor="attachments" className="text-base font-medium">
                    Images & Pièces jointes
                  </Label>
                  <UploadWidget 
                    onSelect={handleDocumentSelect} 
                    defaultSelectedDocuments={patrimoine.attachments}
                    multiple={true}
                    accept="image/*,application/pdf" 
                    maxSize={5 * 1024 * 1024} 
                    onBusyStateChange={setUploadWidgetIsBusy}
                  />
                </div>
              </div>
            </ScrollArea>
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
                  Mise à jour en cours...
                </span>
              ) : (
                'Mettre à jour le patrimoine'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  )  
}


