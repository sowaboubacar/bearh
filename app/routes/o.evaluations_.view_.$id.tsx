/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  Link,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { authService } from "~/services/auth.service.server";
import { kpiValueService } from "~/services/kpiValue.service.server";
import { KpiValueActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [KpiValueActions.View, KpiValueActions.ViewOwn] }
  });

  try {
    const kpiValue = await kpiValueService.readOne({
      id: params.id,
      populate: "kpiForm,user,evaluator"
    });

    if (!kpiValue) {
      throw Response.json(
        { message: "Evaluation non trouvée" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this specific evaluation
    const hasFullViewAccess = await authService.can(currentLoggedUser.id, KpiValueActions.View);
    const isOwner = kpiValue.user.id === currentLoggedUser.id || 
                    kpiValue.evaluator.id === currentLoggedUser.id;

    if (!hasFullViewAccess && !isOwner) {
      throw Response.json(
        { message: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const can = {
      list: await authService.can(currentLoggedUser.id, { any: [KpiValueActions.List, KpiValueActions.ListOwn] }),
      edit: await authService.can(currentLoggedUser.id, { any: [KpiValueActions.Edit, KpiValueActions.EditOwn] }, {
        resourceOwnerId: kpiValue.evaluator.id.toString(),
        targetUserId: currentLoggedUser.id
      })
    };

    return Response.json({ kpiValue, can });
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération de l'évaluation." },
      { status: 500 }
    );
  }
};

export default function KpiValueDetails() {
  const { kpiValue , can} = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      {can?.list && (
      <Button asChild variant="outline" className="mb-6 h-11 text-base">
        <Link prefetch="intent" to="/o/evaluations">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {kpiValue.kpiForm?.title} - {kpiValue?.user?.firstName}{" "}
            {kpiValue?.user.lastName}
          </CardTitle>
          <CardDescription>
            Evalué par {kpiValue?.user?.firstName} {kpiValue?.user.lastName} le{" "}
            {new Date(kpiValue.createdAt).toLocaleString()}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {kpiValue.kpiForm?.description && (
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">Description</h3>
              <p className="text-base">{kpiValue.kpiForm?.description}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Critères</h3>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base whitespace-nowrap">
                      Nom
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap text-center">
                      Note Obtenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiValue.scores.map((criterion, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-base font-medium">
                        {criterion.criterionName}
                      </TableCell>
                      <TableCell className="text-base text-center">
                        {criterion.score} /{" "}
                        {kpiValue?.kpiForm?.criteria[index]?.maxScore}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-card-foreground">
          <i className="text-sm">
          Evalué par {kpiValue?.user?.firstName} {kpiValue?.user.lastName} le{" "}
          {new Date(kpiValue.createdAt).toLocaleString()}</i>
        </CardFooter>
      </Card>
    </div>
  );
}

