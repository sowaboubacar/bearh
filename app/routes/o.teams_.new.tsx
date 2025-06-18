/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type ActionFunction, type LoaderFunction, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, Link, useRouteError, isRouteErrorResponse, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Checkbox } from "~/components/ui/checkbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { teamService } from "~/services/team.service.server";
import { userService } from "~/services/user.service.server";
import { authService } from "~/services/auth.service.server";
import { ArrowLeft, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { TeamActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const authenticatedUser = await authService.requireUser(request, {condition: {any: [TeamActions.Create] }});

  try {
    const users = await userService.readMany({});
    return Response.json({ users });
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const authenticatedUser = await authService.requireUser(request,{condition: { any: [TeamActions.Create] }});

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const leaderId = formData.get("leader") as string;
  const memberIds = formData.getAll("members") as string[];
  const attachments = formData.getAll("attachments") as string[];

  try {
    const newTeam = await teamService.createOne({
      name,
      description,
      leader: leaderId,
      members: memberIds,
      createdBy: authenticatedUser.id,
      attachments,
    });

    // @ts-ignore
    await Promise.all(newTeam.members?.map((member) => userService.updateCurrentTeam(newTeam?.id, member)));


    return redirect(`/o/teams/view/${newTeam.id}`);
  } catch (error) {
    console.error("Error creating team:", error);
    return Response.json({ success: false, error: "Une erreur est survenue lors de la création de l'équipe." }, { status: 400 });
  }
};

export default function NewTeamPage() {
  const { users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const handleMemberToggle = (userId: string) => {
    setMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);

  const isSubmitting = navigation.state === "submitting";
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
 

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/teams">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Ajouter une Nouvelle Équipe
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
                Nom de l'équipe
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                htmlFor="leader" 
                className="text-base font-medium"
              >
                Chef d'équipe
              </Label>
              <Select 
                name="leader" 
                value={leader} 
                onValueChange={setLeader}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Sélectionner un chef d'équipe" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem 
                      key={user.id} 
                      value={user.id}
                      className="text-base"
                    >
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Membres de l'équipe
              </Label>
              <Card className="shadow-none border">
                <ScrollArea className="h-[300px] w-full rounded-md">
                  <div className="p-4">
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
                  </div>
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
                  Création en cours...
                </span>
              ) : (
                "Créer l'Équipe"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}

