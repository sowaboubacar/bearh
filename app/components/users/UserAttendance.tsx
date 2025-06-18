import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Badge } from '~/components/ui/badge'
import type { IAttendanceRecord } from '~/core/entities/attendance.entity.server'

interface UserAttendanceProps {
  attendance: IAttendanceRecord[]
}

export function UserAttendance({ attendance }: UserAttendanceProps) {
  console.log('UserAttendance', attendance)
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="success">Présent</Badge>
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>
      case 'late':
        return <Badge variant="warning">En retard</Badge>
      case 'onBreak':
        return <Badge variant="secondary">En pause</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Historique de présence
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Desktop view */}
        <div className="hidden md:block rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base whitespace-nowrap">Date</TableHead>
                <TableHead className="text-base whitespace-nowrap">Arrivée</TableHead>
                <TableHead className="text-base whitespace-nowrap">Départ</TableHead>
                <TableHead className="text-base whitespace-nowrap">Pause début</TableHead>
                <TableHead className="text-base whitespace-nowrap">Pause fin</TableHead>
                <TableHead className="text-base whitespace-nowrap">Statut</TableHead>
                <TableHead className="text-base whitespace-nowrap">Temps de travail</TableHead>
                <TableHead className="text-base whitespace-nowrap">Temps de pause</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance && attendance?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="text-base">
                    {new Date(record.date).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-base">
                    {formatTime(record.entries.find(e => e.type === 'checkIn')?.timestamp || new Date())}
                  </TableCell>
                  <TableCell className="text-base">
                    {formatTime(record.entries.find(e => e.type === 'checkOut')?.timestamp || new Date())}
                  </TableCell>
                  <TableCell className="text-base">
                    {formatTime(record.entries.find(e => e.type === 'breakStart')?.timestamp || new Date())}
                  </TableCell>
                  <TableCell className="text-base">
                    {formatTime(record.entries.find(e => e.type === 'breakEnd')?.timestamp || new Date())}
                  </TableCell>
                  <TableCell className="text-base">
                    {getStatusBadge(record.status)}
                  </TableCell>
                  <TableCell className="text-base">
                    {record.totalWorkTime ? `${record.totalWorkTime} min` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-base">
                    {record.totalBreakTime ? `${record.totalBreakTime} min` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
  
        {/* Mobile view */}
        <div className="md:hidden space-y-6">
          {attendance && attendance?.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-base font-medium">
                    {new Date(record.date).toLocaleString()}
                  </p>
                  <div className="flex-shrink-0">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Arrivée</p>
                    <p className="text-base">
                      {formatTime(record.entries.find(e => e.type === 'checkIn')?.timestamp || new Date())}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Départ</p>
                    <p className="text-base">
                      {formatTime(record.entries.find(e => e.type === 'checkOut')?.timestamp || new Date())}
                    </p>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Pause début</p>
                    <p className="text-base">
                      {formatTime(record.entries.find(e => e.type === 'breakStart')?.timestamp || new Date())}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Pause fin</p>
                    <p className="text-base">
                      {formatTime(record.entries.find(e => e.type === 'breakEnd')?.timestamp || new Date())}
                    </p>
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Temps de travail</p>
                    <p className="text-base">
                      {record.totalWorkTime ? `${record.totalWorkTime} min` : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-muted-foreground">Temps de pause</p>
                    <p className="text-base">
                      {record.totalBreakTime ? `${record.totalBreakTime} min` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );  
}

