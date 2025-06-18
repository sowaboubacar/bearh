import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import type { IObservation } from '~/core/entities/observation.entity.server'

interface UserObservationsProps {
  observations: IObservation[]
}

export function UserObservations({ observations }: UserObservationsProps) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Observations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {observations && observations?.map((observation) => (
            <Card key={observation.id} className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-base text-muted-foreground">
                      Par {observation.author?.firstName} {observation.author?.lastName}
                    </p>
                  </div>
                  <Badge 
                    variant={observation.type === 'Positive' ? 'success' : 'destructive'}
                    className="w-fit text-base px-3 py-1"
                  >
                    {observation.type}
                  </Badge>
                </div>
                <p className="text-base leading-relaxed">
                  {observation.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )  
}

