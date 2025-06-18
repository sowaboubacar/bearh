import type { ISystemConfig } from "~/core/entities/systemConfig.entity.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";

const translateNotificationKey = (key: string) => {
  const translations = {
    checkIn: "Pointage d'arrivée",
    checkOut: "Pointage de départ",
    breakStart: "Début de pause",
    breakEnd: "Fin de pause",
    permission: "Demande de permission",
    permissionApproved: "Permission approuvée",
    permissionRejected: "Permission rejetée",
    news: "Nouvelles",
    observation: "Observation",
    taskAssigned: "Tâche assignée",
    taskCompleted: "Tâche terminée",
    expenseRequest: "Demande de remboursement",
    expenseRequestApproved: "Remboursement approuvé",
    expenseRequestRejected: "Remboursement rejeté",
    guardTourUpdate: "Mise à jour du tour de garde",
    evaluateAnEmployee: "Évaluation d'un employé",
    addToOrUpdateDepartmentMemberships:
      "Mise à jour des membres du département",
    addToOrUpdateTeamMemberships: "Mise à jour des membres de l'équipe",
    addToOrUpdatePositionMemberships: "Mise à jour des postes",
    addToOrUpdateHourGroupMemberships: "Mise à jour des groupes horaires",
    accessControlUpdate: "Mise à jour du contrôle d'accès",
    accessControlAssignedToUser: "Contrôle d'accès assigné à un utilisateur",
    accessControlAssignedToPosition: "Contrôle d'accès assigné à un poste",
  };
  return translations[key] || key;
};
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

const translateNotificationType = (type: string) => {
  const translations = {
    voters: "Votants",
    news: "Nouvelles",
    winner: "Gagnant",
    loser: "Perdant",
    others: "Autres",
  };
  return translations[type] || type;
};

const translateFrequency = (frequency: string) => {
  const translations = {
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    quarterly: "Trimestriel",
    "semi-annually": "Semestriel",
    annually: "Annuel",
  };
  return translations[frequency] || frequency;
};

export function ConfigDisplay({ config }: { config: ISystemConfig }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Paramètres de Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base whitespace-nowrap">
                    Type de Notification
                  </TableHead>
                  <TableHead className="text-base">Destinataires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(config.settings.notifications).map(
                  ([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="text-base font-medium whitespace-nowrap">
                        {translateNotificationKey(key)}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="flex flex-wrap gap-2">
                          {value.recipients.length > 0 ? (
                            value.recipients.map((recipient, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-base px-3 py-1"
                              >
                                {recipient.email}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-base text-muted-foreground">
                              Aucun
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Paramètres de Calcul des Primes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Fréquence
                  </TableCell>
                  <TableCell className="text-base">
                    {translateFrequency(
                      config.settings.bonusCalculation.frequency
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Jour d'Exécution
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.bonusCalculation.executionDay}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Heure d'Exécution
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.bonusCalculation.executionTime}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Prochaine Exécution
                  </TableCell>
                  <TableCell className="text-base">
                    {new Date(
                      config.settings.bonusCalculation.nextExecutionDate
                    ).toLocaleString("fr-FR")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Dernière Exécution
                  </TableCell>
                  <TableCell className="text-base">
                    {new Date(
                      config.settings.bonusCalculation.lastExecutionDate
                    ).toLocaleString("fr-FR")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Paramètres de Localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Latitude
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.location?.latitude || "Non défini"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Longitude
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.location?.longitude || "Non défini"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Rayon (mètres)
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.location?.radius || "Non défini"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Paramètres de l'Employé du Mois
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Vote en cours
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.employeeOfTheMonth.isVoteOngoing
                      ? "Oui"
                      : "Non"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Mode de sélection
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.employeeOfTheMonth.selection.mode ===
                    "automatic"
                      ? "Automatique"
                      : config.settings.employeeOfTheMonth.selection.mode ===
                        "manual"
                      ? "Manuel"
                      : "Mixte"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Durée du vote (heures)
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.employeeOfTheMonth.selection.voteDuration}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Jour de sélection automatique
                  </TableCell>
                  <TableCell className="text-base">
                    {
                      config.settings.employeeOfTheMonth.selection
                        .automaticSelectionAndVoteStartDay
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Afficher les votes
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.employeeOfTheMonth.display.showVotes
                      ? "Oui"
                      : "Non"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-base font-medium whitespace-nowrap">
                    Afficher les métriques
                  </TableCell>
                  <TableCell className="text-base">
                    {config.settings.employeeOfTheMonth.display.showMetrics
                      ? "Oui"
                      : "Non"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">Poids des métriques</h4>
            <Table>
              <TableBody>
                {Object.entries(
                  config.settings.employeeOfTheMonth.metricsWeights
                ).map(([metric, weight]) => (
                  <TableRow key={metric}>
                    <TableCell className="text-base font-medium whitespace-nowrap">
                      {translateMetric(metric)}
                    </TableCell>
                    <TableCell className="text-base">{weight}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <h4 className="text-lg font-medium mb-2">
              Paramètres de notification
            </h4>
            <Table>
              <TableBody>
                {Object.entries(
                  config.settings.employeeOfTheMonth.notifications
                ).map(([notificationType, settings]) => (
                  <TableRow key={notificationType}>
                    <TableCell className="text-base font-medium whitespace-nowrap">
                      {translateNotificationType(notificationType)}
                    </TableCell>
                    <TableCell className="text-base">
                      {settings.enabled ? "Activé" : "Désactivé"}
                      {settings.template && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Modèle : {settings.template}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <h4 className="text-lg font-medium mb-2">
              Liste des votants
            </h4>
            <Table>
              <TableBody>
                {config.settings.employeeOfTheMonth?.notifications?.voters?.votersList?.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell className="text-base font-medium whitespace-nowrap">
                      {voter.email}
                    </TableCell>
                    <TableCell className="text-base">
                      {voter.firstName  || ""} {voter.lastName || ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
