import { type ActionFunction, type LoaderFunction, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, Form, Link, useRouteError, isRouteErrorResponse, useSubmit } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { positionService } from "~/services/position.service.server";
import { accessService } from "~/services/access.service.server";
import { authService } from "~/services/auth.service.server";
import { ArrowLeft, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import { userService } from "~/services/user.service.server";
import { PositionActions } from "~/core/entities/utils/access-permission";


export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PositionActions.Edit]}})

  try {
    const position = await positionService.readOne({ id: params.id, populate: 'access,attachments,members' });
    if (!position) {
      throw Response.json({ message: "Poste non trouvé" }, { status: 404 });
    }
    const users = await userService.readMany({});

    const accesses = await accessService.readMany({});

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [PositionActions.List]}),
    }
    return Response.json({ position, accesses, users, can });
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PositionActions.Edit]}})

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const accessId = formData.get("access") as string;
  const attachments = formData.getAll('attachments')
  const memberIds = formData.getAll("members") as string[];


  try {
    const p = await positionService.updateOneAfterFindIt(params.id, {
      title,
      description,
      access: accessId,
      updatedBy: currentLoggedUser.id,
      attachments,
      members: memberIds
    });

     // @ts-ignore
     await Promise.all(p.members?.map((member) => userService.updateCurrentPosition(p?.id, member)));
    return redirect(`/o/positions/view/${params.id}`);
  } catch (error) {
    console.error("Error updating position:", error);
    return Response.json({ success: false, error: "Une erreur est survenue lors de la mise à jour du poste." }, { status: 400 });
  }
};

export default function EditPositionPage() {
  const { position, accesses, users, can } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [title, setTitle] = useState(position.title);
  const [description, setDescription] = useState(position.description || "");
  const [access, setAccessRight] = useState(position.access?.id || "");
  const isSubmitting = navigation.state === "submitting";
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    position.attachments
  );
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

  const [members, setMembers] = useState<string[]>(position.members.map((member: any) => member.id));
  const handleMemberToggle = (userId: string) => {
    setMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    if (position.access) {
      setAccessRight(position.access.id);
    }
  }, [position.access]);


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/positions">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
        </Button>
      )}
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Modifier le Poste
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
                htmlFor="title" 
                className="text-base font-medium"
              >
                Titre du poste
              </Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="min-h-[120px] text-base p-3 resize-y"
              />
            </div>
  
            <div className="space-y-3">
              <Label 
                htmlFor="access" 
                className="text-base font-medium"
              >
                Droit d'accès
              </Label>
              <Select 
                name="access" 
                value={access} 
                onValueChange={setAccessRight}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Sélectionner un droit d'accès" />
                </SelectTrigger>
                <SelectContent>
                  {accesses.map((accessItem) => (
                    <SelectItem 
                      key={accessItem.id} 
                      value={accessItem.id}
                      className="text-base"
                    >
                      {accessItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Membres de la fiche de Poste
              </Label>
              <Card>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center space-x-3 py-3 border-b last:border-0"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={members.includes(user.id)}
                        onCheckedChange={() => handleMemberToggle(user.id)}
                        className="h-5 w-5"
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-base font-medium"
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
  
            <div className="space-y-3">
              <Label 
                htmlFor="attachments" 
                className="text-base font-medium"
              >
                Images & Pièces jointes
              </Label>
              <UploadWidget 
                onSelect={handleDocumentSelect} 
                defaultSelectedDocuments={position.attachments}
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
              disabled={isSubmitting || uploadWidgetIsBusy}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mise à jour en cours...
                </span>
              ) : (
                "Mettre à jour le Poste"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}

