import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
const translateMetric = (metric: string) => {
  const translations = {
    positiveObservation: "Observation positive",
    negativeObservation: "Observation négative",
    tasksCompleted: "Tâches terminées",
    kpiAverageScore: "Score moyen KPI",
    workingHours: "Heures travaillées",
    breakHours: "Heures de pause",
    lateDays: "Jours de retard",
    absentDays: "Jours d'absence",
  };
  return translations[metric] || metric;
};

export function EmployeeOfTheMonthSettings({
  employeeOfTheMonth,
  users,
  onUpdate,
}) {
  const handleChange = (field, value) => {
    onUpdate({
      ...employeeOfTheMonth,
      [field]: value,
    });
  };

  const handleNestedChange = (category, field, value) => {
    onUpdate({
      ...employeeOfTheMonth,
      [category]: {
        ...employeeOfTheMonth[category],
        [field]: value,
      },
    });
  };

  const handleCheckboxChange = (userId) => {
    // Update the employeeOfTheMonth.notifications.voters.votersList to include/exclude the userId
    const updatedSettings = { ...employeeOfTheMonth };
    const voters = updatedSettings.notifications.voters.votersList;
    const index = voters.indexOf(userId); // Changed: Look for userId directly

    if (index > -1) {
      voters.splice(index, 1);
    } else {
      voters.push(userId); // Changed: Push userId directly, not an object
    }

    onUpdate(updatedSettings);
  };

  const isIncluded = (user) => {
    // employeeOfTheMonth.notifications.voters.votersList might be a list of user object instead of just the user ID. Take it into account
    return employeeOfTheMonth.notifications.voters.votersList.some(
      (voter) => voter.id === user.id || voter === user.id
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <h3 className="text-2xl font-semibold">Paramètres généraux</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="isVoteOngoing" className="text-lg">
              Vote en cours
            </Label>
            <Switch
              id="isVoteOngoing"
              checked={employeeOfTheMonth.isVoteOngoing}
              disabled
              onCheckedChange={(checked) =>
                handleChange("isVoteOngoing", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-2xl font-semibold">Paramètres de sélection</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="selectionMode" className="text-lg">
              Mode de sélection
            </Label>
            <Select
              value={employeeOfTheMonth.selection.mode}
              onValueChange={(value) =>
                handleNestedChange("selection", "mode", value)
              }
            >
              <SelectTrigger id="selectionMode">
                <SelectValue placeholder="Sélectionner le mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatique</SelectItem>
                <SelectItem value="manual">Manuel</SelectItem>
                <SelectItem value="mixed">Mixte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="voteDuration" className="text-lg">
              Durée du vote (heures).
              <small className="text-sm text-primary">
                Nomination pour chaque 28 du mois à 02h00 du matin
              </small>
            </Label>
            <Input
              type="number"
              id="voteDuration"
              disabled
              value={employeeOfTheMonth.selection.voteDuration}
              onChange={(e) =>
                handleNestedChange(
                  "selection",
                  "voteDuration",
                  Number(e.target.value)
                )
              }
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="automaticSelectionDay" className="text-lg">
              Jour de sélection automatique
              <small className="text-sm text-primary">
                {" "}
                Les votes si applicables, demarrent ce même jour
              </small>
            </Label>
            <Input
              type="number"
              id="automaticSelectionDay"
              disabled
              value={
                employeeOfTheMonth.selection.automaticSelectionAndVoteStartDay
              }
              onChange={(e) =>
                handleNestedChange(
                  "selection",
                  "automaticSelectionAndVoteStartDay",
                  Number(e.target.value)
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-2xl font-semibold">Paramètres d'affichage</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showVotes" className="text-lg">
              Afficher les votes
            </Label>
            <Switch
              id="showVotes"
              checked={employeeOfTheMonth.display.showVotes}
              onCheckedChange={(checked) =>
                handleNestedChange("display", "showVotes", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="showMetrics" className="text-lg">
              Afficher les métriques
            </Label>
            <Switch
              id="showMetrics"
              checked={employeeOfTheMonth.display.showMetrics}
              onCheckedChange={(checked) =>
                handleNestedChange("display", "showMetrics", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-2xl font-semibold">Poids des métriques</h3>
          <small className="text-sm text-primary">
            Ces métriques sont utilisé pour calculter une note finale qui est
            utilisé pour le classement. Pour sélectionner les 5 meilleurs
            employés qui pourront subir un vote ou être automatiquement
            sélectionné.
          </small>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {Object.entries(employeeOfTheMonth.metricsWeights).map(
            ([metric, weight]) => (
              <div key={metric} className="grid w-full items-center gap-2">
                <Label htmlFor={metric} className="text-lg">
                  {translateMetric(metric)}
                </Label>
                <Input
                  type="number"
                  id={metric}
                  value={weight}
                  onChange={(e) =>
                    handleNestedChange(
                      "metricsWeights",
                      metric,
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-2xl font-semibold">Paramètres de notification</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(employeeOfTheMonth.notifications).map(
            ([notificationType, settings]) => (
              <div key={notificationType} className="space-y-4">
                <h4 className="text-xl font-medium capitalize">
                  Notifications {notificationType}
                </h4>
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`${notificationType}Enabled`}
                    className="text-lg"
                  >
                    Activé
                  </Label>
                  <Switch
                    id={`${notificationType}Enabled`}
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      handleNestedChange("notifications", notificationType, {
                        ...settings,
                        enabled: checked,
                      })
                    }
                  />
                </div>
                {settings.template && (
                  <div className="grid w-full items-center gap-2">
                    <Label
                      htmlFor={`${notificationType}Template`}
                      className="text-lg"
                    >
                      Modèle
                    </Label>
                    <Input
                      type="text"
                      id={`${notificationType}Template`}
                      value={settings.template}
                      onChange={(e) =>
                        handleNestedChange("notifications", notificationType, {
                          ...settings,
                          template: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card className="">
        <CardHeader>
          <h3 className="text-2xl font-semibold">Qui peut vôter</h3>
        </CardHeader>
        <ScrollArea className="h-[300px] w-full rounded-md">
          <div className="p-4">
            {users.map((user, key) => (
              <div
                key={user.id}
                className="flex items-center space-x-3 py-3 border-b last:border-0"
              >
                <Checkbox
                  id={`${key}-${user.id}`}
                  checked={isIncluded(user)}
                  onCheckedChange={() => handleCheckboxChange(user.id)}
                  className="h-5 w-5"
                />
                <label
                  htmlFor={`${key}-${user.id}`}
                  className="text-base font-medium cursor-pointer"
                >
                  {user.firstName} {user.lastName}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
