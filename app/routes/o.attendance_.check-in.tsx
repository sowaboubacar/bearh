/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { useToast } from "~/hooks/use-toast";
import { Toaster } from "~/components/ui/toaster";
import { Sun, Moon, Coffee, LogOut } from "lucide-react";
import { LoaderFunction, ActionFunction } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authService } from "~/services/auth.service.server";
import { attendanceService } from "~/services/attendance.service.server";
import { CheckLocationButton } from "~/components/CheckLocationButton";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { convertMeterToKilometer } from "~/utils/distance";
import { PointageActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const user: any = await authService.requireUser(request, 
    {condition: {any: [PointageActions.CheckIn,
      PointageActions.CheckOut,
      PointageActions.CheckBreakEnd,
      PointageActions.CheckBreakStart,]}});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceRecords = await attendanceService.getUserAttendanceInRange(
    user.id,
    today,
    new Date()
  );

  const can = {
    checkIn: await authService.can(user.id, PointageActions.CheckIn),
    checkOut: await authService.can(user.id, PointageActions.CheckOut),
    checkBreakEnd: await authService.can(user.id, PointageActions.CheckBreakEnd),
    checkBreakStart: await authService.can(user.id, PointageActions.CheckBreakStart),
  }

  return Response.json({ user, attendanceRecords, can });
};

export const action: ActionFunction = async ({ request }) => {

  const formData = await request.formData();
  const actionType = formData.get("actionType") as
    | "checkIn"
    | "checkOut"
    | "breakStart"
    | "breakEnd"
    | "checkUserLocation";

    let requiredPermission;
    switch (actionType) {
      case "checkIn":
        requiredPermission = PointageActions.CheckIn;
        break;
      case "checkOut":
        requiredPermission = PointageActions.CheckOut;
        break;
      case "breakStart":
        requiredPermission = PointageActions.CheckBreakStart;
        break;
      case "breakEnd":
        requiredPermission = PointageActions.CheckBreakEnd;
        break;
      default:
        requiredPermission = PointageActions.CheckIn;
    }

  const user = await authService.requireUser(request, {condition: requiredPermission});
  // Location check
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return Response.json(
      {
        error: "Invalid coordinates",
        success: false,
        isCheckUserLocationResponse: true,
      },
      { status: 400 }
    );
  }

    const { distance, isWithinRadius } =
      await attendanceService.checkUserProximityToAuthorizedPoint(
        latitude,
        longitude
      );

    if (!isWithinRadius) {
      return Response.json(
        {
          error:
            "Position non autorisé. Plus de " +
            convertMeterToKilometer(distance).toFixed(2) +
            " (Km) de la pharmacie !",
          success: false,
          isCheckUserLocationResponse: true,
        },

        { status: 403 }
      );
    }  

  const newRecord = await attendanceService.addEntry(user?.id as string, actionType);
  return Response.json({ success: true, record: newRecord, });
};

