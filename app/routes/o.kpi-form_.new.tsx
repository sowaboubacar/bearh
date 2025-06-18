import { useState } from "react";
import {
  ActionFunction,
  redirect,
  json,
  LoaderFunction,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  Link,
  useRouteError,
  isRouteErrorResponse,
  useLoaderData,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { kpiFormService } from "~/services/kpiForm.service.server";
import { authService } from "~/services/auth.service.server";
import { positionService } from "~/services/position.service.server";
import { userService } from "~/services/user.service.server";
import { ScrollArea } from '~/components/ui/scroll-area'
import { Checkbox } from '~/components/ui/checkbox'
import { KpiFormActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [KpiFormActions.Create]}})
  try {
    const users = await userService.readMany({});
    const positions = await positionService.readMany({});
    return Response.json({ users, positions });
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
    condition: { any: [KpiFormActions.Create] },
  });

  const formData = await request.formData();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const criteriaCount = parseInt(formData.get("criteriaCount") as string);
  const applicableTo = {
    users: formData.getAll("applicableTo.users") as string[],
    positions: formData.getAll("applicableTo.positions") as string[],
  };

  const criteria = [];
  for (let i = 0; i < criteriaCount; i++) {
    criteria.push({
      name: formData.get(`criterionName${i}`) as string,
      maxScore: parseInt(formData.get(`criterionMaxScore${i}`) as string),
      description: formData.get(`criterionDescription${i}`) as string,
    });
  }

  try {
    const newKpiForm = await kpiFormService.createOne({
      title,
      description,
      applicableTo,
      criteria,
      createdBy: authenticatedUser.id, // Set the authenticated user as the creator
    });
    return redirect(`/o/kpi-form/view/${newKpiForm.id}`);
  } catch (error) {
    console.error("Error creating KPI form:", error);
    return Response.json(
      { success: false, error: "Échec de la création du formulaire KPI" },
      { status: 400 }
    );
  }
};

export default function NewKpiForm() {
  const { users, positions } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [criteria, setCriteria] = useState([
    { name: "", maxScore: 0, description: "" },
  ]);
  const [applicableTo, setApplicableTo] = useState({
    users: [],
    positions: [],
  });

  const handleApplicableToChange = (category, id) => {
    setApplicableTo((prev) => ({
      ...prev,
      [category]: prev[category].includes(id)
        ? prev[category].filter((item) => item !== id)
        : [...prev[category], id],
    }));
  };
  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  const addCriterion = () => {
    setCriteria([...criteria, { name: "", maxScore: 0, description: "" }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      <Button asChild variant="outline" className="mb-6 h-11 text-base">
        <Link prefetch="intent" to="/o/kpi-form">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Nouveau Formulaire KPI
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
              <Label htmlFor="title" className="text-base font-medium">
                Titre
              </Label>
              <Input
                id="title"
                name="title"
                required
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="description" className="text-base font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                className="min-h-[120px] text-base p-3"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold">Critères</h2>

              {criteria.map((criterion, index) => (
                <Card key={index} className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Critère {index + 1}</h3>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeCriterion(index)}
                      className="h-11 w-11"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                      <Label
                        htmlFor={`criterionName${index}`}
                        className="text-base font-medium"
                      >
                        Nom
                      </Label>
                      <Input
                        id={`criterionName${index}`}
                        name={`criterionName${index}`}
                        required
                        className="h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <Label
                        htmlFor={`criterionMaxScore${index}`}
                        className="text-base font-medium"
                      >
                        Note maximale
                      </Label>
                      <Input
                        type="number"
                        id={`criterionMaxScore${index}`}
                        name={`criterionMaxScore${index}`}
                        required
                        min="1"
                        className="h-11 text-base"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <Label
                        htmlFor={`criterionDescription${index}`}
                        className="text-base font-medium"
                      >
                        Description
                      </Label>
                      <Textarea
                        id={`criterionDescription${index}`}
                        name={`criterionDescription${index}`}
                        className="min-h-[120px] text-base p-3"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                onClick={addCriterion}
                className="w-full h-11 text-base"
              >
                <Plus className="mr-2 h-5 w-5" />
                Ajouter un critère
              </Button>
            </div>

            <input type="hidden" name="criteriaCount" value={criteria.length} />

            <div className="space-y-4">
              <Label className="text-base font-medium">Applicable à</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-none border">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold">
                      Employé(s)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-48 px-4">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-3 py-3"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={applicableTo.users.includes(user.id)}
                            onCheckedChange={() =>
                              handleApplicableToChange("users", user.id)
                            }
                            className="h-5 w-5"
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-base"
                          >
                            {user.firstName} {user.lastName}
                          </label>
                          {applicableTo.users.includes(user.id) && (
                            <input
                              type="hidden"
                              name="applicableTo.users"
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
                      Fiches de Poste
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-48 px-4">
                      {positions.map((position) => (
                        <div
                          key={position.id}
                          className="flex items-center space-x-3 py-3"
                        >
                          <Checkbox
                            id={`position-${position.id}`}
                            checked={applicableTo.positions.includes(position.id)}
                            onCheckedChange={() =>
                              handleApplicableToChange("positions", position.id)
                            }
                            className="h-5 w-5"
                          />
                          <label
                            htmlFor={`position-${position.id}`}
                            className="text-base"
                          >
                            {position.title}
                          </label>
                          {applicableTo.positions.includes(position.id) && (
                            <input
                              type="hidden"
                              name="applicableTo.positions"
                              value={position.id}
                            />
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 sm:p-6">
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isSubmitting || navigation.state === "submitting"}
            >
              {isSubmitting || navigation.state === "submitting" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création en cours...
                </span>
              ) : (
                "Créer le formulaire KPI"
              )}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
