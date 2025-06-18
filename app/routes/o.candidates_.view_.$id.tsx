import { type LoaderFunction } from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { candidateService } from "~/services/candidate.service.server";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { authService } from "~/services/auth.service.server";
import { CandidateActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser =  await authService.requireUser(request, {condition: {any: [CandidateActions.List]}}); 


  
  try {
    const candidate = await candidateService.readOne({
      id: params.id,
      populate: "attachments",
    });

    if (!candidate) {
      throw Response.json({ message: "Candidat non trouvé" }, { status: 404 });
    }
    const can = {
      edit: await authService.can(currentLoggedUser?.id as string, CandidateActions.Edit),
      delete: await authService.can(currentLoggedUser?.id as string, CandidateActions.Delete),
      list: await authService.can(currentLoggedUser?.id as string, CandidateActions.List),
    }

    return Response.json({ candidate, can });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération du candidat.",
      },
      { status: 500 }
    );
  }
};

export default function CandidateDetailPage() {
  const { candidate, can } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleDelete = () => {
    fetcher.submit(
      { id: candidate.id },
      { method: "delete", action: "/o/candidates" }
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      {can?.list && (
      <Button asChild variant="outline" className="mb-6 h-11 text-base">
        <Link prefetch="intent" to="/o/candidates">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {candidate.firstName} {candidate.lastName}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <span className="text-base sm:text-lg">{candidate.email}</span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <span className="text-base sm:text-lg">{candidate.phone}</span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <span className="text-base sm:text-lg">
              Poste demandé: {candidate.positionApplied}
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <span className="text-base sm:text-lg">
              Date de candidature:{" "}
              {new Date(candidate.applicationDate).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            <span className="text-base sm:text-lg">
              Statut: {candidate.status}
            </span>
          </div>

          {candidate.notes && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-3">Notes</h3>
              <p className="text-base sm:text-lg text-muted-foreground">
                {candidate.notes}
              </p>
            </div>
          )}

          {candidate.attachments && candidate.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={candidate.attachments} />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 sm:p-6 flex justify-end space-x-3 sm:space-x-4">

          {can?.edit && (
            <Button
            variant="outline"
            asChild
            className="h-11 w-11 sm:h-12 sm:w-12"
          >
            <Link prefetch="intent" to={`/o/candidates/edit/${candidate.id}`}>
              <Edit className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
          </Button>
          )}
          
          {can?.delete && (
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="h-11 sm:h-12 text-base">
                <Trash2 className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="p-4 sm:p-6 max-w-[90vw] sm:max-w-[425px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg sm:text-xl">
                  Êtes-vous sûr de vouloir supprimer ce candidat ?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base">
                  Cette action ne peut pas être annulée. Cela supprimera
                  définitivement le candidat et toutes les données associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 sm:gap-4">
                <AlertDialogCancel className="h-11 text-base">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="h-11 text-base"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
          
        </CardFooter>
      </Card>
    </div>
  );
}
