import { useState } from "react";
import { Link, useLoaderData, useNavigate, useRouteError } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/node";
import {  Shield, ArrowLeft,  CheckCircle2, XCircle, Edit } from 'lucide-react';
import { accessService } from "~/services/access.service.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import invariant from "tiny-invariant";
import { AccessActions, AccessPermission, permissionCategories } from "~/core/entities/utils/access-permission";
import { ErrorComponent } from "~/components/val/error-component";
import { authService } from "~/services/auth.service.server";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: AccessActions.View});
  invariant(params.id, "Missing access ID parameter");

  try {
    const access = await accessService.readOne({ id: params.id, populate: 'createdBy,updatedBy' });
    if (!access) {
      throw Response.json({ message: "Accès non trouvé" }, { status: 404 });
    }

    const can = {
      edit: await authService.can(currentLoggedUser?.id as string, AccessActions.Edit),
      list: await authService.can(currentLoggedUser?.id as string, AccessActions.List),
    }

    return Response.json({ access, can });
  } catch (error) {
    console.error("Error fetching access:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération de l'accès." }, { status: 500 });
  }
};

export default function AccessDetails() {
  const { access, can } = useLoaderData<typeof loader>();
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const navigate = useNavigate();

  const toggleAccordion = (category: string) => {
    setActiveAccordion(activeAccordion === category ? null : category);
  };

  return (
    <div className="w-full max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
      {can.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-4 h-10 text-sm sm:h-11 sm:text-base"
      >
        <Link prefetch="intent" to="/o/access">
          <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-slate-900 dark:border-gray-700">
        <CardHeader className="p-4 sm:p-6 lg:p-8">
          <CardTitle className="text-center text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center">
            <Shield className="mr-2 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            {access.name}
          </CardTitle>
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 dark:text-white">
              Description
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {access.description || "Aucune description fournie"}
            </p>
          </div>
  
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 dark:text-white mb-3">
              Permissions
            </h2>
            <div className="hs-accordion-group">
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
                      {label}
                      <svg
                        className={`${activeAccordion === category ? 'rotate-180' : ''} ml-auto h-4 w-4 sm:h-5 sm:w-5 transition-transform`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      id={`accordion-${category}`}
                      className={`hs-accordion-content w-full overflow-hidden transition-[height] duration-300 ${
                        activeAccordion === category ? "" : "hidden"
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        <ul className="space-y-3">
                          {Object.entries(actions).map(
                            ([action, actionLabel]) => (
                              <li key={action} className="flex items-center">
                                {access.permissions[category as keyof AccessPermission]?.includes(action) ? (
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary border-primary-foreground" />
                                ) : (
                                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-red-500" />
                                )}
                                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                  {actionLabel}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
  
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                Créé le
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {new Date(access.createdAt).toLocaleString()} Par {access.createdBy?.firstName} {access.createdBy?.lastName}
              </p>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white">
                Mis à jour le
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {new Date(access.updatedAt).toLocaleString()} {access.updatedBy ? `Par ${access.updatedBy.firstName} ${access.updatedBy.lastName}` : ''}
              </p>
            </div>
  
            {can.edit && (
            <div className="col-span-1 sm:col-span-2 flex justify-center">
              <Button 
                className="w-full sm:w-1/2 h-10 text-sm sm:h-11 sm:text-base" 
                onClick={() => navigate(`/o/access/edit/${access.id}`)}
              >
                <Edit className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> 
                Modifier
              </Button>
            </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  
}
