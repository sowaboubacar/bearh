import { useState, useEffect } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";

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
    addToOrUpdateDepartmentMemberships: "Mise à jour des membres du département",
    addToOrUpdateTeamMemberships: "Mise à jour des membres de l'équipe",
    addToOrUpdatePositionMemberships: "Mise à jour des postes",
    addToOrUpdateHourGroupMemberships: "Mise à jour des groupes horaires",
    accessControlUpdate: "Mise à jour du contrôle d'accès",
    accessControlAssignedToUser: "Contrôle d'accès assigné à un utilisateur",
    accessControlAssignedToPosition: "Contrôle d'accès assigné à un poste",
  };
  return translations[key] || key;
};

export function NotificationSettings({ notifications, users, onUpdate }) {
  const [settings, setSettings] = useState(notifications);

  useEffect(() => {
    setSettings(notifications);
  }, [notifications]);

  const handleCheckboxChange = (notificationType, userId) => {
    const updatedSettings = { ...settings };
    const recipients = updatedSettings[notificationType].recipients;
    const index = recipients.indexOf(userId); // Changed: Look for userId directly
    
    if (index > -1) {
      recipients.splice(index, 1);
    } else {
      recipients.push(userId); // Changed: Push userId directly, not an object
    }
    
    setSettings(updatedSettings);
    onUpdate(updatedSettings);
  };

  const isIncluded = (value, user) => {
    return value.recipients.includes(user.id); // Changed: Check for id directly
  };

  return (
    <Card className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold">
          Paramètres de Notification
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Configurez qui reçoit des notifications pour divers événements.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="space-y-3">
            <Label className="text-base font-medium">
              {translateNotificationKey(key)}
            </Label>
            <Card className="shadow-none border">
              <ScrollArea className="h-[300px] w-full rounded-md">
                <div className="p-4">
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center space-x-3 py-3 border-b last:border-0"
                    >
                      <Checkbox
                        id={`${key}-${user.id}`}
                        checked={isIncluded(value, user)}
                        onCheckedChange={() => handleCheckboxChange(key, user.id)}
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
        ))}
      </CardContent>
    </Card>
  );
}

