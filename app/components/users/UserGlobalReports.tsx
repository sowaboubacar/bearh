import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

interface IGlobalReport {
  attendanceRate: number
  averagePerformance: number
  completedTasks: number
  trainingsCompleted: number
  summary: string
  goals: string[]
  startDate: string
  endDate: string
}

interface UserGlobalReportProps {
  globalReport: IGlobalReport
}

export function UserGlobalReport({ globalReport = {
  attendanceRate: 0,
  averagePerformance: 0,
  completedTasks: 0,
  trainingsCompleted: 0,
  summary: '',
  goals: [],
  startDate: '',
  endDate: ''
}
}: UserGlobalReportProps) {

  // Generate sample global report data and ovveride it with the provided data
  const defaultGlobalReport: IGlobalReport = {
    attendanceRate: 0,
    averagePerformance: 0,
    completedTasks: 0,
    trainingsCompleted: 0,
    summary: '',
    goals: [],
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString()
  }

  globalReport = { ...defaultGlobalReport, ...globalReport }

  if(!globalReport) return null;
  
  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
          Rapport Global
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base whitespace-nowrap min-w-[150px]">
                  Métrique
                </TableHead>
                <TableHead className="text-base whitespace-nowrap">
                  Valeur
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-base font-medium">
                  Taux de présence
                </TableCell>
                <TableCell className="text-base">
                  {globalReport.attendanceRate}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-base font-medium">
                  Performance moyenne
                </TableCell>
                <TableCell className="text-base">
                  {globalReport.averagePerformance}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-base font-medium">
                  Tâches complétées
                </TableCell>
                <TableCell className="text-base">
                  {globalReport.completedTasks}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-base font-medium">
                  Formations suivies
                </TableCell>
                <TableCell className="text-base">
                  {globalReport.trainingsCompleted}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
  
        <div className="space-y-3">
          <h3 className="text-lg sm:text-xl font-semibold">
            Résumé
          </h3>
          <p className="text-base">
            {globalReport.summary}
          </p>
        </div>
  
        <div className="space-y-3">
          <h3 className="text-lg sm:text-xl font-semibold">
            Objectifs
          </h3>
          <ul className="list-disc list-inside space-y-2">
            {globalReport.goals.map((goal, index) => (
              <li key={index} className="text-base">
                {goal}
              </li>
            ))}
          </ul>
        </div>
  
        <div className="pt-2 border-t">
          <p className="text-base text-muted-foreground">
            Période du rapport: {new Date(globalReport.startDate).toLocaleString()} - {new Date(globalReport.endDate).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );  
}

