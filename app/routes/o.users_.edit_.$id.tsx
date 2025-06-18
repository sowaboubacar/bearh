import { useState } from "react";
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AlertCircle, Loader2, ArrowLeft, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { userService } from "~/services/user.service.server";
import { authService } from "~/services/auth.service.server";
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { accessService } from "~/services/access.service.server";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Checkbox } from "~/components/ui/checkbox";
import { UserActions } from "~/core/entities/utils/access-permission";

interface EarningItem {
  id: string;
  description: string;
  amount: number;
  isPercentage: boolean;
}

interface DeductionItem {
  id: string;
  description: string;
  amount: number;
  isPercentage: boolean;
}

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [UserActions.Edit, UserActions.EditOwn] }
  });

  const user = await userService.readOne({
    id: params.id as string,
    populate: "avatar,access,currentBonusCategory,currentPosition,currentDepartment,currentHourGroup,currentTeam,documents,supervisors",
  });

  if (!user) {
    throw Response.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Check if user has permission to edit this specific user
  const hasFullEditAccess = await authService.can(currentLoggedUser.id, UserActions.Edit);
  const canEditOwn = await authService.can(currentLoggedUser.id, UserActions.EditOwn, {
    resourceOwnerId: user.id,
    targetUserId: currentLoggedUser.id
  });

  if (!hasFullEditAccess && !canEditOwn) {
    throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
  }

  const accesses = await accessService.readMany({});
  const users = await userService.readMany({});

  const can = {
    list: await authService.can(currentLoggedUser.id, {
      any: [UserActions.List]
    })
  };

  return Response.json({ user, accesses, users, can });
};

export const action: ActionFunction = async ({ request, params }) => {
  await authService.requireUser(request, {condition: {any: [UserActions.Edit]}});

  const formData = await request.formData();
  const attachments = formData.getAll("attachments") as string[];
  const supervisors = formData.getAll("supervisors") as string[];
  const payrollData = JSON.parse(formData.get("payroll") as string);
  
  const userData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    access: formData.get("access") as string,
    supervisors: supervisors.length > 0 ? supervisors : null,
    avatar: attachments.length > 0 ? attachments[0] : null,
    payroll: payrollData
  };

  Object.keys(userData).forEach((key) => {
    if (!userData[key]) {
      delete userData[key];
    }
  });
  
  try {
    console.log("User data:", userData);
    const updatedUser = await userService.updateOne(params.id, userData);
    return redirect(`/o/users/view/${params.id}`);
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json(
      { success: false, message: "Échec de la mise à jour de l'utilisateur" },
      { status: 400 }
    );
  }
};

