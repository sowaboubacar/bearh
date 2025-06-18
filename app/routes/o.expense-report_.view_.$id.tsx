import { LoaderFunction } from '@remix-run/node'
import { useLoaderData, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Edit, ArrowLeft, AlertTriangle } from 'lucide-react'
import { expenseReportService } from '~/services/expenseReport.service.server'
import { authService } from '~/services/auth.service.server'
import { AttachmentGallery } from '~/components/AttachmentGallery'
import { ExpenseReportActions } from '~/core/entities/utils/access-permission'

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [ExpenseReportActions.View, ExpenseReportActions.ViewOwn] }
  });

  try {
    const report = await expenseReportService.readOne({
      id: params.id,
      populate: 'user,approver,attachments'
    });

    if (!report) {
      throw Response.json({ message: "Note de frais non trouvée" }, { status: 404 });
    }

    // Check if user has permission to view this specific report
    const hasFullViewAccess = await authService.can(currentLoggedUser.id, ExpenseReportActions.View);
    const isOwner = report.user.id === currentLoggedUser.id || 
                    report.approver?.id === currentLoggedUser.id;

    if (!hasFullViewAccess && !isOwner) {
      throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
    }

    const can = {
      list: await authService.can(currentLoggedUser.id, { any: [ExpenseReportActions.List, ExpenseReportActions.ListOwn] }),
      edit: await authService.can(currentLoggedUser.id, { any: [ExpenseReportActions.Edit, ExpenseReportActions.EditOwn] }, {
        resourceOwnerId: report.user.id.toString(),
        targetUserId: currentLoggedUser.id
      }),
      approve: await authService.can(currentLoggedUser.id, ExpenseReportActions.Approve)
    };

    return Response.json({ report, can });
  } catch (error) {
    console.error("Error fetching expense report:", error);
    throw Response.json({ message: "Une erreur s'est produite lors de la récupération de la note de frais." }, { status: 500 });
  }
};

export default function ExpenseReportDetails() {
  const { report, can } = useLoaderData<typeof loader>()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">

      {can?.list && (
      <Button 
        asChild 
        variant="outline" 
        className="mb-6 h-11 text-base"
      >
        <Link prefetch="intent" to="/o/expense-report">
          <ArrowLeft className="mr-2 h-5 w-5" /> 
          Retour à la liste
        </Link>
        </Button>
      )}
  
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Détails de la note de frais
          </CardTitle>
        </CardHeader>
  
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Utilisateur</h3>
            <p className="text-base">
              {report.user.firstName} {report.user.lastName}
            </p>
          </div>
  
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Date de soumission</h3>
            <p className="text-base">
              {formatDate(report.submissionDate)}
            </p>
          </div>
  
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Statut</h3>
            <p className="text-base">
              {report.status}
            </p>
          </div>
  
          {report.approver && (
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">Approuvé par</h3>
              <p className="text-base">
                {report.approver.firstName} {report.approver.lastName}
              </p>
            </div>
          )}
  
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold">Éléments de dépense</h3>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">Description</TableHead>
                    <TableHead className="text-base text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-base">
                        {item.description}
                      </TableCell>
                      <TableCell className="text-base text-right">
                        {formatAmount(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
  
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-semibold">Montant total</h3>
            <p className="text-base font-medium">
              {formatAmount(report.totalAmount)}
            </p>
          </div>
  
          {report.attachments && report.attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold">
                Pièces jointes
              </h3>
              <AttachmentGallery attachments={report.attachments} />
            </div>
          )}
        </CardContent>
  
        {can?.edit && (
        <CardFooter className="p-4 sm:p-6">
          <Button 
            asChild
            className="h-11 text-base"
          >
            <Link prefetch="intent" to={`/o/expense-report/edit/${report.id}`}>
              <Edit className="mr-2 h-5 w-5" /> 
              Modifier la note de frais
            </Link>
          </Button>
        </CardFooter>
        )}
      </Card>
    </div>
  );  
}
