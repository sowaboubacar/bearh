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
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeft, Edit, Calendar, AlertTriangle } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { permissionAndLeaveService } from "~/services/permissionAndLeave.service.server";
import { authService } from "~/services/auth.service.server";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { PermissionsActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [PermissionsActions.View, PermissionsActions.ViewOwn] }
  });

  try {
    const permissionAndLeave = await permissionAndLeaveService.readOne({
      id: params.id,
      populate: "user,approver,attachments",
    });

    if (!permissionAndLeave) {
      throw Response.json(
        { message: "Demande de permission ou congé non trouvée" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this specific request
    const hasFullViewAccess = await authService.can(currentUser.id, PermissionsActions.View);
    const canViewOwn = await authService.can(currentUser.id, PermissionsActions.ViewOwn, {
      resourceOwnerId: permissionAndLeave.user.toString(),
      targetUserId: currentUser.id
    });

    if (!hasFullViewAccess && !canViewOwn) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      edit: await authService.can(currentUser.id, {
        any: [PermissionsActions.Edit, PermissionsActions.EditOwn]
      }, {
        resourceOwnerId: permissionAndLeave.user.toString(),
        targetUserId: currentUser.id
      })
    };

    return Response.json({ permissionAndLeave, can });
  } catch (error) {
    console.error("Error fetching permission and leave:", error);
    throw Response.json(
      { message: "Une erreur s'est produite lors de la récupération de la demande" },
      { status: 500 }
    );
  }
};

export default function PermissionAndLeaveDetails() {
  const { permissionAndLeave, can } = useLoaderData<typeof loader>();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline">En attente</Badge>;
      case "Approved":
        return <Badge variant="secondary">Approuvé</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Button asChild variant="outline" className="mb-6 h-12 text-base">
        <Link prefetch="intent" to="/o/permission-and-leave">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center text-2xl sm:text-3xl">
            <Calendar className="mr-3 h-7 w-7" />
            Détails de la Demande de Permission ou Congé
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Employé</h3>
            <p className="text-base">
              {permissionAndLeave.user.firstName}{" "}
              {permissionAndLeave.user.lastName}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Type</h3>
            <p className="text-base">
              {permissionAndLeave.type === "Permission"
                ? "Permission"
                : "Congé"}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Date de début</h3>
            <p className="text-base">
              {new Date(permissionAndLeave.startDate).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Date de fin</h3>
            <p className="text-base">
              {new Date(permissionAndLeave.endDate).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Raison</h3>
            <p className="text-base whitespace-pre-wrap">
              {permissionAndLeave.reason}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Statut</h3>
            <div className="text-base">
              {getStatusBadge(permissionAndLeave.status)}
            </div>
          </div>

          {permissionAndLeave.approver && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Approbateur</h3>
              <p className="text-base">
                {permissionAndLeave.approver.firstName}{" "}
                {permissionAndLeave.approver.lastName}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Date de création</h3>
            <p className="text-base">
              {new Date(permissionAndLeave.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Dernière mise à jour</h3>
            <p className="text-base">
              {new Date(permissionAndLeave.updatedAt).toLocaleString()}
            </p>
          </div>

          {permissionAndLeave.attachments &&
            permissionAndLeave.attachments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Pièces jointes
                </h3>
                <AttachmentGallery
                  attachments={permissionAndLeave.attachments}
                />
              </div>
            )}
        </CardContent>

        <CardFooter className="p-4 sm:p-6">
          {can?.edit && (
            <Button asChild className="w-full sm:w-auto h-12 text-base">
              <Link
                prefetch="intent"
                to={`/o/permission-and-leave/edit/${permissionAndLeave.id}`}
              >
                <Edit className="mr-2 h-5 w-5" />
                Modifier la demande
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
