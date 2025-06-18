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
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { newsService } from "~/services/news.service.server";
import { userService } from "~/services/user.service.server";
import { teamService } from "~/services/team.service.server";
import { departmentService } from "~/services/department.service.server";
import { positionService } from "~/services/position.service.server";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { accessService } from "~/services/access.service.server";
import { authService } from "~/services/auth.service.server";
import { UploadWidget } from "~/components/UploadWidget";
import DocumentService, {
  documentService,
} from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { NewsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [NewsActions.Create]}})

  try {
    const users = await userService.readMany({});
    const teams = await teamService.readMany({});
    const departments = await departmentService.readMany({});
    const positions = await positionService.readMany({});
    const hourGroups = await hourGroupService.readMany({});
    const accesses = await accessService.readMany({});
    return Response.json({
      users,
      teams,
      departments,
      positions,
      hourGroups,
      accesses,
    });
  } catch (error) {
    console.error("Error in loader:", error);
    throw Response.json(
      { message: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
};

export const action: ActionFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [NewsActions.Create]}})

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  const isPublished = formData.get("isPublished") === "on";
  const isPublic = formData.get("isPublic") === "on";
  const isEmergency = formData.get("isEmergency") === "on";

  const targetAudience = isPublic
    ? undefined
    : {
        users: formData.getAll("targetAudience.users"),
        positions: formData.getAll("targetAudience.positions"),
        teams: formData.getAll("targetAudience.teams"),
        departments: formData.getAll("targetAudience.departments"),
        hourGroups: formData.getAll("targetAudience.hourGroups"),
        access: formData.getAll("targetAudience.access"),
      };
  const attachments = formData.getAll("attachments");

  try {
    const newNews = await newsService.createOne({
      title,
      content,
      author: currentLoggedUser.id,
      type,
      isPublished,
      isPublic,
      targetAudience,
      attachments,
      isEmergency,
    });

   
    return redirect(`/o/news/view/${newNews.id}`);
  } catch (error) {
    console.error("Error creating news:", error);
    return Response.json(
      { success: false, error: "Échec de la création de l'actualité" },
      { status: 400 }
    );
  }
};

