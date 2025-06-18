import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { MetricsAndCharts } from "~/components/attendances/MetricsAndCharts";
import { attendanceService } from "~/services/attendance.service.server";
import {
  formatDateToFrench,
  parseFrenchDate,
} from "~/utils/dateFormatting"; 
import { motion } from "framer-motion";
import { CalendarIcon} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { userService } from "~/services/user.service.server";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { authService } from "~/services/auth.service.server";
import { UserActions } from "~/core/entities/utils/access-permission";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const currentLoggedUser = await authService.requireUser(request, {condition: UserActions.ViewOnProfileAttendanceInsight});
  const userId = params.id;
  const url = new URL(request.url);

  const user = await userService.readOne({id: userId!, populate: "avatar,currentPosition"});

  // Get date range from query params or default to last 30 days
  const startStr = url.searchParams.get("startDate");
  const endStr = url.searchParams.get("endDate");

  let startDate: Date;
  let endDate: Date;

  if (startStr && endStr) {
    // Assume they come in as YYYY-MM-DD or DD/MM/YYYY and parse accordingly
    startDate = parseFrenchDate(startStr);
    endDate = parseFrenchDate(endStr);
  } else {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
  }

  // Reference check-in time (e.g., 09:00 on any date)
  const referenceCheckInTime = new Date(endDate);
  referenceCheckInTime.setHours(10, 0, 0, 0);

  const { dailySummaries, overallSummary } =
    await attendanceService.getAggregatedMetrics(
      userId!,
      startDate,
      endDate,
      referenceCheckInTime
    );

  // Transform dailySummaries for line chart
  const lineChartData = dailySummaries.map((day) => ({
    x: day.date,
    y: Math.round(day.totalWorkTime / 60), // hours
  }));

  // Status bar data
  const statusData = [
    { label: "Jours Absents", value: overallSummary.absentCount },
    { label: "Jours en Retard", value: overallSummary.lateCount },
  ];

  // Pie data for Work vs Break
  const pieData = [
    { label: "Temps de travail", value: overallSummary.totalWorkTime },
    { label: "Temps de pause", value: overallSummary.totalBreakTime },
  ];

  const can = {
    create: await authService.can(currentLoggedUser?.id as string, UserActions.Create),
    edit: await authService.can(currentLoggedUser?.id as string, UserActions.Edit),
    delete: await authService.can(currentLoggedUser?.id as string, UserActions.Delete),
    view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
    quickMakeObservation: await authService.can(currentLoggedUser?.id as string, UserActions.QuickMakeObservation),
    quickMakeKpiEvaluation: await authService.can(currentLoggedUser?.id as string, UserActions.QuickMakeKpiEvaluation),
    quickAssignTask: await authService.can(currentLoggedUser?.id as string, UserActions.QuickAssignTask),
    quickChangeAccess: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeAccess),
    quickChangePosition: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangePosition),
    quickChangeTeam: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeTeam),
    quickChangeDepartment: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeDepartment),
    quickChangeHourGroup: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeHourGroup),
    quickChangeBonusCategory: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeBonusCategory),
  }

  const insight = {
    dailySummaries,
    overallSummary,
    charts: {
      lineChartData,
      statusData,
      pieData,
    },
    user,
    can,
  };

  return Response.json(insight);
}


export default function AttendanceTab() {
  const { dailySummaries, overallSummary, charts, user , can} =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const initialStart = dailySummaries[0]?.date
    ? parseFrenchDate(dailySummaries[0].date)
    : new Date();
  const initialEnd = dailySummaries[dailySummaries.length - 1]?.date
    ? parseFrenchDate(dailySummaries[dailySummaries.length - 1].date)
    : new Date();

  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);

  const handleDateChange = () => {
    const startStr = formatDateToFrench(startDate);
    const endStr = formatDateToFrench(endDate);
    navigate(`?startDate=${startStr}&endDate=${endStr}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      <div className="mb-2">
        <CompactUserHeader user={user} can={can} />
        <h1 className="text-3xl font-bold mb-4 mt-2 text-center">Analytiques des Pointages</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 p-4 md:p-6"
      >
        <div className="flex flex-col md:flex-row  justify-center  items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    formatDateToFrench(startDate)
                  ) : (
                    <span>Date de début</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    formatDateToFrench(endDate)
                  ) : (
                    <span>Date de fin</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleDateChange} className="w-full md:w-auto">
            Mettre à jour
          </Button>
        </div>

        <MetricsAndCharts
          dailySummaries={dailySummaries}
          overallSummary={overallSummary}
          charts={charts}
        />
      </motion.div>
    </div>
  );
}
