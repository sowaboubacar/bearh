import { useState } from 'react'
import { LoaderFunction, ActionFunction } from '@remix-run/node'
import { useLoaderData, useSubmit, Form, useFetcher, useSearchParams, useNavigation, Link } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { Grid, List, Search, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { hourGroupService } from '~/services/hourGroup.service.server'
import NoDataMessage from "~/components/val/no-data-message"
import LoadingSkeleton from "~/components/val/loading-skeleton"
import { authService } from '~/services/auth.service.server'
import { getFirstImage } from '~/core/utils/media/attachments'
 import { HourGroupActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
    const currentLoggedUser = await authService.requireUser(request, {condition: {any: [HourGroupActions.List]}})
  const url = new URL(request.url)
  const search = url.searchParams.get('search') || ''
  const view = url.searchParams.get('view') as 'grid' | 'list' || 'grid'
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = 12

  try {
    const hourGroups = await hourGroupService.readManyPaginated(
      { note: { $regex: search, $options: 'i' } },
      { 
        limit, 
        page, 
        sortBy: 'startAt:desc',
        select: 'note startAt endAt restShouldStartAt restShouldEndAt name',
        populate: 'members,attachments'
      }
    )
      

    const can = {
      create: await authService.can(currentLoggedUser?.id as string, HourGroupActions.Create ),
      delete: await authService.can(currentLoggedUser?.id as string, HourGroupActions.Delete ),
      edit: await authService.can(currentLoggedUser?.id as string, HourGroupActions.Edit ),
      view: await authService.can(currentLoggedUser?.id as string, {any:[HourGroupActions.View, HourGroupActions.ViewOwn] }  ),
    }

    return Response.json({ hourGroups, search, view, page, limit,can })
  } catch (error) {
    console.error("Error fetching hour groups:", error)
    throw Response.json({ message: "Une erreur est survenue lors de la récupération des groupes d'heures." }, { status: 500 })
  }
}

export const action: ActionFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [HourGroupActions.Delete] },
  });
  const formData = await request.formData()
  const id = formData.get('id') as string
  const action = formData.get('action') as string

  try {
    if (action === 'delete') {
      await hourGroupService.deleteOne(id)
    }
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error processing hour group action:", error)
    throw Response.json({ message: "Une erreur est survenue lors du traitement de l'action sur le programmes." }, { status: 500 })
  }
}

