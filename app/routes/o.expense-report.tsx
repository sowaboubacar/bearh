import { useState } from 'react'
import { LoaderFunction, ActionFunction } from '@remix-run/node'
import { useLoaderData, useSubmit, Form, useFetcher, useSearchParams, useNavigation, Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Grid, List, Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { expenseReportService } from '~/services/expenseReport.service.server'
import NoDataMessage from "~/components/val/no-data-message"
import LoadingSkeleton from "~/components/val/loading-skeleton"
import { authService } from '~/services/auth.service.server'
import { ExpenseReportActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [ExpenseReportActions.List, ExpenseReportActions.ListOwn] }
  });

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const view = (url.searchParams.get("view") as "grid" | "list") || "grid";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  try {
    // Create base query
    let query: any = {
      $or: [
        { description: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ],
    };

    // If user only has ListOwn permission, filter for their reports
    const hasFullListAccess = await authService.can(currentLoggedUser.id, ExpenseReportActions.List);
    if (!hasFullListAccess) {
      query = {
        $and: [
          query,
          {
            $or: [
              { user: currentLoggedUser.id },
              { approver: currentLoggedUser.id }
            ]
          }
        ]
      };
    }

    const reports = await expenseReportService.readManyPaginated(
      query,
      {
        limit,
        page,
        sortBy: "createdAt:desc",
        populate: "user,approver,attachments"
      }
    );

    const can = {
      create: await authService.can(currentLoggedUser.id, ExpenseReportActions.Create),
      edit: await authService.can(currentLoggedUser.id, { any: [ExpenseReportActions.Edit, ExpenseReportActions.EditOwn] }),
      delete: await authService.can(currentLoggedUser.id, { any: [ExpenseReportActions.Delete, ExpenseReportActions.DeleteOwn] }),
      view: await authService.can(currentLoggedUser.id, { any: [ExpenseReportActions.View, ExpenseReportActions.ViewOwn] }),
      approve: await authService.can(currentLoggedUser.id, ExpenseReportActions.Approve)
    };

    return Response.json({ reports, search, view, page, limit, can });
  } catch (error) {
    console.error("Error fetching expense reports:", error);
    throw Response.json({ message: "Une erreur s'est produite lors de la récupération des notes de frais." }, { status: 500 });
  }
};

export const action: ActionFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {
    condition: { any: [ExpenseReportActions.Delete] },
  });
  const formData = await request.formData()
  const id = formData.get('id') as string
  const action = formData.get('action') as string

  try {
    if (action === 'delete') {
      await expenseReportService.deleteOne(id)
    } else if (action === 'approve' || action === 'reject') {
      await expenseReportService.updateOne(id, { 
        approver: currentUser.id,
        status: action === 'approve' ? 'Approved' : 'Rejected' })
    }
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error processing expense report action:", error)
    throw Response.json({ message: "Une erreur est survenue lors du traitement de l'action sur la note de frais." }, { status: 500 })
  }
}

