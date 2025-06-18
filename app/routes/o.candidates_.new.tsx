import { type ActionFunction, type LoaderFunction, redirect, json } from "@remix-run/node";
import { useActionData, useNavigation, Form, Link, useRouteError, isRouteErrorResponse, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { candidateService } from "~/services/candidate.service.server";
import { authService } from "~/services/auth.service.server";
import { ArrowLeft, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { CandidateActions } from "~/core/entities/utils/access-permission";


export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {condition: CandidateActions.Create});

  const formData = await request.formData();
  const attachments = formData.getAll("attachments") as string[];
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
    const newCandidate = await candidateService.createOne(candidateData);

   
    return redirect(`/o/candidates/view/${newCandidate.id}`);
  } catch (error) {
    console.error("Error creating candidate:", error);
    return Response.json({ error: "Une erreur est survenue lors de la création du candidat." }, { status: 400 });
  }
};

export default function NewCandidatePage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [status, setStatus] = useState("In Process");

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
            Ajouter un Nouveau Candidat
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
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="firstName" className="text-base font-medium">
                  Prénom
                </Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  required 
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="lastName" className="text-base font-medium">
                  Nom
                </Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  required 
                  className="h-11 text-base"
                />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="phone" className="text-base font-medium">
                Téléphone
              </Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="positionApplied" className="text-base font-medium">
                Poste demandé
              </Label>
              <Input 
                id="positionApplied" 
                name="positionApplied" 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="status" className="text-base font-medium">
                Statut
              </Label>
              <Select name="status" value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Process" className="text-base">
                    En cours
                  </SelectItem>
                  <SelectItem value="Rejected" className="text-base">
                    Rejeté
                  </SelectItem>
                  <SelectItem value="Hired" className="text-base">
                    Embauché
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="applicationDate" className="text-base font-medium">
                Date de candidature
              </Label>
              <Input 
                id="applicationDate" 
                name="applicationDate" 
                type="date" 
                required 
                className="h-11 text-base"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="notes" className="text-base font-medium">
                Notes
              </Label>
              <Textarea 
                id="notes" 
                name="notes" 
                rows={4} 
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
                  Création en cours...
                </>
              ) : (
                "Créer le Candidat"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}

  
