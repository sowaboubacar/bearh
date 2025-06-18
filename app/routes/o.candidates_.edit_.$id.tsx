import { redirect, type ActionFunction, type LoaderFunction } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, Form, Link, useRouteError, isRouteErrorResponse, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { candidateService } from "~/services/candidate.service.server";
import { authService } from "~/services/auth.service.server";
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { UploadWidget } from "~/components/UploadWidget";
import type { IDocument } from "~/core/entities/document.entity.server";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { CandidateActions } from "~/core/entities/utils/access-permission";


export const loader: LoaderFunction = async ({ params, request }) => {
  await authService.requireUser(request, {condition: CandidateActions.List});

  try {
    const candidate = await candidateService.readOne({
      id: params.id,
      populate: "attachments",
    });
    if (!candidate) {
      throw Response.json({ message: "Candidat non trouvé" }, { status: 404 });
    }

    return Response.json({ candidate });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération du candidat." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  await authService.requireUser(request, {condition: CandidateActions.Edit});

  const formData = await request.formData();
  const attachments = formData.getAll('attachments')

  const candidateData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    positionApplied: formData.get("positionApplied") as string,
    status: formData.get("status") as string,
    applicationDate: new Date(formData.get("applicationDate") as string),
    notes: formData.get("notes") as string,
    attachments
  };

  try {
    await candidateService.updateOneAfterFindIt(params.id, candidateData);
  
    
    return redirect(`/o/candidates/view/${params.id}`);
  } catch (error) {
    console.error("Error updating candidate:", error);
    return Response.json({ error: "Une erreur est survenue lors de la mise à jour du candidat." }, { status: 400 });
  }
};

export default function EditCandidatePage() {
  const { candidate } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [status, setStatus] = useState(candidate.status);

  const isSubmitting = navigation.state === "submitting";
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    candidate.attachments
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
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/candidates">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Modifier le Candidat
          </CardTitle>
        </CardHeader>
        <Form method="post" onSubmit={handleSubmit}>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-base">Prénom</Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  defaultValue={candidate.firstName} 
                  required 
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-base">Nom</Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  defaultValue={candidate.lastName} 
                  required 
                  className="h-11 text-base"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                defaultValue={candidate.email} 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base">Téléphone</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                defaultValue={candidate.phone} 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="positionApplied" className="text-base">Poste demandé</Label>
              <Input 
                id="positionApplied" 
                name="positionApplied" 
                defaultValue={candidate.positionApplied} 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-base">Statut</Label>
              <Select name="status" value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Process" className="text-base">En cours</SelectItem>
                  <SelectItem value="Rejected" className="text-base">Rejeté</SelectItem>
                  <SelectItem value="Hired" className="text-base">Embauché</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="applicationDate" className="text-base">Date de candidature</Label>
              <Input 
                id="applicationDate" 
                name="applicationDate" 
                type="date" 
                defaultValue={new Date(candidate.applicationDate).toISOString().split('T')[0]}
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">Notes</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                rows={4} 
                defaultValue={candidate.notes}
                className="text-base min-h-[120px] resize-y"
              />
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
                defaultSelectedDocuments={candidate.attachments}
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
              className="w-full h-11 text-base" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                "Mettre à jour le Candidat"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
