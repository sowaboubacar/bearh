import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { userMonthlyReportService } from "~/services/userMonthlyReport.service.server";
import { userService } from "~/services/user.service.server";
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { UserActions } from "~/core/entities/utils/access-permission";


interface LoaderData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  reportsData: any;
  comparisonMode: boolean;
  year: string | null;
  startMonth: string | null;
  endMonth: string | null;
}

function getPreviousMonthYear() {
  const now = dayjs();
  const prev = now.subtract(1, "month");
  return { year: prev.year(), month: prev.month() + 1 };
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const currentLoggedUser =  await authService.requireUser(request, {condition: UserActions.ViewOneProfileMonthlyReportInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID required", { status: 400 });
  }

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const startMonth = url.searchParams.get("startMonth");
  const endMonth = url.searchParams.get("endMonth");
  let comparisonMode = false;
  let reportsData: any = {};

  if (!year || !startMonth || !endMonth) {
    // Default to previous month if any parameter is missing
    const { year: py, month: pm } = getPreviousMonthYear();
    const report = await userMonthlyReportService.getMonthlyReport(userId, py, pm);
    reportsData = { [`${py}-${pm}`]: report };
  } else {
    const y = parseInt(year, 10);
    const sm = parseInt(startMonth, 10);
    const em = parseInt(endMonth, 10);

    if (sm > em) {
      throw new Response("Le mois de début ne peut pas être supérieur au mois de fin.", { status: 400 });
    }

    const totalMonths = em - sm + 1;
    if (totalMonths > 1) {
      comparisonMode = true;
      for (let m = sm; m <= em; m++) {
        const rpt = await userMonthlyReportService.getMonthlyReport(userId, y, m);
        reportsData[`${y}-${m}`] = rpt;
      }
    } else {
      const rpt = await userMonthlyReportService.getMonthlyReport(userId, y, sm);
      reportsData = { [`${y}-${sm}`]: rpt };
    }
  }

  const user = await userService.readOne({ id: userId });

  const can =  {
    view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
  }
  return json<LoaderData>({ user, can, reportsData, comparisonMode, year, startMonth, endMonth });
};


export default function UserGlobalReportsPage() {
  const { user, reportsData, comparisonMode, year, startMonth, endMonth , can} = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [activeTab, setActiveTab] = useState<string>("attendanceData");
  const [selectedYear, setSelectedYear] = useState<string>(year || new Date().getFullYear().toString());
  const [selectedStartMonth, setSelectedStartMonth] = useState<string>(startMonth || "1");
  const [selectedEndMonth, setSelectedEndMonth] = useState<string>(endMonth || "12");
  const submit = useSubmit();

  useEffect(() => {
    if (year) setSelectedYear(year);
    if (startMonth) setSelectedStartMonth(startMonth);
    if (endMonth) setSelectedEndMonth(endMonth);
  }, [year, startMonth, endMonth]);

  const handleFilterSubmit = () => {
    submit(
      {
        year: selectedYear,
        startMonth: selectedStartMonth,
        endMonth: selectedEndMonth,
      },
      { method: "get", replace: true }
    );
  };

  const renderDataContent = (tab: string, data: any) => {
    switch (tab) {
      case "attendanceData":
        return (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Heures totales travaillées</TableCell>
                <TableCell>{data.attendanceData.totalHours.toFixed(2)} heures</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Heures moyennes par jour</TableCell>
                <TableCell>{data.attendanceData.meanHours.toFixed(2)} heures</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Absences</TableCell>
                <TableCell>{data.attendanceData.absences}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Retards</TableCell>
                <TableCell>{data.attendanceData.lates}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ratio Heures vs Pause</TableCell>
                <TableCell>{(data.attendanceData.workedVsPauseRatio).toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ratio Jours travaillés vs Jours totaux</TableCell>
                <TableCell>{(data.attendanceData.workedDaysRatio * 100).toFixed(2)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );
      case "taskData":
        return (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Tâches complétées</TableCell>
                <TableCell>{data.taskData.completed}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tâches en cours</TableCell>
                <TableCell>{data.taskData.inProgress}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ratio Complétées vs Total</TableCell>
                <TableCell>{(data.taskData.ratioCompleted * 100).toFixed(2)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );
      case "performanceData":
        return (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Score moyen des KPI</TableCell>
                <TableCell>{data.performanceData.meanScore.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );
      case "observationData":
        return (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Observations positives</TableCell>
                <TableCell>{data.observationData.positive}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Observations négatives</TableCell>
                <TableCell>{data.observationData.negative}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ratio Positives vs Négatives</TableCell>
                <TableCell>{(data.observationData.ratioPositive * 100).toFixed(2)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );
      case "leaveData":
        return (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Nombre total de congés</TableCell>
                <TableCell>{data.leaveData.totalLeaves}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ratio Congés vs Jours totaux</TableCell>
                <TableCell>{(data.leaveData.ratioLeaves * 100).toFixed(2)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Types de congés</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    {Object.entries(data.leaveData.leavesByType).map(([type, count]) => (
                      <li key={type}>{type}: {count}</li>
                    ))}
                  </ul>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      {can?.view && (
      <div className="mb-6">
        <a href={`/o/users/view/${user.id}`} className="flex items-center text-primary hover:text-primary-dark">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Retour au profil</span>
        </a>
      </div>
      )}

      {/* Filter Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Rapport Global pour {user.firstName} {user.lastName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Year Selector */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sélectionnez l'année" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                })}
              </SelectContent>
            </Select>

            {/* Start Month Selector */}
            <Select value={selectedStartMonth} onValueChange={setSelectedStartMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Mois de début" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={m.toString()}>{dayjs().month(m - 1).format("MMMM")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* End Month Selector */}
            <Select value={selectedEndMonth} onValueChange={setSelectedEndMonth}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Mois de fin" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <SelectItem key={m} value={m.toString()}>{dayjs().month(m - 1).format("MMMM")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Submit Button */}
            <Button onClick={handleFilterSubmit} className="w-full sm:w-auto">
              Afficher le rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Download CSV Button */}
      <div className="mb-6 flex justify-center">
        <a
          href={`/o/users/view/${user.id}/global-reports/csv?year=${selectedYear}&startMonth=${selectedStartMonth}&endMonth=${selectedEndMonth}`}
          className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          <Download className="h-5 w-5" />
          <span>Télécharger le rapport (CSV)</span>
        </a>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex justify-center items-center">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && reportsData && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Table Section */}
            <Card>
              <CardHeader>
                <CardTitle>{comparisonMode ? "Comparaison Globale" : "Rapport Global"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Période</TableHead>
                      <TableHead>Heures Travaillées</TableHead>
                      <TableHead>Tâches Complétées</TableHead>
                      <TableHead>Score KPI Moyen</TableHead>
                      <TableHead>Observations Positives</TableHead>
                      <TableHead>Observations Négatives</TableHead>
                      <TableHead>Congés Totaux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(reportsData).map(([key, report]: [string, any]) => {
                      const [year, month] = key.split('-');
                      return (
                        <TableRow key={key}>
                          <TableCell>{`${month}/${year}`}</TableCell>
                          <TableCell>{report.attendanceData.totalHours.toFixed(2)}</TableCell>
                          <TableCell>{report.taskData.completed}</TableCell>
                          <TableCell>{report.performanceData.meanScore.toFixed(2)}</TableCell>
                          <TableCell>{report.observationData.positive}</TableCell>
                          <TableCell>{report.observationData.negative}</TableCell>
                          <TableCell>{report.leaveData.totalLeaves}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Detailed Tabs */}
            <Tabs defaultValue="attendanceData" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="attendanceData">Présence</TabsTrigger>
                <TabsTrigger value="taskData">Tâches</TabsTrigger>
                <TabsTrigger value="performanceData">Performance</TabsTrigger>
                <TabsTrigger value="observationData">Observations</TabsTrigger>
                <TabsTrigger value="leaveData">Congés</TabsTrigger>
              </TabsList>
              {Object.entries(reportsData).map(([key, report]: [string, any]) => {
                const [year, month] = key.split('-');
                const formattedMonth = dayjs(`${year}-${month}-01`).format("MMMM YYYY");
                return (
                  <div key={key} className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">{formattedMonth}</h3>
                    <TabsContent value="attendanceData">
                      {renderDataContent("attendanceData", report)}
                    </TabsContent>
                    <TabsContent value="taskData">
                      {renderDataContent("taskData", report)}
                    </TabsContent>
                    <TabsContent value="performanceData">
                      {renderDataContent("performanceData", report)}
                    </TabsContent>
                    <TabsContent value="observationData">
                      {renderDataContent("observationData", report)}
                    </TabsContent>
                    <TabsContent value="leaveData">
                      {renderDataContent("leaveData", report)}
                    </TabsContent>
                  </div>
                );
              })}
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

