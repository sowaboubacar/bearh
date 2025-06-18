/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { ActionFunction, redirect, json, LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useNavigation, Link, useRouteError, isRouteErrorResponse, useLoaderData, useSubmit } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Checkbox } from '~/components/ui/checkbox'
import { hourGroupService } from '~/services/hourGroup.service.server'
import { authService } from '~/services/auth.service.server'
import { userService } from '~/services/user.service.server'
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
 import { HourGroupActions } from "~/core/entities/utils/access-permission";

export const loader = async ({ params,request }: LoaderFunctionArgs) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [HourGroupActions.Edit]}})
  const users = await userService.readMany({})
  const hourGroup: any = await hourGroupService.readOne({id: params.id, populate: 'members,attachments'})

  return Response.json({ users, hourGroup, can: {list: await authService.can(currentLoggedUser?.id as string, {any: [HourGroupActions.List]})}})
}

export const action: ActionFunction = async ({ request, params }) => {
  const authenticatedUser = await authService.requireUser(request, {
    condition: { any: [HourGroupActions.Edit] },
  });

  const formData = await request.formData()
  const note = formData.get('note') as string
  const startAt = formData.get('startAt') as string
  const endAt = formData.get('endAt') as string
  const restShouldStartAt = formData.get('restShouldStartAt') as string
  const restShouldEndAt = formData.get('restShouldEndAt') as string

  const workTimes = JSON.parse(formData.get('workTimes') as string)
  const memberIds = formData.getAll("members") as string[];
  const attachments = formData.getAll('attachments')


  try {
    const updatedHourGroup = await hourGroupService.updateOneAfterFindIt(params.id, {
      note,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      restShouldStartAt,
      restShouldEndAt,
      members: memberIds,
      workTimes,
      attachments
    })

     // @ts-ignore
     await Promise.all(updatedHourGroup.members?.map((member) => userService.updateCurrentHourGroup(updatedHourGroup?.id, member)));
   
    return redirect(`/o/hour-group/view/${updatedHourGroup?.id}`)
  } catch (error) {
    console.error("Error updating hour group:", error);
    return Response.json({ success: false, error: 'Échec de la mise à jour du groupe d\'heures' }, { status: 400 })
  }
}

