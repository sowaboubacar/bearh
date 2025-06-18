import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import type { INote } from '~/core/entities/note.entity.server'

interface UserNotesProps {
  notes: INote[]
}

export function UserNotes({ notes }: UserNotesProps) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {notes && notes?.map((note) => (
            <Card key={note.id} className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold">
                    {note.title}
                  </h3>
                  <Badge 
                    variant={
                      note.visibility === 'Private' ? 'secondary' :
                      note.visibility === 'Public' ? 'default' :
                      'outline'
                    }
                    className="w-fit text-base px-3 py-1"
                  >
                    {note.visibility}
                  </Badge>
                </div>
                
                <p className="text-base leading-relaxed mb-4">
                  {note.content}
                </p>
                
                <p className="text-base text-muted-foreground">
                  Auteur: {note.author.toString()}
                </p>
                
                {note.visibility === 'Shared' && note.sharedWith && (
                  <div className="mt-4 sm:mt-6">
                    <p className="text-base font-semibold mb-2">
                      Partagé avec:
                    </p>
                    <ul className="text-base space-y-2 list-disc list-inside">
                      {note.sharedWith.users.length > 0 && (
                        <li>{note.sharedWith.users.length} utilisateur(s)</li>
                      )}
                      {note.sharedWith.positions.length > 0 && (
                        <li>{note.sharedWith.positions.length} poste(s)</li>
                      )}
                      {note.sharedWith.teams.length > 0 && (
                        <li>{note.sharedWith.teams.length} équipe(s)</li>
                      )}
                      {note.sharedWith.departments.length > 0 && (
                        <li>{note.sharedWith.departments.length} département(s)</li>
                      )}
                      {note.sharedWith.hourGroups.length > 0 && (
                        <li>{note.sharedWith.hourGroups.length} groupe(s) horaire</li>
                      )}
                      {note.sharedWith.access.length > 0 && (
                        <li>{note.sharedWith.access.length} accès</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )  
}