export default function NewNews() {
  const { users, teams, departments, positions, hourGroups, accesses } =
    useLoaderData<typeof loader>();
  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [targetAudience, setTargetAudience] = useState({
    users: [],
    positions: [],
    teams: [],
    departments: [],
    hourGroups: [],
    access: [],
  });
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const submit = useSubmit();

  const handleTargetAudienceChange = (category, id) => {
    setTargetAudience((prev) => {
      const updatedCategory = prev[category].includes(id)
        ? prev[category].filter((item) => item !== id)
        : [...prev[category], id];
      return { ...prev, [category]: updatedCategory };
    });
  };

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button asChild variant="outline" className="mb-6 h-12 text-base">
        <Link prefetch="intent" to="/o/news">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouvelle Publication
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
              <Label htmlFor="title" className="text-base font-medium">
                Titre
              </Label>
              <Input
                id="title"
                name="title"
                required
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="content" className="text-base font-medium">
                Contenu
              </Label>
              <Textarea
                id="content"
                name="content"
                required
                className="min-h-[150px] text-base p-3"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="type" className="text-base font-medium">
                Type
              </Label>
              <Select name="type" required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Announcement" className="text-base">
                    Annonce
                  </SelectItem>
                  <SelectItem value="Event" className="text-base">
                    Événement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto w-full p-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="isPublished"
                  name="isPublished"
                  className="h-5 w-10 sm:h-6 sm:w-11"
                />
                <Label
                  htmlFor="isPublished"
                  className="text-sm sm:text-base font-medium truncate"
                >
                  Publier immédiatement
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="isEmergency"
                  name="isEmergency"
                  className="h-5 w-10 sm:h-6 sm:w-11"
                />
                <Label
                  htmlFor="isEmergency"
                  className="text-sm sm:text-base font-medium"
                >
                  Urgent
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="isPublic"
                  name="isPublic"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  className="h-5 w-10 sm:h-6 sm:w-11"
                />
                <Label
                  htmlFor="isPublic"
                  className="text-sm sm:text-base font-medium"
                >
                  Public
                </Label>
              </div>
            </div>

            {!isPublic && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Public cible</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="shadow-none border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-semibold">
                        Utilisateurs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-48 px-4">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={targetAudience.users.includes(user.id)}
                              onCheckedChange={() =>
                                handleTargetAudienceChange("users", user.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`user-${user.id}`}
                              className="text-base"
                            >
                              {user.firstName} {user.lastName}
                            </label>
                            {targetAudience.users.includes(user.id) && (
                              <input
                                type="hidden"
                                name="targetAudience.users"
                                value={user.id}
                              />
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-semibold">
                        Postes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-48 px-4">
                        {positions.map((position) => (
                          <div
                            key={position.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`position-${position.id}`}
                              checked={targetAudience.positions.includes(
                                position.id
                              )}
                              onCheckedChange={() =>
                                handleTargetAudienceChange(
                                  "positions",
                                  position.id
                                )
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`position-${position.id}`}
                              className="text-base"
                            >
                              {position.title}
                            </label>
                            {targetAudience.positions.includes(position.id) && (
                              <input
                                type="hidden"
                                name="targetAudience.positions"
                                value={position.id}
                              />
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-semibold">
                        Équipes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-48 px-4">
                        {teams.map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`team-${team.id}`}
                              checked={targetAudience.teams.includes(team.id)}
                              onCheckedChange={() =>
                                handleTargetAudienceChange("teams", team.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`team-${team.id}`}
                              className="text-base"
                            >
                              {team.name}
                            </label>
                            {targetAudience.teams.includes(team.id) && (
                              <input
                                type="hidden"
                                name="targetAudience.teams"
                                value={team.id}
                              />
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-semibold">
                        Départements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-48 px-4">
                        {departments.map((department) => (
                          <div
                            key={department.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`department-${department.id}`}
                              checked={targetAudience.departments.includes(
                                department.id
                              )}
                              onCheckedChange={() =>
                                handleTargetAudienceChange(
                                  "departments",
                                  department.id
                                )
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`department-${department.id}`}
                              className="text-base"
                            >
                              {department.name}
                            </label>
                            {targetAudience.departments.includes(
                              department.id
                            ) && (
                              <input
                                type="hidden"
                                name="targetAudience.departments"
                                value={department.id}
                              />
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-semibold">
                        Groupes Horaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-48 px-4">
                        {hourGroups.map((hourGroup) => (
                          <div
                            key={hourGroup.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`hourGroup-${hourGroup.id}`}
                              checked={targetAudience.hourGroups.includes(
                                hourGroup.id
                              )}
                              onCheckedChange={() =>
                                handleTargetAudienceChange(
                                  "hourGroups",
                                  hourGroup.id
                                )
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`hourGroup-${hourGroup.id}`}
                              className="text-base"
                            >
                              {hourGroup.name}
                            </label>
                            {targetAudience.hourGroups.includes(
                              hourGroup.id
                            ) && (
                              <input
                                type="hidden"
                                name="targetAudience.hourGroups"
                                value={hourGroup.id}
                              />
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base font-semibold">
                        Groupes d'Accès
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-48 px-4">
                        {accesses.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`access-${item.id}`}
                              checked={targetAudience.access.includes(item.id)}
                              onCheckedChange={() =>
                                handleTargetAudienceChange("access", item.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`access-${item.id}`}
                              className="text-base"
                            >
                              {item.name}
                            </label>
                            {targetAudience.access.includes(item.id) && (
                              <input
                                type="hidden"
                                name="targetAudience.access"
                                value={item.id}
                              />
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="attachments" className="text-base font-medium">
                Images & Pièces jointes
              </Label>
              <UploadWidget
                onSelect={handleDocumentSelect}
                multiple={true}
                accept="image/*,application/pdf"
                maxSize={1 * 1024 * 1024}
                onBusyStateChange={setUploadWidgetIsBusy}
              />
            </div>
          </CardContent>

          <CardFooter className="p-4 sm:p-6">
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
                  Publication en cours...
                </span>
              ) : (
                "Publier "
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