export default function EditUser() {
  const { user, users, accesses, can } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAvatar, setUserAvatar] = useState<IDocument | null>(user.avatar);
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>(
    user.avatar ? [user.avatar] : []
  );

  const [supervisors, setSupervisors] = useState<string[]>(
    user.supervisors.map((supervisor: any) => supervisor.id)
  );

  // Initialize earnings and deductions from user data
  const [earnings, setEarnings] = useState<EarningItem[]>(
    user.payroll?.earnings || []
  );
  const [deductions, setDeductions] = useState<DeductionItem[]>(
    user.payroll?.deductions || []
  );

  const handleSupervisorToggle = (userId: string) => {
    setSupervisors((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDocumentSelect = (documents: IDocument[]) => {
    setSelectedDocuments(documents);
    if (selectedDocuments.length > 0) setUserAvatar(selectedDocuments[0]);
  };

  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    selectedDocuments.forEach((doc) => {
      formData.append("attachments", doc.id);
    });
    
    // Add payroll data to form submission
    formData.append("payroll", JSON.stringify({
      earnings,
      deductions
    }));
    
    submit(formData, { method: "post" });
  };

  const addEarning = () => {
    const newEarning: EarningItem = {
      id: crypto.randomUUID(),
      description: "",
      amount: 0,
      isPercentage: false
    };
    setEarnings([...earnings, newEarning]);
  };

  const addDeduction = () => {
    const newDeduction: DeductionItem = {
      id: crypto.randomUUID(),
      description: "",
      amount: 0,
      isPercentage: false
    };
    setDeductions([...deductions, newDeduction]);
  };

  const updateEarning = (id: string, field: keyof EarningItem, value: string | number | boolean) => {
    setEarnings(earnings.map(earning => 
      earning.id === id ? { ...earning, [field]: value } : earning
    ));
  };

  const updateDeduction = (id: string, field: keyof DeductionItem, value: string | number | boolean) => {
    setDeductions(deductions.map(deduction => 
      deduction.id === id ? { ...deduction, [field]: value } : deduction
    ));
  };

  const removeEarning = (id: string) => {
    setEarnings(earnings.filter(earning => earning.id !== id));
  };

  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter(deduction => deduction.id !== id));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      {can?.list && (
        <Button asChild variant="outline" className="mb-6 h-12 text-base">
          <Link prefetch="intent" to="/o/users">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour à la liste
          </Link>
        </Button>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Modifier l'Utilisateur
          </CardTitle>
        </CardHeader>
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

          <Form method="post" onSubmit={handleSubmit}>
            
          <div className="space-y-3">
                <Label
                  htmlFor="attachments"
                  className="text-base font-medium text-center block"
                >
                  Avatar (Photo de Profile)
                </Label>
                <UploadWidget
                  onSelect={handleDocumentSelect}
                  defaultSelectedDocuments={userAvatar ? [userAvatar] : []}
                  multiple={false}
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                  onBusyStateChange={setUploadWidgetIsBusy}
                  isAvatar={true}
                />
              </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-medium">
                    Prénom
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    defaultValue={user.firstName}
                    required
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-medium">
                    Nom
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    defaultValue={user.lastName}
                    required
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="access" className="text-base font-medium">
                  Droit d'Accès
                </Label>
                <Select name="access" defaultValue={user.access?.id}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Sélectionnez un droit d'accès" />
                  </SelectTrigger>
                  <SelectContent>
                    {accesses.map((access) => (
                      <SelectItem
                        key={access.id}
                        value={access.id}
                        className="text-base"
                      >
                        {access.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-base font-medium">
                  Modifier ses superviseurs
                </Label>
                <Card>
                  <ScrollArea className="h-72 sm:h-80 w-full rounded-md border p-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-3 py-3 sm:py-4"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={supervisors.includes(user.id)}
                          onCheckedChange={() =>
                            handleSupervisorToggle(user.id)
                          }
                          className="h-5 w-5 sm:h-6 sm:w-6"
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-base font-medium cursor-pointer"
                        >
                          {user.firstName} {user.lastName}
                        </label>
                        {supervisors.includes(user.id) && (
                          <input
                            type="hidden"
                            name="supervisors"
                            value={user.id}
                          />
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </Card>
              </div>


              {/* Payroll Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Revenus</Label>
                  {earnings.map((earning) => (
                    <div key={earning.id} className="flex gap-4 items-center">
                      <Input
                        type="text"
                        placeholder="Description"
                        value={earning.description}
                        onChange={(e) => updateEarning(earning.id, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Montant"
                        value={earning.amount}
                        onChange={(e) => updateEarning(earning.id, 'amount', parseFloat(e.target.value))}
                        className="w-32"
                      />
                      <Checkbox
                        checked={earning.isPercentage}
                        onCheckedChange={(checked) => updateEarning(earning.id, 'isPercentage', !!checked)}
                      />
                      <Label className="text-sm">%</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEarning(earning.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEarning}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un revenu
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Déductions</Label>
                  {deductions.map((deduction) => (
                    <div key={deduction.id} className="flex gap-4 items-center">
                      <Input
                        type="text"
                        placeholder="Description"
                        value={deduction.description}
                        onChange={(e) => updateDeduction(deduction.id, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Montant"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(deduction.id, 'amount', parseFloat(e.target.value))}
                        className="w-32"
                      />
                      <Checkbox
                        checked={deduction.isPercentage}
                        onCheckedChange={(checked) => updateDeduction(deduction.id, 'isPercentage', !!checked)}
                      />
                      <Label className="text-sm">%</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDeduction(deduction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDeduction}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une déduction
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={
                  isSubmitting ||
                  uploadWidgetIsBusy ||
                  navigation.state === "submitting"
                }
              >
                {isSubmitting || navigation.state === "submitting" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mise à jour...
                  </span>
                ) : (
                  "Mettre à jour l'utilisateur"
                )}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

