import { Line, Bar, Pie } from "react-chartjs-2";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { motion } from "framer-motion";
import { Clock, Calendar, AlertTriangle, UserX, TrendingUp } from 'lucide-react';

type MetricsAndChartsProps = {
  dailySummaries: Array<{
    date: string;
    totalWorkTime: number;
    totalBreakTime: number;
    isLate: boolean;
    isAbsent: boolean;
  }>;
  overallSummary: {
    totalWorkTime: number;
    totalBreakTime: number;
    lateCount: number;
    absentCount: number;
    averageWorkTime: number;
  };
  charts: {
    lineChartData: { x: string; y: number }[];
    statusData: { label: string; value: number }[];
    pieData: { label: string; value: number }[];
  };
};

export function MetricsAndCharts({
  dailySummaries,
  overallSummary,
  charts,
}: MetricsAndChartsProps) {

  const lineData = {
    labels: charts.lineChartData.map((pt) => pt.x),
    datasets: [
      {
        label: "Heures de travail (par jour)",
        data: charts.lineChartData.map((pt) => pt.y),
        borderColor: "rgba(0, 120, 125, 1)",
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const barData = {
    labels: charts.statusData.map((d) => d.label),
    datasets: [
      {
        label: "Quantité",
        data: charts.statusData.map((d) => d.value),
        backgroundColor: ["rgba(10, 195, 201, 0.2)", "rgba(0, 120, 125, 1)"],
        borderColor: ["rgba(10, 195, 201, 0.2)", "rgba(0, 120, 125, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: charts.pieData.map((p) => p.label),
    datasets: [
      {
        data: charts.pieData.map((p) => p.value),
        backgroundColor: ["#00787d", "#0ac3c9"],
      },
    ],
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-2xl font-bold">Métriques Globales</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <p>Total Heures de Travail: <span className="font-semibold">{Math.round(overallSummary.totalWorkTime / 60)} h</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <p>Total Heures de Pause: <span className="font-semibold">{Math.round(overallSummary.totalBreakTime / 60)} h</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p>Jours en Retard: <span className="font-semibold">{overallSummary.lateCount}</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-destructive" />
                <p>Jours Absents: <span className="font-semibold">{overallSummary.absentCount}</span></p>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p>Heures Moy. de Travail: <span className="font-semibold">{Math.round(overallSummary.averageWorkTime / 60)} h</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="line" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="line">Évolution</TabsTrigger>
          <TabsTrigger value="bar">Statuts</TabsTrigger>
          <TabsTrigger value="pie">Ratio</TabsTrigger>
        </TabsList>
        <TabsContent value="line">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Heures de Travail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Line data={lineData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="bar">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Statuts (Retard, Absence)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Bar data={barData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="pie">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ratio Travail vs Pause</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <Pie data={pieData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Détails Quotidiens</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Date</th>
                  <th className="text-left p-2 font-medium">Heures de Travail</th>
                  <th className="text-left p-2 font-medium">Heures de Pause</th>
                  <th className="text-left p-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.map((day) => (
                  <tr key={day.date} className="border-b last:border-b-0">
                    <td className="p-2">{day.date}</td>
                    <td className="p-2">{Math.round(day.totalWorkTime / 60)} h</td>
                    <td className="p-2">{Math.round(day.totalBreakTime / 60)} h</td>
                    <td className="p-2">
                      {day.isLate && <Badge variant="warning" className="mr-1">Retard</Badge>}
                      {day.isAbsent && <Badge variant="destructive">Absent</Badge>}
                      {!day.isLate && !day.isAbsent && <Badge variant="secondary">Présent</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

