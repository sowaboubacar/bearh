import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { IDepartment } from '~/core/entities/department.entity.server'

interface UserDepartmentProps {
  department: IDepartment
}

export function UserDepartment({ department }: UserDepartmentProps) {
  console.log('department: ', department)
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Département
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {department && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                Nom du département
              </h3>
              <p className="text-base">
                {department.name}
              </p>
            </div>
  
            {department.description && (
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Description
                </h3>
                <p className="text-base">
                  {department.description}
                </p>
              </div>
            )}
  
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                Manager
              </h3>
              <p className="text-base">
                {department.manager ? department.manager.toString() : 'Non assigné'}
              </p>
            </div>
  
            {department.members && (
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Membres
                </h3>
                <p className="text-base">
                  {department.members.length} membre(s)
                </p>
              </div>
            )}
  
            {department.attachments && department.attachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Pièces jointes
                </h3>
                <div className="flex flex-wrap gap-3">
                  {department.attachments.map((attachment, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="text-base px-3 py-1"
                    >
                      Pièce jointe {index + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );  
}

