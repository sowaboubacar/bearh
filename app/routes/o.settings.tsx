import { useState, useEffect } from "react";
import { ActionFunctionArgs, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { systemConfigService } from "~/services/systemConfig.service.server";
import { userService } from "~/services/user.service.server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NotificationSettings } from "~/components/settings/NotificationSettings";
import { BonusCalculationSettings } from "~/components/settings/BonusCalculationSettings";
import { ConfigDisplay } from "~/components/settings/ConfigDisplay";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { AlertCircle, CheckCircle, Loader2, MapPin } from "lucide-react";
import { authService } from "~/services/auth.service.server";
import { EmployeeOfTheMonthSettings } from "~/components/settings/EmployeeOfTheMonthSettings";
import { SystemConfigActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentUser = await authService.requireUser(request, {condition: {all: [SystemConfigActions.Edit, SystemConfigActions.Reset]}})
  const config = await systemConfigService.getCurrentConfig();
  const users = await userService.readMany({});

  const can = {
    edit: await authService.can(
      currentUser?.id as string,
      SystemConfigActions.Edit
    ),
    reset: await authService.can(
      currentUser?.id as string,
      SystemConfigActions.Reset
    ),
  };

  return Response.json({ config, users, can });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authService.requireUser(request,{condition: {all:[SystemConfigActions.Edit,SystemConfigActions.Reset]}});
  const formData = await request.formData();
  const updatedConfig = JSON.parse(formData.get("config") as string);

  try {
    await systemConfigService.updateConfig(updatedConfig);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour de la configuration." });
  }
};

export default function SystemConfig() {
  const { config, users, can } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(config);
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsEditing(false);
      if (fetcher.data.success) {
        setAlert({
          message: "Configuration mise à jour avec succès.",
          type: "success",
        });
      } else {
        setAlert({
          message: `Erreur lors de la mise à jour: ${fetcher.data.error}`,
          type: "error",
        });
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleNotificationUpdate = (notifications) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, notifications },
    }));
  };

  const handleBonusCalculationUpdate = (bonusCalculation) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, bonusCalculation },
    }));
  };

  const handleLocationUpdate = (location) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, location },
    }));
  };

  const handleEmployeeOfTheMonthUpdate = (employeeOfTheMonth) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, employeeOfTheMonth },
    }));
  };

  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };

  const confirmSubmit = () => {
    setShowConfirmDialog(false);
    fetcher.submit({ config: JSON.stringify(formData) }, { method: "post" });
  };

  const ActionButtons = () => (
    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 my-6">
      <Button
        onClick={() => setIsEditing(false)}
        variant="outline"
        className="w-full sm:w-auto h-12 text-base"
      >
        Annuler
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={fetcher.state === "submitting"}
        className="w-full sm:w-auto h-12 text-base"
      >
        {fetcher.state === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Enregistrement...
          </span>
        ) : (
          "Enregistrer"
        )}
      </Button>
    </div>
  );

  const LocationSettings = ({ location, onUpdate }) => {
    const [geoError, setGeoError] = useState(null);

    const handleChange = (e) => {
      const { name, value } = e.target;
      onUpdate({ ...location, [name]: value });
    };

    const getCurrentLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onUpdate({
              ...location,
              latitude: position.coords.latitude.toFixed(6),
              longitude: position.coords.longitude.toFixed(6),
            });
            setGeoError(null);
          },
          (error) => {
            console.error("Error getting location:", error);
            setGeoError(
              "Impossible d'obtenir la localisation. Veuillez vérifier vos paramètres de géolocalisation."
            );
          }
        );
      } else {
        setGeoError(
          "La géolocalisation n'est pas supportée par votre navigateur."
        );
      }
    };

    return (
      <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Alert variant={"destructive"}>
          <AlertDescription>
            Attention : La localisation doit être celle de la pharmacie, pas
            votre position actuelle.
          </AlertDescription>
        </Alert>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            type="number"
            id="latitude"
            name="latitude"
            value={location.latitude}
            onChange={handleChange}
            step="any"
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            type="number"
            id="longitude"
            name="longitude"
            value={location.longitude}
            onChange={handleChange}
            step="any"
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="radius">Rayon (mètres)</Label>
          <Input
            type="number"
            id="radius"
            name="radius"
            value={location.radius}
            onChange={handleChange}
          />
        </div>
        <Button onClick={getCurrentLocation} className="w-full sm:w-auto">
          <MapPin className="mr-2 h-4 w-4" /> Utiliser ma position actuelle
        </Button>
        {geoError && (
          <Alert variant="destructive">
            <AlertDescription>{geoError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
        Configuration du Système
      </h1>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-6"
        >
          {alert.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <AlertTitle className="text-base font-medium">
            {alert.type === "success" ? "Succès" : "Erreur"}
          </AlertTitle>
          <AlertDescription className="text-base">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <>
          {can?.edit && <ActionButtons />}

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger
                value="notifications"
                className="text-base data-[state=active]:text-base"
              >
                Notif.
              </TabsTrigger>
              <TabsTrigger
                value="bonus"
                className="text-base data-[state=active]:text-base"
              >
                Primes
              </TabsTrigger>
              <TabsTrigger
                value="location"
                className="text-base data-[state=active]:text-base"
              >
                Lieux
              </TabsTrigger>
              <TabsTrigger
                value="employeeOfTheMonth"
                className="text-base data-[state=active]:text-base"
              >
                Empl. du Mois
              </TabsTrigger>
            </TabsList>
            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings
                notifications={formData.settings.notifications}
                users={users}
                onUpdate={handleNotificationUpdate}
              />
            </TabsContent>
            <TabsContent value="bonus" className="space-y-6">
              <BonusCalculationSettings
                bonusCalculation={formData.settings.bonusCalculation}
                onUpdate={handleBonusCalculationUpdate}
              />
            </TabsContent>
            <TabsContent value="location" className="space-y-6">
              <LocationSettings
                location={
                  formData.settings.location || {
                    latitude: "",
                    longitude: "",
                    radius: 100,
                  }
                }
                onUpdate={handleLocationUpdate}
              />
            </TabsContent>
            <TabsContent value="employeeOfTheMonth" className="space-y-6">
              <EmployeeOfTheMonthSettings
                employeeOfTheMonth={formData.settings.employeeOfTheMonth}
                users={users}
                onUpdate={handleEmployeeOfTheMonthUpdate}
              />
            </TabsContent>
          </Tabs>
          <ActionButtons />
        </>
      ) : (
        <div className="space-y-8">
          {can?.edit && (
            <div className="flex justify-end">
              <Button
                onClick={() => setIsEditing(true)}
                disabled={fetcher.state === "submitting" || config.isBlocked}
                className="w-full sm:w-auto h-12 text-base"
              >
                {config.isBlocked
                  ? "Edition bloquée par le système"
                  : "Modifier la Configuration"}
              </Button>
            </div>
          )}

          <ConfigDisplay config={config} />
          {can?.edit && (
            <div className="flex justify-center">
              <Button
                onClick={() => setIsEditing(true)}
                disabled={fetcher.state === "submitting" || config.isBlocked}
                className="w-full sm:w-auto h-12 text-base"
              >
                {config.isBlocked
                  ? "Edition bloquée par le système"
                  : "Modifier la Configuration"}
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Confirmer les modifications
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Êtes-vous sûr de vouloir enregistrer ces modifications ? Cette
              action mettra à jour la configuration du système.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-0">
            <AlertDialogCancel className="h-12 text-base">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              className="h-12 text-base"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