export default function PrivateAttendancePage() {
  const { user, attendanceRecords, can } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState(
    attendanceRecords || []
  );
  const [todayWorkHours, setTodayWorkHours] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isUserOnAuthorizedLocation, setIsUserOnAuthorizedLocation] =
    useState(false);
  const [isError, setIsError] = useState(false);

  const handleLocationObtained = (latitude: number, longitude: number) => {
    if (latitude && longitude) {
      setMessage("Position detecté avec succès");
    } else {
      setMessage("Erreur lors de la détection de la position");
    }

    setLatitude(latitude);
    setLongitude(longitude);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    calculateTodayWorkHours();
  }, [attendanceHistory]);

  useEffect(() => {
    console.log("See this log in the browser console");
    console.log(fetcher.data);
    if (fetcher.data && fetcher.data.success) {
     
      console.log(fetcher.data);
      // If action type is checkUserLocation, set the state accordingly
      if (fetcher.data.isCheckUserLocationResponse) {
        setIsUserOnAuthorizedLocation(true);
        setMessage("Vous êtes dans le rayon autorisé");
        setIsLoading(false);
        setIsError(false);
        toast({
          title: "Succès",
          description: "Vous êtes dans le rayon autorisé",
        });
        return;
      }

      setAttendanceHistory((prevHistory) => {
        // Merge entries if the record for today already exists
        const existingRecordIndex = prevHistory.findIndex((record) => {
          const recordDate = new Date(record.date);
          const today = new Date();
          return recordDate.toDateString() === today.toDateString();
        });

        if (existingRecordIndex !== -1) {
          const updatedRecord = { ...prevHistory[existingRecordIndex] };
          updatedRecord.entries = [
            ...updatedRecord.entries,
            ...fetcher.data.record.entries,
          ];
          const newHistory = [...prevHistory];
          newHistory[existingRecordIndex] = updatedRecord;
          return newHistory;
        } else {
          return [...prevHistory, fetcher.data.record];
        }
      });

      const lastEntry =
        fetcher.data.record.entries[fetcher.data.record.entries.length - 1];
      toast({
        title: "Action enregistrée",
        description: `${getActionLabel(lastEntry.type)} enregistré à ${new Date(
          lastEntry.timestamp
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      });
      setIsLoading(false);
      setMessage("");

    } else if (fetcher.data && fetcher.data.error) {
      setIsError(true);
      // If action type is checkUserLocation, set the state accordingly
      if (fetcher.data.isCheckUserLocationResponse) {
        setIsUserOnAuthorizedLocation(false);
        toast({
          title: "Erreur",
          description: fetcher.data.error,
          type: "error",
          position: "top",
        });
        setMessage(fetcher.data.error);
        setIsLoading(false);
        return;
      }

      toast({
        title: "Erreur",
        description: fetcher.data.error,
        type: "error",
      });
      setMessage("");
      setIsLoading(false);
    }
  }, [fetcher.data]);

  const calculateTodayWorkHours = () => {
    let totalWorkTime = 0;
    let lastCheckIn = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecords = attendanceHistory.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === today.toDateString();
    });

    for (const record of todayRecords) {
      for (const entry of record.entries) {
        const entryTime = new Date(entry.timestamp).getTime();

        if (entry.type === "checkIn" || entry.type === "breakEnd") {
          lastCheckIn = entryTime;
        } else if (
          (entry.type === "checkOut" || entry.type === "breakStart") &&
          lastCheckIn
        ) {
          totalWorkTime += entryTime - lastCheckIn;
          lastCheckIn = null;
        }
      }
    }

    if (lastCheckIn) {
      totalWorkTime += new Date().getTime() - lastCheckIn;
    }

    setTodayWorkHours(totalWorkTime / (1000 * 60 * 60)); // Convert to hours
  };

  const handleAttendanceAction = (
    actionType: "checkIn" | "checkOut" | "breakStart" | "breakEnd"
  ) => {
    setIsLoading(true);
    fetcher.submit({ actionType, latitude, longitude }, { method: "post" });
  };

  const getActionLabel = (actionType: string) => {
    const actionLabels = {
      checkIn: "Arrivée",
      checkOut: "Départ",
      breakStart: "Début de pause",
      breakEnd: "Fin de pause",
    };
    return actionLabels[actionType] || actionType;
  };

  const flattenedHistory = attendanceHistory
    .filter((record) => {
      const recordDate = new Date(record.date);
      const today = new Date();
      return recordDate.toDateString() === today.toDateString();
    })
    .flatMap((record) =>
      record.entries.map((entry) => ({
        action: entry.type,
        timestamp: entry.timestamp,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ); // Sort in descending order

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center truncate">
              Bienvenue, {user.firstName} !
            </CardTitle>
            <CardDescription className="text-base sm:text-lg lg:text-xl text-center mt-2">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 sm:p-6">
            {!message && (
              <p className="text-center mt-2 mb-4 bold">
                Que souhaitez-vous faire maintenant ?
              </p>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className=" text-center bg-red text-sm mt-2 mb-2 border-emerald-800  p-2"
              >
                <Alert variant={isError ? "destructive" : "default"}>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <CheckLocationButton onLocationObtained={handleLocationObtained} />
            <Separator className="my-4 sm:my-6" />

            {latitude && longitude &&
             (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {can.checkIn && (
                  <Button
                    className="w-full h-16 sm:h-20 text-base sm:text-lg flex items-center justify-center"
                    onClick={() => handleAttendanceAction("checkIn")}
                    disabled={isLoading}
                >
                  <Sun className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Arrivée
                </Button>
                )}
                {can.checkOut && (
                <Button
                  className="w-full h-16 sm:h-20 text-base sm:text-lg flex items-center justify-center"
                  onClick={() => handleAttendanceAction("checkOut")}
                  variant="secondary"
                  disabled={isLoading}
                >
                  <Moon className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Départ
                </Button>
                )}
                {can.checkBreakStart && (
                <Button
                  className="w-full h-16 sm:h-20 text-base sm:text-lg flex items-center justify-center"
                  onClick={() => handleAttendanceAction("breakStart")}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Coffee className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Début de pause
                </Button>
                )}
                {can.checkBreakEnd && (
                <Button
                  className="w-full h-16 sm:h-20 text-base sm:text-lg flex items-center justify-center"
                  onClick={() => handleAttendanceAction("breakEnd")}
                  variant="outline"
                  disabled={isLoading}
                >
                  <LogOut className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Fin de pause
                </Button>
                )}
              </div>
            )}
            <Separator className="my-4 sm:my-6" />
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                Temps de travail aujourd'hui
              </h3>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {todayWorkHours.toFixed(2)} heures
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Historique de pointage du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <ul className="space-y-3">
                {flattenedHistory.map((record, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-3 sm:p-4 bg-muted rounded-lg"
                  >
                    <span className="text-sm sm:text-base font-medium">
                      {getActionLabel(record.action)}
                    </span>
                    <span className="text-sm sm:text-base text-muted-foreground">
                      {new Date(record.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
