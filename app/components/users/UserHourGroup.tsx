import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import type { IHourGroup } from '~/core/entities/hourGroup.entity.server'

interface UserHourGroupProps {
  hourGroup: IHourGroup
}

export function UserHourGroup({ hourGroup }: UserHourGroupProps) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Programme
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {hourGroup && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                Nom du groupe
              </h3>
              <p className="text-base">
                {hourGroup.name}
              </p>
            </div>
  
            {hourGroup.note && (
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Note
                </h3>
                <p className="text-base">
                  {hourGroup.note}
                </p>
              </div>
            )}
  
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">
                Période
              </h3>
              <p className="text-base">
                Du {new Date(hourGroup.startAt).toLocaleString()} au{" "}
                {new Date(hourGroup.endAt).toLocaleString()}
              </p>
            </div>
  
            {(hourGroup.restShouldStartAt || hourGroup.restShouldEndAt) && (
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Pause par défaut
                </h3>
                <p className="text-base">
                  {hourGroup.restShouldStartAt || "N/A"} -{" "}
                  {hourGroup.restShouldEndAt || "N/A"}
                </p>
              </div>
            )}
  
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Horaires
              </h3>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-base whitespace-nowrap">
                        Date
                      </TableHead>
                      <TableHead className="text-base whitespace-nowrap">
                        Début
                      </TableHead>
                      <TableHead className="text-base whitespace-nowrap">
                        Fin
                      </TableHead>
                      <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                        Pause début
                      </TableHead>
                      <TableHead className="text-base whitespace-nowrap hidden sm:table-cell">
                        Pause fin
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hourGroup.workTimes.map((workTime, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-base">
                          {new Date(workTime.date).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-base">
                          {workTime.startAt}
                        </TableCell>
                        <TableCell className="text-base">
                          {workTime.endAt}
                        </TableCell>
                        <TableCell className="text-base hidden sm:table-cell">
                          {workTime.restShouldStartAt ||
                            hourGroup.restShouldStartAt ||
                            "N/A"}
                        </TableCell>
                        <TableCell className="text-base hidden sm:table-cell">
                          {workTime.restShouldEndAt ||
                            hourGroup.restShouldEndAt ||
                            "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
  
              {/* Mobile view for break times */}
              <div className="sm:hidden space-y-4">
                {hourGroup.workTimes.map((workTime, index) => (
                  <div key={`break-${index}`} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-base font-medium">Pause début:</span>
                      <span className="text-base">
                        {workTime.restShouldStartAt ||
                          hourGroup.restShouldStartAt ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base font-medium">Pause fin:</span>
                      <span className="text-base">
                        {workTime.restShouldEndAt ||
                          hourGroup.restShouldEndAt ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
  
            {hourGroup.members && hourGroup.members.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Membres
                </h3>
                <p className="text-base">
                  {hourGroup.members.length} membre(s)
                </p>
              </div>
            )}
  
            {hourGroup.attachments && hourGroup.attachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Pièces jointes
                </h3>
                <p className="text-base">
                  {hourGroup.attachments.length} pièce(s) jointe(s)
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );  
}