export default function EditHourGroup() {
  const { users,  hourGroup,can } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workTimes, setWorkTimes] = useState<Array<{date: string, startAt: string, endAt: string, restShouldStartAt?: string, restShouldEndAt?: string}>>(hourGroup.workTimes)
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    hourGroup.attachments
  );
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const addWorkTime = () => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toISOString().split('T')[1].split('.')[0]
    setWorkTimes([...workTimes, { date, startAt: time, endAt: time, restShouldStartAt: time, restShouldEndAt: time }])
  }

  const removeWorkTime = (index: number) => {
    setWorkTimes(workTimes.filter((_, i) => i !== index))
  }

  const updateWorkTime = (index: number, field: string, value: string) => {
    const updatedWorkTimes = [...workTimes]
    updatedWorkTimes[index] = { ...updatedWorkTimes[index], [field]: value }
    setWorkTimes(updatedWorkTimes)
  }
  

  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
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

  const [members, setMembers] = useState<string[]>(hourGroup.members.map((member: any) => member.id));
  const handleMemberToggle = (userId: string) => {
    setMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/hour-group">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier Programmes
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {actionData?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base font-medium">Erreur</AlertTitle>
                <AlertDescription className="text-base">
                  {actionData.error}
                </AlertDescription>
              </Alert>
            )}
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="note" className="text-base font-medium">Note</Label>
              <Textarea 
                id="note" 
                name="note" 
                defaultValue={hourGroup.note}
                className="min-h-[120px] text-base p-3"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="startAt" className="text-base font-medium">Date de début</Label>
              <Input 
                type="date" 
                id="startAt" 
                name="startAt" 
                defaultValue={new Date(hourGroup.startAt).toISOString().split('T')[0]} 
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="endAt" className="text-base font-medium">Date de fin</Label>
              <Input 
                type="date" 
                id="endAt" 
                name="endAt" 
                defaultValue={new Date(hourGroup.endAt).toISOString().split('T')[0]} 
                required
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="restShouldStartAt" className="text-base font-medium">
                Heure de début de pause par défaut
              </Label>
              <Input 
                type="time" 
                id="restShouldStartAt" 
                name="restShouldStartAt" 
                defaultValue={hourGroup.restShouldStartAt}
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="restShouldEndAt" className="text-base font-medium">
                Heure de fin de pause par défaut
              </Label>
              <Input 
                type="time" 
                id="restShouldEndAt" 
                name="restShouldEndAt" 
                defaultValue={hourGroup.restShouldEndAt}
                className="h-11 text-base"
              />
            </div>
  
            <div className="space-y-4">
              <Label className="text-base font-medium">Horaires de travail</Label>
              {workTimes.map((workTime, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor={`workTime-${index}-date`} className="text-base font-medium">
                        Date
                      </Label>
                      <Input
                        type="date"
                        id={`workTime-${index}-date`}
                        value={new Date(workTime.date).toISOString().split('T')[0]}
                        onChange={(e) => updateWorkTime(index, 'date', e.target.value)}
                        required
                        className="h-11 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`workTime-${index}-startAt`} className="text-base font-medium">
                        Début
                      </Label>
                      <Input
                        type="time"
                        id={`workTime-${index}-startAt`}
                        value={workTime.startAt}
                        onChange={(e) => updateWorkTime(index, 'startAt', e.target.value)}
                        required
                        className="h-11 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`workTime-${index}-endAt`} className="text-base font-medium">
                        Fin
                      </Label>
                      <Input
                        type="time"
                        id={`workTime-${index}-endAt`}
                        value={workTime.endAt}
                        onChange={(e) => updateWorkTime(index, 'endAt', e.target.value)}
                        required
                        className="h-11 text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`workTime-${index}-restShouldStartAt`} className="text-base font-medium">
                        Début pause
                      </Label>
                      <Input
                        type="time"
                        id={`workTime-${index}-restShouldStartAt`}
                        value={workTime.restShouldStartAt}
                        onChange={(e) => updateWorkTime(index, 'restShouldStartAt', e.target.value)}
                        className="h-11 text-base"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1 mr-2">
                        <Label htmlFor={`workTime-${index}-restShouldEndAt`} className="text-base font-medium">
                          Fin pause
                        </Label>
                        <Input
                          type="time"
                          id={`workTime-${index}-restShouldEndAt`}
                          value={workTime.restShouldEndAt}
                          onChange={(e) => updateWorkTime(index, 'restShouldEndAt', e.target.value)}
                          className="h-11 text-base"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={() => removeWorkTime(index)}
                        className="h-11 w-11"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button 
                type="button" 
                onClick={addWorkTime} 
                className="w-full sm:w-auto h-11 text-base"
              >
                <Plus className="mr-2 h-5 w-5" /> 
                Ajouter un horaire
              </Button>
            </div>
  
            <input type="hidden" name="workTimes" value={JSON.stringify(workTimes)} />
  
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-base font-medium">Membres de l'équipe</Label>
              <Card>
                <ScrollArea className="h-72 sm:h-80 w-full rounded-md border p-4">
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center space-x-3 py-3 sm:py-4"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={members.includes(user.id)}
                        onCheckedChange={() => handleMemberToggle(user.id)}
                        className="h-5 w-5 sm:h-6 sm:w-6"
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-base font-medium cursor-pointer"
                      >
                        {user.firstName} {user.lastName}
                      </label>
                      {members.includes(user.id) && (
                        <input type="hidden" name="members" value={user.id} />
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </Card>
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
                defaultSelectedDocuments={hourGroup.attachments}
                multiple={true}
                accept="image/*,application/pdf" 
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
                  Mise à jour en cours...
                </span>
              ) : (
                'Mettre à jour le groupe d\'heures'
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
