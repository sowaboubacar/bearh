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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Edit,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { authService } from "~/services/auth.service.server";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { AttachmentGallery } from "~/components/AttachmentGallery";
import { HourGroupActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [HourGroupActions.View]}})

  try {
    const hourGroup = await hourGroupService.readOne({
      id: params.id,
      populate: "members,attachments",
    });

    if (!hourGroup) {
      throw Response.json(
        { message: "Groupe d'heures non trouvé" },
        { status: 404 }
      );
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [HourGroupActions.List]}),
      edit: await authService.can(currentLoggedUser?.id as string, {any: [HourGroupActions.Edit]}),
    }
    return Response.json({ hourGroup, can });
  } catch (error) {
    console.error("Error fetching hour group:", error);
    throw Response.json(
      {
        message:
          "Une erreur inattendue s'est produite lors de la récupération du programmes.",
      },
      { status: 500 }
    );
  }
};

export default function HourGroupDetails() {
  const { hourGroup, can } = useLoaderData<typeof loader>();

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd MMMM yyyy", { locale: fr });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // Assuming the time is in HH:mm format
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/hour-group">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center text-xl sm:text-2xl lg:text-3xl">
            <Clock className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
            Détails du Programmes
          </CardTitle>
        </CardHeader>
  
        <CardContent className="p-0">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start overflow-auto p-0 sm:p-1">
              <TabsTrigger value="details" className="text-base">Détails</TabsTrigger>
              <TabsTrigger value="schedule" className="text-base">Horaires</TabsTrigger>
              <TabsTrigger value="members" className="text-base">Membres</TabsTrigger>
              <TabsTrigger value="attachments" className="text-base">Pièce Jointes</TabsTrigger>
            </TabsList>
  
            <TabsContent value="details" className="p-4 sm:p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Note</h3>
                  <p className="text-base">{hourGroup.note || "Aucune note"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Période</h3>
                  <p className="text-base">
                    Du {formatDate(hourGroup.startAt)} au{" "}
                    {formatDate(hourGroup.endAt)}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Pause par défaut</h3>
                  <p className="text-base">
                    {formatTime(hourGroup.restShouldStartAt)} -{" "}
                    {formatTime(hourGroup.restShouldEndAt)}
                  </p>
                </div>
              </div>
            </TabsContent>
  
            <TabsContent value="schedule" className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base whitespace-nowrap">Date</TableHead>
                      <TableHead className="text-base whitespace-nowrap">Début</TableHead>
                      <TableHead className="text-base whitespace-nowrap">Fin</TableHead>
                      <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Début pause</TableHead>
                      <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Fin pause</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hourGroup.workTimes.map((wt, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-base">{formatDate(wt.date)}</TableCell>
                        <TableCell className="text-base">{formatTime(wt.startAt)}</TableCell>
                        <TableCell className="text-base">{formatTime(wt.endAt)}</TableCell>
                        <TableCell className="text-base hidden sm:table-cell">
                          {wt.restShouldStartAt
                            ? formatTime(wt.restShouldStartAt)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-base hidden sm:table-cell">
                          {wt.restShouldEndAt
                            ? formatTime(wt.restShouldEndAt)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
  
            <TabsContent value="members" className="p-4 sm:p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Membres</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hourGroup.members?.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center p-3 rounded-lg border bg-card"
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage
                          src={member.avatar}
                          alt={`${member.firstName} ${member.lastName}`}
                        />
                        <AvatarFallback className="text-base">
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-base">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
  
            <TabsContent value="attachments" className="p-4 sm:p-6">
              {hourGroup.attachments && hourGroup.attachments.length > 0 && (
                <AttachmentGallery attachments={hourGroup.attachments} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
  
        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
          <Button 
            asChild
            className="w-full sm:w-auto h-11 text-base"
          >
            <Link prefetch="intent" to={`/o/hour-group/edit/${hourGroup.id}/`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier le programmes
            </Link>
          </Button>
        </CardFooter>
        )}
      </Card>
    </div>
  );  
}

