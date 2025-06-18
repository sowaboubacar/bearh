/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type ActionFunction, type LoaderFunction, redirect, json } from "@remix-run/node";
import { useActionData, useNavigation, Form, Link, useRouteError, isRouteErrorResponse, useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { departmentService } from "~/services/department.service.server";
import { authService } from "~/services/auth.service.server";
import { userService } from "~/services/user.service.server";
import { ArrowLeft, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { DepartmentActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const loggedUser = await authService.requireUser(request, {condition: {any: [DepartmentActions.List]}});
  const potentialManagers = await userService.readMany({}); // Adjust this to fetch only users who can be managers
  const can = {
    list: await authService.can(loggedUser?.id as string, {any: [DepartmentActions.List]}),
  };
  return Response.json({ potentialManagers, can });
};

export const action: ActionFunction = async ({ request }) => {
  const loggedUser = await authService.requireUser(request, {
    condition: { any: [DepartmentActions.Create]},
  });

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const manager = formData.get("managerId") as string;
  const memberIds = formData.getAll("members") as string[];
  const attachments = formData.getAll("attachments") as string[];

  try {
   const dp = await departmentService.createOne({ 
      name, 
      description,
      manager,
      members: memberIds,
      attachments,
    });

     // @ts-ignore
     await Promise.all(dp.members?.map((member) => userService.updateCurrentDepartment(dp?.id, member)));
     
    
    return redirect(`/o/departments/view/${dp.id}`);
  } catch (error) {
    console.error("Error creating department:", error);
    return Response.json({ error: "Une erreur est survenue lors de la création du département." }, { status: 400 });
  }
};

export default function NewDepartmentPage() {
  const { potentialManagers ,can} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

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
  const [members, setMembers] = useState<string[]>([]);
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
        <Link prefetch="intent" to="/o/departments">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Ajouter un Nouveau Département
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
                htmlFor="name" 
                className="text-base font-medium"
              >
                Nom du département
              </Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="min-h-[120px] text-base p-3"
              />
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label 
                htmlFor="managerId" 
                className="text-base font-medium"
              >
                Manager du département
              </Label>
              <Select
                name="managerId"
                value={managerId}
                onValueChange={setManagerId}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Sélectionner un manager" />
                </SelectTrigger>
                <SelectContent>
                  {potentialManagers.map((manager) => (
                    <SelectItem 
                      key={manager.id} 
                      value={manager.id}
                      className="text-base"
                    >
                      {manager.firstName} {manager.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-base font-medium">
                Membres du départment
              </Label>
              <Card>
                <ScrollArea className="h-72 sm:h-80 w-full rounded-md border p-4">
                  {potentialManagers.map((user) => (
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
              disabled={isSubmitting || uploadWidgetIsBusy}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                "Créer le Département"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
