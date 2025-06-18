import { useState } from "react";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  Link,
  useRouteError,
  isRouteErrorResponse,
  useSubmit,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { observationService } from "~/services/observation.service.server";
import { userService } from "~/services/user.service.server";
import { authService } from "~/services/auth.service.server";
import { UploadWidget } from "~/components/UploadWidget";
import { ObservationActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const can = await authService.requireUser(request, {condition: {any: [ObservationActions.Create]}})

  const url = new URL(request.url);
  const quickUser = url.searchParams.get("quickUser");
  const user = quickUser && quickUser.replace(/[^a-zA-Z0-9]/g, "");
  let quickUserDetails = null;

  try {
    quickUserDetails = user ? await userService.readOne({ id: user }) : null;
  } catch (error) {
    console.error("Error fetching quick user:", error);
    quickUserDetails = null;
  }

  try {
    const users = await userService.readMany({});
    return Response.json({ users, quickUser: quickUserDetails });
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json(
      { message: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  // Always require user authentication before any other operation
  const authenticatedUser = await authService.requireUser(request, {
    condition: { any: [ObservationActions.Create] },
  });

  const formData = await request.formData();
  const user = formData.get("user") as string;
  const type = formData.get("type") as string;
  const content = formData.get("content") as string;
  const attachments = formData.getAll("attachments") as string[];

  try {
    const newObservation = await observationService.createOne({
      user,
      type,
      content,
      author: authenticatedUser.id, // Set the authenticated user as the author
      attachments,
    });
    return redirect(`/o/observation/view/${newObservation.id}`);
  } catch (error) {
    console.error("Error creating observation:", error);
    return Response.json(
      { success: false, error: "Échec de la création de l'observation" },
      { status: 400 }
    );
  }
};

export default function NewObservation() {
  const { users, quickUser } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

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
  
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/observation">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
  
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouvelle Remarque
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
  
            {quickUser && quickUser.firstName && (
              <>
                <Alert variant="secondary" className="bg-primary text-white">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-base font-medium">
                    Vous faites une remarque à l&apos;employé:
                  </AlertTitle>
                  <AlertDescription className="text-base font-semibold">
                    {quickUser.firstName} {quickUser.lastName}
                  </AlertDescription>
                </Alert>
  
                <input type="hidden" name="user" value={quickUser.id} />
              </>
            )}
  
            {!quickUser && (
              <div className="space-y-3">
                <Label 
                  htmlFor="user" 
                  className="text-base font-medium"
                >
                  Sélectionner un employé pour faire votre remarque
                </Label>
                <Select name="user" required>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Sélectionnez un employé" />
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
            )}
  
            <div className="space-y-3">
              <Label 
                htmlFor="type" 
                className="text-base font-medium"
              >
                Type de remarque
              </Label>
              <Select name="type" required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positive" className="text-base">
                    Positive
                  </SelectItem>
                  <SelectItem value="Neutral" className="text-base">Neutre</SelectItem>
                  <SelectItem value="Negative" className="text-base">
                    Négative
                  </SelectItem>

                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-3">
              <Label 
                htmlFor="content" 
                className="text-base font-medium"
              >
                Contenu
              </Label>
              <Textarea 
                id="content" 
                name="content" 
                required 
                className="min-h-[150px] text-base p-3"
              />
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
              className="w-full h-12 text-base"
              disabled={isSubmitting || navigation.state === "submitting"}
            >
              {isSubmitting || navigation.state === "submitting" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                "Faire la remarque"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );  
}
