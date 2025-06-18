import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarDays, LayoutGrid, List, Search } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { authService } from "~/services/auth.service.server";
import { attendanceService } from "~/services/attendance.service.server";
import { userService } from "~/services/user.service.server";
import { PointageActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authService.requireUser(request, {condition: PointageActions.ViewAttendanceGlobalUpdateHistory});

  // Default to today's date
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam ? parseISO(dateParam) : new Date();

  const start = startOfDay(date);
  const end = endOfDay(date);

  // Fetch attendance records within the date range
  const attendanceRecords = await attendanceService.readMany(
    {
      date: { $gte: start, $lte: end },
    },
    { sort: { updatedAt: -1 }, populate: "user" }
  );

  // Populate user data
  const populatedRecords = await Promise.all(
    attendanceRecords.map(async (record) => {
      const user = await userService.readOne({ _id: record.user });
      return { ...record.toObject(), user: user.toObject() };
    })
  );

  const can = {
    filter: await authService.can(user?.id as string, PointageActions.FilterAttendanceGlobalUpdateHistory),
  }

  return Response.json({ attendanceRecords: populatedRecords, can });
};

const getStatusBadge = (status: string) => {
  const styles = {
    present: "bg-green-100 text-green-800",
    absent: "bg-red-100 text-red-800",
    onBreak: "bg-blue-100 text-blue-800",
  };
  const labels = {
    present: "Présent",
    absent: "Absent",
    onBreak: "En pause",
  };
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
};

export default function AttendanceHistoryPage() {
  const { attendanceRecords, can } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const date = dateParam ? parseISO(dateParam) : new Date();

  const [view, setView] = useState<"grid" | "table">("grid"); // Grid view as default
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = attendanceRecords.filter((record) => {
    const user = record.user;
    if (!user) return false;

    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getAttendanceSummary = () => {
    const total = attendanceRecords.length;
    if (total === 0) {
      return {
        presentRate: 0,
        absentRate: 0,
        onBreakRate: 0,
      };
    }
    const present = attendanceRecords.filter(
      (r) => r.status === "present"
    ).length;
    const absent = attendanceRecords.filter(
      (r) => r.status === "absent"
    ).length;
    const onBreak = attendanceRecords.filter(
      (r) => r.status === "onBreak"
    ).length;

    return {
      presentRate: (present / total) * 100,
      absentRate: (absent / total) * 100,
      onBreakRate: (onBreak / total) * 100,
    };
  };

  const summary = getAttendanceSummary();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Historique des Pointages
        </h1>
        {can.filter && (
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[280px] h-11 justify-start text-left text-base font-normal"
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                {format(date, "d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => {
                  if (date) {
                    setSearchParams({ date: format(date, "yyyy-MM-dd") });
                  }
                }}
                initialFocus
                className="text-base"
              />
            </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                  {summary.presentRate.toFixed(1)}%
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Taux de présence
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                  {summary.absentRate.toFixed(1)}%
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Absences
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">
                  {summary.onBreakRate.toFixed(1)}%
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  En pause
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              className="pl-10 h-11 text-base w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
            className="h-11 w-11"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("table")}
            className="h-11 w-11"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Data Display */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredRecords.map((record) => {
            const user = record.user;
            return (
              <Card key={record._id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mb-4">
                      <AvatarImage
                        src={record?.user.avatar?.file?.url}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback className="text-lg sm:text-xl">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-base sm:text-lg font-semibold">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      {user.role}
                    </p>
                    {getStatusBadge(record.status)}
                    <div className="mt-4 w-full space-y-3">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Arrivée:</span>
                        <span>
                          {record.entries.find((e) => e.type === "checkIn")
                            ?.timestamp
                            ? new Date(
                                record.entries.find(
                                  (e) => e.type === "checkIn"
                                ).timestamp
                              ).toLocaleTimeString()
                            : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Départ:</span>
                        <span>
                          {record.entries.find((e) => e.type === "checkOut")
                            ?.timestamp
                            ? new Date(
                                record.entries.find(
                                  (e) => e.type === "checkOut"
                                ).timestamp
                              ).toLocaleTimeString()
                            : "---"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Total:</span>
                        <span>
                          {record.totalWorkTime
                            ? `${(record.totalWorkTime / 60).toFixed(2)} heures`
                            : "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base">Employé</TableHead>
                <TableHead className="text-base">Statut</TableHead>
                <TableHead className="text-base">Arrivée</TableHead>
                <TableHead className="text-base">Départ</TableHead>
                <TableHead className="text-base">Total (H)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const user = record.user;
                return (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3">
                          <AvatarImage
                            src={user.avatar?.file?.url}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                          <AvatarFallback className="text-base">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-base">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm sm:text-base text-muted-foreground">
                            {user.role}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-base">
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell className="text-base">
                      {record.entries.find((e) => e.type === "checkIn")
                        ?.timestamp
                        ? new Date(
                            record.entries.find(
                              (e) => e.type === "checkIn"
                            ).timestamp
                          ).toLocaleTimeString()
                        : "---"}
                    </TableCell>
                    <TableCell className="text-base">
                      {record.entries.find((e) => e.type === "checkOut")
                        ?.timestamp
                        ? new Date(
                            record.entries.find(
                              (e) => e.type === "checkOut"
                            ).timestamp
                          ).toLocaleTimeString()
                        : "---"}
                    </TableCell>
                    <TableCell className="text-base">
                      {record.totalWorkTime
                        ? `${(record.totalWorkTime / 60).toFixed(2)} heures`
                        : "---"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
