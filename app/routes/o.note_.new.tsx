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
import { ScrollArea } from "~/components/ui/scroll-area";
import { AlertCircle, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { noteService } from "~/services/note.service.server";
import { userService } from "~/services/user.service.server";
import { positionService } from "~/services/position.service.server";
import { teamService } from "~/services/team.service.server";
import { departmentService } from "~/services/department.service.server";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { accessService } from "~/services/access.service.server";
import { authService } from "~/services/auth.service.server";
import { UploadWidget } from "~/components/UploadWidget";
import { documentService } from "~/services/document.service.server";
import type { IDocument } from "~/core/entities/document.entity.server";
import { NoteActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [NoteActions.Create]}})

  try {
    const [users, positions, teams, departments, hourGroups, access] =
      await Promise.all([
        userService.readMany({}),
        positionService.readMany({}),
        teamService.readMany({}),
        departmentService.readMany({}),
        hourGroupService.readMany({}),
        accessService.readMany({}),
      ]);
    return Response.json({
      users,
      positions,
      teams,
      departments,
      hourGroups,
      access,
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
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [NoteActions.Create]}})

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const visibility = formData.get("visibility") as string;

  const sharedWith = {
    users: formData.getAll("sharedWith.users") as string[],
    positions: formData.getAll("sharedWith.positions") as string[],
    teams: formData.getAll("sharedWith.teams") as string[],
    departments: formData.getAll("sharedWith.departments") as string[],
    hourGroups: formData.getAll("sharedWith.hourGroups") as string[],
    access: formData.getAll("sharedWith.access") as string[],
  };
  const attachments = formData.getAll("attachments") as string[];

  try {
    const newNote = await noteService.createOne({
      title,
      attachments,
      content,
      author: authenticatedUser.id,
      visibility,
      sharedWith: visibility === "Shared" ? sharedWith : undefined,
    });

  
    return redirect(`/o/note/view/${newNote.id}`);
  } catch (error) {
    console.error("Error creating note:", error);
    return Response.json(
      { success: false, error: "Échec de la création de la note" },
      { status: 400 }
    );
  }
};

export default function NewNote() {
  const { users, positions, teams, departments, hourGroups, access } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [visibility, setVisibility] = useState("Private");
  const [sharedWith, setSharedWith] = useState({
    users: [],
    positions: [],
    teams: [],
    departments: [],
    hourGroups: [],
    access: [],
  });

  const [selectedDocuments, setSelectedDocuments] = useState<IDocument[]>([]);
  const [uploadWidgetIsBusy, setUploadWidgetIsBusy] = useState(false);

  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

  const handleSharedWithChange = (category, id) => {
    setSharedWith((prev) => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter((item) => item !== id)
        : [...prev[category], id],
    }));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Button asChild variant="outline" className="mb-6 h-12 text-base">
        <Link prefetch="intent" to="/o/note">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouvelle Note
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
              <Label htmlFor="visibility" className="text-base font-medium">
                Visibilité
              </Label>
              <Select name="visibility" onValueChange={setVisibility} required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Sélectionnez la visibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private" className="text-base">
                    Privée
                  </SelectItem>
                  <SelectItem value="Public" className="text-base">
                    Publique
                  </SelectItem>
                  <SelectItem value="Shared" className="text-base">
                    Partagée
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibility === "Shared" && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Partagée avec</Label>
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
                              checked={sharedWith.users.includes(user.id)}
                              onCheckedChange={() =>
                                handleSharedWithChange("users", user.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`user-${user.id}`}
                              className="text-base"
                            >
                              {user.firstName} {user.lastName}
                            </label>
                            {sharedWith.users.includes(user.id) && (
                              <input
                                type="hidden"
                                name="sharedWith.users"
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
                              checked={sharedWith.positions.includes(
                                position.id
                              )}
                              onCheckedChange={() =>
                                handleSharedWithChange("positions", position.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`position-${position.id}`}
                              className="text-base"
                            >
                              {position.title}
                            </label>
                            {sharedWith.positions.includes(position.id) && (
                              <input
                                type="hidden"
                                name="sharedWith.positions"
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
                              checked={sharedWith.teams.includes(team.id)}
                              onCheckedChange={() =>
                                handleSharedWithChange("teams", team.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`team-${team.id}`}
                              className="text-base"
                            >
                              {team.name}
                            </label>
                            {sharedWith.teams.includes(team.id) && (
                              <input
                                type="hidden"
                                name="sharedWith.teams"
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
                              checked={sharedWith.departments.includes(
                                department.id
                              )}
                              onCheckedChange={() =>
                                handleSharedWithChange(
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
                            {sharedWith.departments.includes(department.id) && (
                              <input
                                type="hidden"
                                name="sharedWith.departments"
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
                              checked={sharedWith.hourGroups.includes(
                                hourGroup.id
                              )}
                              onCheckedChange={() =>
                                handleSharedWithChange(
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
                            {sharedWith.hourGroups.includes(hourGroup.id) && (
                              <input
                                type="hidden"
                                name="sharedWith.hourGroups"
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
                        {access.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <Checkbox
                              id={`access-${item.id}`}
                              checked={sharedWith.access.includes(item.id)}
                              onCheckedChange={() =>
                                handleSharedWithChange("access", item.id)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`access-${item.id}`}
                              className="text-base"
                            >
                              {item.name}
                            </label>
                            {sharedWith.access.includes(item.id) && (
                              <input
                                type="hidden"
                                name="sharedWith.access"
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
                maxSize={5 * 1024 * 1024}
                onBusyStateChange={setUploadWidgetIsBusy}
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
                "Créer la note"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}

