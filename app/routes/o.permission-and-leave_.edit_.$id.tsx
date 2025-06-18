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
import { AlertCircle, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { permissionAndLeaveService } from "~/services/permissionAndLeave.service.server";
import { userService } from "~/services/user.service.server";
import { authService } from "~/services/auth.service.server";
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { PermissionsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [PermissionsActions.Edit, PermissionsActions.EditOwn] }
  });

  try {
    const permissionAndLeave = await permissionAndLeaveService.readOne({
      id: params.id,
      populate: "user,approver,attachments",
    });
    const users = await userService.readMany({});

    if (!permissionAndLeave) {
      throw Response.json(
        { message: "Demande de permission ou congé non trouvée" },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this specific request
    const hasFullEditAccess = await authService.can(currentUser.id, PermissionsActions.Edit);
    const canEditOwn = await authService.can(currentUser.id, PermissionsActions.EditOwn, {
      resourceOwnerId: permissionAndLeave.user.toString(),
      targetUserId: currentUser.id
    });

    if (!hasFullEditAccess && !canEditOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      list: await authService.can(currentUser.id, {
        any: [PermissionsActions.List, PermissionsActions.ListOwn]
      })
    };

    return Response.json({ permissionAndLeave, users, can });
  } catch (error) {
    console.error("Error fetching permission and leave:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération de la demande" },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  // Always require user authentication before any other operation
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PermissionsActions.Edit, PermissionsActions.EditOwn]}})

  const formData = await request.formData();
  const type = formData.get("type") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;
  const status = formData.get("status") as string;
  const attachments = formData.getAll("attachments");
  try {
    const p = await permissionAndLeaveService.updateOneAfterFindIt(params.id, {
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      status,
      attachments,
      approver: status !== "Pending" ? currentLoggedUser.id : undefined,
    });


    return redirect(`/o/permission-and-leave/view/${params.id}`);
  } catch (error) {
    console.error("Error updating permission and leave:", error);
    return Response.json(
      { success: false, message: "Échec de la mise à jour de la demande" },
      { status: 400 }
    );
  }
};

export default function EditPermissionAndLeave() {
  const { permissionAndLeave, users,can } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    permissionAndLeave.attachments
  );
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const submit = useSubmit();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    selectedDocuments.forEach((doc) => {
      formData.append("attachments", doc.id);
    });
    submit(formData, { method: "post" });
  };

  const handleDocumentSelect = (documents: IDocument[]) => {
    //setSelectedDocuments(prevDocs => [...prevDocs, ...documents]);
    setSelectedDocuments(documents);
  };
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-2xl">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/permission-and-leave">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
        </Button>
      )}
  
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Modifier la Demande de Permission ou Congé
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {actionData?.error && (
            <Alert variant="destructive" className="mb-6">
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
              <div className="space-y-3">
                <Label 
                  htmlFor="type" 
                  className="text-base font-medium"
                >
                  Type
                </Label>
                <Select
                  name="type"
                  defaultValue={permissionAndLeave.type}
                  required
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permission" className="text-base">Permission</SelectItem>
                    <SelectItem value="Leave" className="text-base">Congé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="startDate" 
                  className="text-base font-medium"
                >
                  Date de début
                </Label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  defaultValue={new Date(permissionAndLeave.startDate).toISOString().split("T")[0]}
                  required
                  className="h-12 text-base"
                />
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="endDate" 
                  className="text-base font-medium"
                >
                  Date de fin
                </Label>
                <Input
                  type="date"
                  id="endDate"
                  name="endDate"
                  defaultValue={new Date(permissionAndLeave.endDate).toISOString().split("T")[0]}
                  required
                  className="h-12 text-base"
                />
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="reason" 
                  className="text-base font-medium"
                >
                  Raison
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  defaultValue={permissionAndLeave.reason}
                  required
                  className="min-h-[120px] text-base p-3 resize-y"
                />
              </div>
  
              <div className="space-y-3">
                <Label 
                  htmlFor="status" 
                  className="text-base font-medium"
                >
                  Statut
                </Label>
                <Select
                  name="status"
                  defaultValue={permissionAndLeave.status}
                  required
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Sélectionnez le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending" className="text-base">En attente</SelectItem>
                    <SelectItem value="Approved" className="text-base">Approuvé</SelectItem>
                    <SelectItem value="Rejected" className="text-base">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
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
                  defaultSelectedDocuments={permissionAndLeave.attachments}
                  multiple={true}
                  accept="image/*,application/pdf"
                  maxSize={5 * 1024 * 1024}
                  onBusyStateChange={setUploadWidgetIsBusy}
                />
              </div>
  
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isSubmitting || uploadWidgetIsBusy || navigation.state === "submitting"}
              >
                {isSubmitting || navigation.state === "submitting" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mise à jour en cours...
                  </span>
                ) : (
                  'Mettre à jour la demande'
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )  
}

