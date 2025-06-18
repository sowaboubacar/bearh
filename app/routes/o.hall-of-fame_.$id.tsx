import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  CalendarIcon,
  TrophyIcon,
  BarChartIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CoffeeIcon,
  AlertTriangleIcon,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Link, useLoaderData } from "@remix-run/react";
import { employeeOfTheMonthService } from "~/services/employeeOfTheMonth.service.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { authService } from "~/services/auth.service.server";
import { HallOfFameActions } from "~/core/entities/utils/access-permission";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const currentLoggedUser = await authService.requireUser(request);
  const employeeOfTheMonth = await employeeOfTheMonthService.getAFamous(
    params.id as string
  );
  return Response.json({ employeeOfTheMonth });
};

const MetricItem = ({
  icon: Icon,
  label,
  value,
  max,
  unit = "",
  reverse = false,
}) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="flex items-center">
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </span>
      <span>
        {value}
        {unit}
      </span>
    </div>
    <Progress
      value={reverse ? ((max - value) / max) * 100 : (value / max) * 100}
    />
  </div>
);

export default function EmployeeOfTheMonthPage() {
  const { employeeOfTheMonth } = useLoaderData<typeof loader>();
  console.log(employeeOfTheMonth);
  const {
    employee,
    isWinner,
    message,
    metrics,
    votes,
    nominationDate,
    finalizationDate,
  } = employeeOfTheMonth;

  const totalVotes = votes.length;
  const positiveVotes = votes.filter((v) => v.voteValue > 0).length;

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full sm:w-auto"
      >
        <Button
          asChild
          variant="ghost"
          className="group w-full sm:w-auto h-12 text-base hover:bg-primary/10 transition-all duration-300"
        >
          <Link
            prefetch="intent"
            to={`/o/hall-of-fame`}
            className="flex items-center justify-center sm:justify-start space-x-2 text-primary"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Le Hall of Fame des Mois</span>
          </Link>
        </Button>
      </motion.div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
              <AvatarImage
                src={employee.avatar?.file?.url}
                alt={employee.firstName}
              />
              <AvatarFallback>
                {(employee.firstName + " " + employee.lastName)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-3xl mb-2">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <p className="text-muted-foreground mb-2">
                {employee.currentDepartment?.name} -{" "}
                {employee.currentPosition?.title}
              </p>
              {isWinner && (
                <Badge variant="secondary" className="text-lg">
                  <TrophyIcon className="w-4 h-4 mr-1" /> Employé du Mois
                </Badge>
              )}
              {!isWinner && nominationDate && !finalizationDate && (
                <Badge variant="secondary" className="text-lg">
                  <CalendarIcon className="w-4 h-4 mr-1" /> Candidature pour le
                  prochain Winner
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg italic mb-4">&quot;{message}&quot;</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {nominationDate && (
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <span>
                  Nominé le : {formatDateToFrenchWithTime(nominationDate)}
                </span>
              </div>
            )}

            {finalizationDate && (
              <div className="flex items-center space-x-2">
                <TrophyIcon className="w-5 h-5 text-muted-foreground" />
                <span>
                  Élu le : {formatDateToFrenchWithTime(finalizationDate)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">
            <BarChartIcon className="w-4 h-4 mr-2" />
            Métriques
          </TabsTrigger>
          <TabsTrigger value="votes">
            <UsersIcon className="w-4 h-4 mr-2" />
            Votes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métriques de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <MetricItem
                  icon={CheckCircleIcon}
                  label="Observations positives"
                  value={metrics.positiveObservation}
                  max={20}
                />
                <MetricItem
                  icon={XCircleIcon}
                  label="Observations négatives"
                  value={metrics.negativeObservation}
                  max={20}
                  reverse={true}
                />
                <MetricItem
                  icon={CheckCircleIcon}
                  label="Tâches complétées"
                  value={metrics.tasksCompleted}
                  max={50}
                />
                <MetricItem
                  icon={BarChartIcon}
                  label="Score KPI moyen"
                  value={metrics.kpiAverageScore}
                  max={5}
                  unit="/5"
                />
                <MetricItem
                  icon={ClockIcon}
                  label="Heures travaillées"
                  value={metrics.workingHours}
                  max={200}
                  unit="h"
                />
                <MetricItem
                  icon={CoffeeIcon}
                  label="Heures de pause"
                  value={metrics.breakHours}
                  max={40}
                  unit="h"
                />
                <MetricItem
                  icon={AlertTriangleIcon}
                  label="Jours de retard"
                  value={metrics.lateDays}
                  max={10}
                  reverse={true}
                />
                <MetricItem
                  icon={AlertTriangleIcon}
                  label="Jours d'absence"
                  value={metrics.absentDays}
                  max={10}
                  reverse={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="votes">
          <Card>
            <CardHeader>
              <CardTitle>Résumé des Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Votes Positifs</span>
                    <span>
                      {positiveVotes} / {totalVotes}
                    </span>
                  </div>
                  <Progress value={(positiveVotes / totalVotes) * 100} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Détail des Votes</h4>
                  <ul className="space-y-2">
                    {votes.map((vote, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <Avatar>
                          <AvatarImage
                            src={vote.voter?.avatar?.file?.url}
                            alt={`Photo de ${vote.voter?.firstName} ${vote.voter?.lastName}`}
                          />
                          <AvatarFallback>
                            {(
                              vote.voter?.firstName +
                              " " +
                              vote.voter?.lastName
                            )
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {vote.voter?.firstName} {vote.voter?.lastName}{" "} 
                        </span>
                        <Badge
                          variant={
                            vote.voteValue > 0
                              ? "success"
                              : vote.voteValue < 0
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {vote.voteValue > 0
                            ? "Positif"
                            : vote.voteValue < 0
                            ? "Négatif"
                            : "Neutre"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
