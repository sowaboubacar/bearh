import { LoaderFunction } from '@remix-run/node'
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowLeft, Edit, PenToolIcon as Tool, XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { patrimoineService } from '~/services/patrimoine.service.server'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { authService } from '~/services/auth.service.server'
import { AttachmentGallery } from '~/components/AttachmentGallery'
import { PatrimoineActions } from '~/core/entities/utils/access-permission'

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [PatrimoineActions.View,]}})
  try {
    const patrimoine = await patrimoineService.readOne({
      id: params.id,
      populate: 'type,assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access,attachments'
    });

    if (!patrimoine) {
      throw Response.json({ message: "Patrimoine non trouvé" }, { status: 404 });
    }

    const can = {
      list: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineActions.List,]}),
      edit: await authService.can(currentLoggedUser?.id as string, {any: [PatrimoineActions.Edit,]}),
    }
    return Response.json({ patrimoine, can });
  } catch (error) {
    console.error("Error fetching patrimoine:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération du patrimoine." }, { status: 500 });
  }
}



export default function PatrimoineDetails() {
  const { patrimoine,can } = useLoaderData<typeof loader>()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'Under Maintenance':
        return <Tool className="h-6 w-6 text-yellow-500" />
      case 'Out of Service':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return null
    }
  }

  const renderAssignedToSection = (title: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-base">{title}</h4>
        <ScrollArea className="h-32 w-full">
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge 
                key={item.id} 
                variant="secondary" 
                className="h-8 text-base px-3 py-1"
              >
                {item.title || item.name || `${item.firstName} ${item.lastName}`}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-12 text-base"
      >
        <Link prefetch="intent" to="/o/patrimoine">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xl sm:text-2xl font-bold">{patrimoine.name}</span>
            <Badge 
              variant="secondary" 
              className="flex items-center h-8 text-base px-3 py-1"
            >
              {getStatusIcon(patrimoine.status)}
              <span className="ml-2">{patrimoine.status}</span>
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Type</h3>
              <p className="text-base">{patrimoine.type.name}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Date d'achat</h3>
              <p className="text-base">
                {new Date(patrimoine.purchaseDate).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Statut</h3>
              <p className="text-base">{patrimoine.status}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Date de création</h3>
              <p className="text-base">
                {new Date(patrimoine.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold">Dernière mise à jour</h3>
              <p className="text-base">
                {new Date(patrimoine.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Assigné à</h3>
            <Card className="bg-muted">
              <CardContent className="p-4 sm:p-6 space-y-6">
                {renderAssignedToSection("Utilisateurs", patrimoine.assignedTo.users)}
                {renderAssignedToSection("Postes", patrimoine.assignedTo.positions)}
                {renderAssignedToSection("Équipes", patrimoine.assignedTo.teams)}
                {renderAssignedToSection("Départements", patrimoine.assignedTo.departments)}
                {renderAssignedToSection("Groupes Horaires", patrimoine.assignedTo.hourGroups)}
                {renderAssignedToSection("Groupes d'Accès", patrimoine.assignedTo.access)}
              </CardContent>
            </Card>
          </div>
          
          {patrimoine.attachments && patrimoine.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={patrimoine.attachments} />
            </div>
          )}
        </CardContent>

        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
          <Button 
            asChild
            className="w-full sm:w-auto h-12 text-base"
          >
            <Link prefetch="intent" to={`/o/patrimoine/edit/${patrimoine.id}`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier l&apos;actif
            </Link>
          </Button>
        </CardFooter>
        )}
      </Card>
    </div>
  )
}

