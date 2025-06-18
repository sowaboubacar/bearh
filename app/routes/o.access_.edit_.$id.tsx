/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-unknown-property */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useState, useEffect } from "react";
import { Form, useActionData, useNavigation, Link, useLoaderData } from "@remix-run/react";
import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { ChevronLeft, AlertTriangle, Loader2, Check } from 'lucide-react';
import { accessService } from "~/services/access.service.server";
import { authService } from "~/services/auth.service.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AccessActions, AccessPermission, permissionCategories } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request, params }) => {
  await authService.requireUser(request, { condition: AccessActions.Edit });
  const id = params.id;
  if (!id) {
    throw new Error("Access ID is required");
  }
  const access = await accessService.readOne({id, populate: 'createdBy,updatedBy'});
  if (!access) {
    throw new Error("Access not found");
  }
  return Response.json({ access });
};

export const action: ActionFunction = async ({ request, params }) => {
  const authenticatedUser = await authService.requireUser(request, { condition: AccessActions.Edit });
  const accessId = params.id;
  if (!accessId) {
    return { success: false, message: "Access ID is required" };
  }

  const formData = await request.formData();
  const accessData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    permissions: {} as AccessPermission,
    updatedBy: authenticatedUser.id,
  };

  Object.keys(permissionCategories).forEach((category) => {
    accessData.permissions[category as keyof AccessPermission] = Object.keys(permissionCategories[category as keyof AccessPermission].actions)
      .filter((action) => formData.get(`${category}-${action}`) === "on")
      .map(action => action as keyof typeof permissionCategories[typeof category]['actions']);
  });

  try {
    const updatedAccess = await accessService.updateOne(accessId, accessData);
    return redirect(`/o/access/view/${updatedAccess.id}`);
  } catch (error) {
    console.error("Error updating access:", error);
    return { success: false, message: "Une erreur est survenue lors de la mise à jour de l'accès." };
  }
};


export default function EditAccessForm() {
  const { access } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [permission, setPermission] = useState<AccessPermission>(access.permissions);

  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    setPermission(access.permissions);
  }, [access.permissions]);

  const handlePermissionChange = (category: keyof AccessPermission, action: string) => {
    setPermission((prevPermissions) => {
      const updatedCategory = prevPermissions[category]?.includes(action)
        ? prevPermissions[category]?.filter((a) => a !== action)
        : [...(prevPermissions[category] || []), action];
      return { ...prevPermissions, [category]: updatedCategory };
    });
  };

  const toggleAccordion = (category: string) => {
    setActiveAccordion(activeAccordion === category ? null : category);
  };

  if (!permissionCategories) {
    return (
      <Alert variant="destructive" className="mx-4 sm:mx-6 lg:mx-8">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
        <AlertTitle className="text-sm sm:text-base">Erreur</AlertTitle>
        <AlertDescription className="text-sm sm:text-base">
          Les catégories de permissions n'ont pas pu être chargées.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
      <Button 
        asChild 
        variant="outline" 
        className="mb-4 h-10 text-sm sm:h-11 sm:text-base"
      >
        <Link prefetch="intent" to="/o/access">
          <ChevronLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
          Retour à la liste
        </Link>
      </Button>

      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-slate-900 dark:border-gray-700">
        <CardHeader className="p-4 sm:p-6 lg:p-8">
          <CardTitle className="text-center text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Modifier l&apos;accès
          </CardTitle>
          {access.createdBy && (
            <i className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Créé par {access.createdBy.firstName} {access.createdBy.lastName} à{" "}
              {new Date(access.createdAt).toLocaleString()} -{" "}
              {access.updatedBy
                ? `Edité Par ${access.updatedBy.firstName} ${
                    access.updatedBy.lastName
                  } à ${new Date(access.updatedAt).toLocaleString()}`
                : ""}
            </i>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <Form method="post" className="space-y-4 sm:space-y-6">
            <div>
              <Label 
                htmlFor="name" 
                className="text-sm sm:text-base font-medium"
              >
                Nom de l&apos;accès
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                defaultValue={access.name}
                className="mt-1.5 h-10 text-sm sm:h-11 sm:text-base"
              />
            </div>

            <div>
              <Label 
                htmlFor="description"
                className="text-sm sm:text-base font-medium"
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={access.description}
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label className="text-sm sm:text-base font-medium">Permissions</Label>
              <div className="hs-accordion-group mt-3">
                {Object.entries(permissionCategories).map(
                  ([category, { label, actions }]) => (
                    <div
                      key={category}
                      className="hs-accordion border-b border-gray-200 dark:border-gray-700"
                    >
                      <button
                        type="button"
                        className="hs-accordion-toggle hs-accordion-active:text-blue-600 inline-flex items-center gap-x-3 w-full font-semibold text-left text-gray-800 transition py-4 px-4 sm:px-5 hover:text-gray-500 dark:hs-accordion-active:text-blue-500 dark:text-gray-200 dark:hover:text-gray-400 text-sm sm:text-base"
                        aria-controls={`accordion-${category}`}
                        onClick={() => toggleAccordion(category)}
                      >
                        <svg
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-gray-500 dark:text-gray-400 ${
                            activeAccordion === category ? "rotate-180" : ""
                          }`}
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        {label}
                      </button>
                      <div
                        id={`accordion-${category}`}
                        className={`hs-accordion-content w-full overflow-hidden transition-[height] duration-300 ${
                          activeAccordion === category ? "" : "hidden"
                        }`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(actions).map(
                              ([action, actionLabel]) => (
                                <div key={action} className="flex items-center">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      id={`${category}-${action}`}
                                      name={`${category}-${action}`}
                                      checked={permission[
                                        category as keyof AccessPermission
                                      ]?.includes(action)}
                                      onChange={() =>
                                        handlePermissionChange(
                                          category as keyof AccessPermission,
                                          action
                                        )
                                      }
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-5 h-5 sm:w-6 sm:h-6 border-2 rounded-full transition-colors ${
                                        permission[
                                          category as keyof AccessPermission
                                        ]?.includes(action)
                                          ? "bg-primary border-primary-600"
                                          : "border-gray-300 dark:border-gray-600"
                                      }`}
                                      onClick={() =>
                                        handlePermissionChange(
                                          category as keyof AccessPermission,
                                          action
                                        )
                                      }
                                    >
                                      {permission[
                                        category as keyof AccessPermission
                                      ]?.includes(action) && (
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                      )}
                                    </div>
                                  </div>
                                  <label
                                    htmlFor={`${category}-${action}`}
                                    className="ml-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer"
                                    onClick={() =>
                                      handlePermissionChange(
                                        category as keyof AccessPermission,
                                        action
                                      )
                                    }
                                  >
                                    {actionLabel}
                                  </label>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {actionData?.message && !actionData.success && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                <AlertTitle className="text-sm sm:text-base">Erreur</AlertTitle>
                <AlertDescription className="text-sm sm:text-base">
                  {actionData.message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-10 text-sm sm:h-11 sm:text-base" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Mise à jour en cours...
                </>
              ) : (
                "Mettre à jour l'accès"
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}