export default function ExpenseReportList() {
  const { reports, search, view: initialView, page, limit,can } = useLoaderData<typeof loader>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const submit = useSubmit()
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

  const view = searchParams.get('view') as 'grid' | 'list' || initialView

  const handleAction = (id: string, action: 'delete' | 'approve' | 'reject') => {
    setIsProcessing(true)
    fetcher.submit({ id, action }, { method: 'post' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const searchTerm = formData.get('search') as string
    setSearchParams({ search: searchTerm, view })
  }

  const handleViewChange = (newView: 'grid' | 'list') => {
    setSearchParams({ search, view: newView })
  }



  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Notes de frais
        </h1>
        {can?.create && (
           <Button 
          asChild 
          className="w-full sm:w-auto h-11 text-base"
        >
          <Link prefetch="intent" to="/o/expense-report/new">
            <Plus className="mr-2 h-5 w-5" /> 
            Nouvelle note de frais
          </Link>
        </Button>
        )}
       
      </div>
  
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Form 
          onSubmit={handleSearch} 
          className="flex w-full sm:w-auto items-center gap-2"
        >
          <Input
            type="search"
            name="search"
            placeholder="Rechercher des notes de frais..."
            defaultValue={search}
            className="h-11 text-base w-full sm:w-[300px]"
          />
          <Button 
            type="submit"
            className="h-11 w-11"
          >
            <Search className="h-5 w-5" />
          </Button>
        </Form>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            onClick={() => handleViewChange('grid')}
            className="flex-1 sm:flex-none h-11 w-11"
          >
            <Grid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => handleViewChange('list')}
            className="flex-1 sm:flex-none h-11 w-11"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={limit} />
      ) : reports.results.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reports.results.map((report) => (
              <Card key={report.id}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Note de frais du {formatDate(report.submissionDate)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                  <p className="text-base text-muted-foreground">
                    Montant total : {formatAmount(report.totalAmount)}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Statut : {report.status}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Pièces Jointes : {report.attachments.length}
                  </p>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 flex justify-between gap-2">
                  {can?.view && (
                        <Button 
                    asChild 
                    variant="outline"
                    className="h-11 w-11"
                  >
                    <Link prefetch="intent" to={`/o/expense-report/view/${report.id}`}>
                      <Eye className="h-5 w-5" />
                    </Link>
                  </Button>
                  )}
              {can?.edit && (
                <Button 
                    asChild 
                    variant="outline"
                    className="h-11 w-11"
                  >
                    <Link prefetch="intent" to={`/o/expense-report/edit/${report.id}`}>
                      <Edit className="h-5 w-5" />
                    </Link>
                  </Button>
              )}
                  {can?.delete && (
                     <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        className="h-11 w-11"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">
                          Êtes-vous sûr de vouloir supprimer cette note de frais ?
                        </DialogTitle>
                        <DialogDescription className="text-base">
                          Cette action ne peut pas être annulée.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-3">
                        <DialogClose asChild>
                          <Button 
                            variant="outline"
                            className="h-11 text-base"
                          >
                            Annuler
                          </Button>
                        </DialogClose>
                        <Button
                          variant="destructive"
                          onClick={() => handleAction(report.id, 'delete')}
                          disabled={isProcessing}
                          className="h-11 text-base"
                        >
                          {isProcessing ? 'Suppression...' : 'Supprimer'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}
                 
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">Date de soumission</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Montant total</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Pièces Jointes</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.results.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-base">
                      {formatDate(report.submissionDate)}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {formatAmount(report.totalAmount)}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {report.status}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {report.attachments.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.view && (
                          <Button 
                          asChild 
                          variant="outline"
                          className="h-11 w-11"
                        >
                          <Link prefetch="intent" to={`/o/expense-report/view/${report.id}`}>
                            <Eye className="h-5 w-5" />
                          </Link>
                        </Button>
                        )}
                        {can?.edit && (
                          <Button 
                          asChild 
                          variant="outline"
                          className="h-11 w-11"
                        >
                          <Link prefetch="intent" to={`/o/expense-report/edit/${report.id}`}>
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                        )}
                        {can?.delete && (
                              <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              className="h-11 w-11"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl">
                                Êtes-vous sûr de vouloir supprimer cette note de frais ?
                              </DialogTitle>
                              <DialogDescription className="text-base">
                                Cette action ne peut pas être annulée.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-3">
                              <DialogClose asChild>
                                <Button 
                                  variant="outline"
                                  className="h-11 text-base"
                                >
                                  Annuler
                                </Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => handleAction(report.id, 'delete')}
                                disabled={isProcessing}
                                className="h-11 text-base"
                              >
                                {isProcessing ? 'Suppression...' : 'Supprimer'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        )}
                    
                        {report.status === 'Pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={() => handleAction(report.id, 'approve')}
                              className="h-11 w-11"
                            >
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => handleAction(report.id, 'reject')}
                              className="h-11 w-11"
                            >
                              <XCircle className="h-5 w-5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <NoDataMessage
          type="notes de frais"
          createLink="/o/expense-report/new"
          view={view}
        />
      )}
  
      {reports.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setSearchParams({ search, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-11 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(reports.totalResults / limit)}
          </span>
          <Button
            onClick={() => setSearchParams({ search, view, page: (page + 1).toString() })}
            disabled={page * limit >= reports.totalResults}
            className="w-full sm:w-auto h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}
