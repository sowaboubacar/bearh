/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunction } from '@remix-run/node'
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Edit, ArrowLeft, AlertTriangle } from 'lucide-react'
import { kpiFormService } from '~/services/kpiForm.service.server'
import { authService } from '~/services/auth.service.server'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Badge } from '~/components/ui/badge'
import { KpiFormActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ params , request}) => {
  const currentLoggedUser= await authService.requireUser(request, {condition: {any: [KpiFormActions.List]}});

  try {
    const kpiForm = await kpiFormService.readOne({
      id: params.id,
      populate: 'applicableTo.users,applicableTo.positions'
    });

    if (!kpiForm) {
      throw Response.json({ message: "Formulaire KPI non trouvé" }, { status: 404 });
    }
    const can = {
      edit: await authService.can(currentLoggedUser?.id as string, KpiFormActions.Edit ),
      list: await authService.can(currentLoggedUser?.id as string, KpiFormActions.List ),
    }

    return Response.json({ kpiForm, can });
  } catch (error) {
    console.error("Error fetching KPI form:", error);
    throw Response.json({ message: "Une erreur inattendue s'est produite lors de la récupération du formulaire KPI." }, { status: 500 });
  }
}

export default function KpiFormDetails() {
  const { kpiForm, can } = useLoaderData<typeof loader>()

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/kpi-form">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
      </Button>
      )}
  
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {kpiForm.title}
          </CardTitle>
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-6">
          {kpiForm.description && (
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                Description
              </h3>
              <p className="text-base">
                {kpiForm.description}
              </p>
            </div>
          )}
  
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">
              Critères
            </h3>
            
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base whitespace-nowrap">
                      Nom
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap text-center">
                      Note maximale
                    </TableHead>
                    <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                      Description
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiForm.criteria.map((criterion, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-base font-medium">
                        {criterion.name}
                      </TableCell>
                      <TableCell className="text-base text-center">
                        {criterion.maxScore}
                      </TableCell>
                      <TableCell className="text-base hidden sm:table-cell">
                        {criterion.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
  
            {/* Mobile view for descriptions */}
            <div className="sm:hidden space-y-4">
              {kpiForm.criteria.map((criterion, index) => (
                criterion.description && (
                  <div key={`desc-${index}`} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-base mb-2">
                      {criterion.name} - Description
                    </h4>
                    <p className="text-base text-muted-foreground">
                      {criterion.description}
                    </p>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold">Appliqué à</h3>
            <Card className="bg-muted">
              <CardContent className="p-4 sm:p-6 space-y-6">
                {renderAssignedToSection("Employé(s)", kpiForm.applicableTo.users)}
                {renderAssignedToSection("Fiches de Poste", kpiForm.applicableTo.positions)}
              </CardContent>
            </Card>
          </div>
          
        </CardContent>
        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
         
            <Button 
            asChild
            className="w-full sm:w-auto h-11 text-base"
          >
            <Link prefetch="intent" to={`/o/kpi-form/edit/${kpiForm.id}`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier le formulaire KPI
            </Link>
          </Button>
          
        </CardFooter>
                  )}

      </Card>
    </div>
  );  
}
