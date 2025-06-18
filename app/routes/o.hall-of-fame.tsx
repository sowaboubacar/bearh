import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  ArrowRight,
  BarChart,
  Calendar,
  Clock,
  Star,
  TrophyIcon,
} from "lucide-react";
import { IEmployeeOfTheMonth } from "~/core/entities/employeeOfTheMonth.entity.server";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Link, useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { employeeOfTheMonthService } from "~/services/employeeOfTheMonth.service.server";
import { authService } from "~/services/auth.service.server";
import { HallOfFameActions } from "~/core/entities/utils/access-permission";

export const loader = async ({ request }: LoaderFunctionArgs) => {
 const currentLoggedUser = await authService.requireUser(request);
  // Past winners in last 12 months
  const pastEmployees = await employeeOfTheMonthService.getWinnersForPeriod();
  // Current nominations for the current month which need votes
  const currentCandidates =
    await employeeOfTheMonthService.getNominationsInRange();
  // Current employee of the month which is the winner for the current month or last 31 days. Useful to display
  // the current employee of the month on the dashboard until we have a new winner.
  const currentEmployee = await employeeOfTheMonthService.getWinnerForPeriod();

  const can = {
    castVote: await authService.can(currentLoggedUser?.id as string, {any: [HallOfFameActions.CastVote]}),
  }
  return Response.json({ currentEmployee, pastEmployees, currentCandidates, can });
};


// Composant pour afficher l'employé du mois actuel
const CurrentEmployee = ({ employee }: { employee: IEmployeeOfTheMonth }) => {
  if (!employee) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link
        to={`/o/hall-of-fame/${employee.id}`}
        key={employee.id}
        className="block"
      >
        <Card className="mb-6 overflow-hidden shadow-lg hallOfFame-Card ">
          <div className="bg-primary text-primary-foreground p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-3xl font-bold text-center">
                Employé du Mois
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-6">
              <div className="flex flex-col items-center md:items-start space-y-2">
                <Avatar className="h-32 w-32 border-4 border-primary-foreground shadow-xl">
                  <AvatarImage
                    src={employee.employee?.avatar?.file?.url}
                    alt={`Photo de ${employee.employee.firstName} ${employee.employee.lastName}`}
                  />
                  <AvatarFallback className="text-4xl">
                    {(employee.employee.name + " " + employee.employee.lastName)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold mt-2">
                  {employee.employee.firstName} {employee.employee.lastName}
                </h3>
                {employee.employee.currentPosition && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {employee.employee.currentPosition?.title}
                  </Badge>
                )}
              </div>
              <div className="text-center md:text-right max-w-md">
                <p className="text-xl italic leading-relaxed">
                  "{employee.message}"
                </p>
              </div>
            </CardContent>
          </div>
          <CardContent className="p-6 bg-gradient-to-b from-primary/10 to-transparent">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: Star,
                  label: "KPI Moyen",
                  value: employee.metrics.kpiAverageScore.toFixed(1),
                },
                {
                  icon: BarChart,
                  label: "Tâches Complétées",
                  value: employee.metrics.tasksCompleted,
                },
                {
                  icon: Clock,
                  label: "Heures Travaillées",
                  value: employee.metrics.workingHours,
                },
                {
                  icon: Calendar,
                  label: "Date de Nomination",
                  value: new Date(employee.nominationDate).toLocaleDateString(
                    "fr-FR",
                    { day: "numeric", month: "short" }
                  ),
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center p-3 bg-background rounded-lg shadow-md"
                >
                  <item.icon className="h-8 w-8 text-primary mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

// Composant pour afficher l'historique des employés du mois
const EmployeeHistory = ({
  employees = [],
}: {
  employees: IEmployeeOfTheMonth[] ;
}) => {
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-center">
          Hall of Fame des 12 Mois Précédents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {employees?.map((employee) => (
              <Link to={`/o/hall-of-fame/${employee.id}`} key={employee.id}>
                <div key={employee.id} className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage
                      src={employee.employee?.avatar?.file?.url}
                      alt={`Photo de ${employee.employee.firstName} ${employee.employee.lastName}`}
                    />
                    <AvatarFallback>
                      {(
                        employee.employee.firstName +
                        " " +
                        employee.employee.lastName
                      )
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {employee.employee.firstName} {employee.employee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {employee.finalizationDate
                        ? new Date(
                            employee.finalizationDate
                          ).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                          })
                        : "Date inconnue"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Composant pour afficher les candidats du mois en cours
const CurrentCandidates = ({
  candidates = [],
}: {
  candidates: IEmployeeOfTheMonth[];
}) =>{
  
  return (
  <Card>
    <CardHeader>
      <CardTitle>Candidats du Mois en Cours</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {candidates?.map((candidate) => (
          <Link
            to={`/o/hall-of-fame/${candidate.id}`}
            key={candidate.id}
            className="block"
          >
            <Card>
              <CardContent className="flex items-center space-x-4 p-4">
                <Avatar>
                  <AvatarImage
                    src={candidate.employee.avatar?.file?.url}
                    alt={`Photo de ${candidate.employee.firstName} ${candidate.employee.lastName}`}
                  />
                  <AvatarFallback>
                    {(
                      candidate.employee.firstName +
                      " " +
                      candidate.employee.lastName
                    )
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {candidate.employee.firstName} {candidate.employee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {candidate.votes.length} votes
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </CardContent>
  </Card>
)};

export default function EmployeeOfTheMonthDashboards() {
  const { currentEmployee, pastEmployees, currentCandidates, can } =
    useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {can?.castVote && (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full sm:w-auto right-0 align-right text-right mb-6"
      >
        <Button
          asChild
          variant="ghost"
          className="group w-full sm:w-auto h-12 text-base hover:bg-primary/10 transition-all duration-300"
        >
          <Link
            prefetch="intent"
            to={`/o/hall-of-fame/ongoing`}
            className="flex items-center justify-center sm:justify-start space-x-2 text-primary"
          >
            <ArrowRight className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Vote pour le Hall of Fame</span>
          </Link>
        </Button>
      </motion.div>
      )}
      <motion.h1
        className="text-4xl font-bold mb-8 flex items-center justify-center text-center text-blue-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <TrophyIcon className="mr-4 h-10 w-10 text-yellow-500" />
        Le Hall of Fame des Mois
      </motion.h1>
      <CurrentEmployee employee={currentEmployee} />
      <EmployeeHistory employees={pastEmployees} />
      <CurrentCandidates candidates={currentCandidates} />
    </div>
  );
}