export default function HourGroupList() {
  const { hourGroups, search, view: initialView, page, limit,can } = useLoaderData<typeof loader>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const submit = useSubmit()
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  const view = searchParams.get('view') as 'grid' | 'list' || initialView

  const handleDelete = (id: string) => {
    setIsProcessing(true)
    fetcher.submit({ id, action: 'delete' }, { method: 'post' })
    setOpenDialog(null)
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
          Programme
        </h1>
        {can?.create && (
            <Button 
          asChild 
          className="w-full sm:w-auto h-11 text-base"
        >
          <Link prefetch="intent" to="/o/hour-group/new">
            <Plus className="mr-2 h-5 w-5" /> 
            Nouveau Programmes
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
            placeholder="Rechercher des groupes d'heures..."
            defaultValue={search}
            className="h-11 text-base"
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
            className="flex-1 sm:flex-none h-11"
          >
            <Grid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => handleViewChange('list')}
            className="flex-1 sm:flex-none h-11"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
  
      {isLoading ? (
        <LoadingSkeleton view={view} itemCount={limit} />
      ) : hourGroups.results.length > 0 ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {hourGroups.results.map((hourGroup) => (
              <Card key={hourGroup.id} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl">
                    {hourGroup.name || ''}
                    {hourGroup.attachments.length > 0 && (
                      <img 
                        src={getFirstImage(hourGroup.attachments)?.file?.url} 
                        alt={getFirstImage(hourGroup.attachments)?.label || ''} 
                        className="w-full h-40 object-cover rounded-md mt-2" 
                      />
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {hourGroup.note || 'Aucune note'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <p className="text-base text-muted-foreground">
                    Période : {new Date(hourGroup.startAt).toLocaleString()} - {new Date(hourGroup.endAt).toLocaleString()}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Pause : {hourGroup.restShouldStartAt.slice(0, 5)} - {hourGroup.restShouldEndAt.slice(0, 5)}
                  </p>
                  <p className="text-base text-muted-foreground">
                    Membre(s): {hourGroup.members?.length}
                  </p>
                </CardContent>
  
                <CardFooter className="mt-auto pt-4">
                  <div className="flex justify-between w-full gap-2">
                    {can?.view && (
                        <Button asChild variant="outline" className="flex-1 h-11">
                      <Link prefetch="intent" to={`/o/hour-group/view/${hourGroup.id}`}>
                        <Eye className="mr-2 h-5 w-5" />
                        
                      </Link>
                    </Button>
                    )}
                  {can?.edit && (
                     <Button asChild variant="outline" className="flex-1 h-11">
                      <Link prefetch="intent" to={`/o/hour-group/edit/${hourGroup.id}`}>
                        <Edit className="mr-2 h-5 w-5" />
                        
                      </Link>
                    </Button>
                  )}
                   
                   {can?.delete && (
                     <Dialog 
                      open={openDialog === hourGroup.id} 
                      onOpenChange={(open) => setOpenDialog(open ? hourGroup.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="h-11 w-11">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">
                            Êtes-vous sûr de vouloir supprimer ce programmes ?
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
                            onClick={() => handleDelete(hourGroup.id)}
                            disabled={isProcessing}
                            className="h-11 text-base"
                          >
                            {isProcessing ? "Suppression..." : "Supprimer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                   )}
                   
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">Programme</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Note</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Pièces jointes</TableHead>
                  <TableHead className="text-base whitespace-nowrap">Membres</TableHead>
                  <TableHead className="text-base whitespace-nowrap">Début</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">Fin</TableHead>
                  <TableHead className="text-base whitespace-nowrap hidden md:table-cell">Pause</TableHead>
                  <TableHead className="text-base text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourGroups.results.map((hourGroup) => (
                  <TableRow key={hourGroup.id}>
                    <TableCell className="font-medium text-base">
                      {hourGroup.name || 'Aucune note'}
                    </TableCell>
                    <TableCell className="text-base hidden md:table-cell">
                      {hourGroup.note || 'Aucune note'}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {hourGroup.attachments?.length}
                    </TableCell>
                    <TableCell className="text-base">
                      {hourGroup.members?.length}
                    </TableCell>
                    <TableCell className="text-base">
                      {new Date(hourGroup.startAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-base hidden sm:table-cell">
                      {new Date(hourGroup.endAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-base hidden md:table-cell">
                      {hourGroup.restShouldStartAt.slice(0, 5)} - {hourGroup.restShouldEndAt.slice(0, 5)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {can?.view && (
                              <Button 
                          asChild 
                          variant="outline"
                          className="h-11 w-11"
                        >
                          <Link prefetch="intent" to={`/o/hour-group/view/${hourGroup.id}`}>
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
                          <Link prefetch="intent" to={`/o/hour-group/edit/${hourGroup.id}/`}>
                            <Edit className="h-5 w-5" />
                          </Link>
                        </Button>
                      )}
                       {can?.delete && (
                          <Dialog 
                          open={openDialog === hourGroup.id} 
                          onOpenChange={(open) => setOpenDialog(open ? hourGroup.id : null)}
                        >
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
                                Êtes-vous sûr de vouloir supprimer ce programmes ?
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
                                onClick={() => handleDelete(hourGroup.id)}
                                disabled={isProcessing}
                                className="h-11 text-base"
                              >
                                {isProcessing ? "Suppression..." : "Supprimer"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
          type="groupes d'heures" 
          createLink="/o/hour-group/new" 
          view={view} 
        />
      )}
  
      {hourGroups.totalResults > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={() => setSearchParams({ search, view, page: (page - 1).toString() })}
            disabled={page === 1}
            className="w-full sm:w-auto h-11 text-base"
          >
            Précédent
          </Button>
          <span className="text-base">
            Page {page} sur {Math.ceil(hourGroups.totalResults / limit)}
          </span>
          <Button
            onClick={() => setSearchParams({ search, view, page: (page + 1).toString() })}
            disabled={page * limit >= hourGroups.totalResults}
            className="w-full sm:w-auto h-11 text-base"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );  
}

