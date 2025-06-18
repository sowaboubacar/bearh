import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

const frequencyOptions = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "semi-annually", label: "Semestriel" },
  { value: "annually", label: "Annuel" },
];

export function BonusCalculationSettings({ bonusCalculation, onUpdate }) {
  const [settings, setSettings] = useState(bonusCalculation);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const updatedSettings = { ...settings, [name]: value };
    setSettings(updatedSettings);
    onUpdate(updatedSettings);
  };

  const handleFrequencyChange = (value) => {
    const updatedSettings = { ...settings, frequency: value };
    setSettings(updatedSettings);
    onUpdate(updatedSettings);
  };

  return (
    <Card className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold">
          Paramètres de Calcul des Primes
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Configurez la fréquence et le moment du calcul des primes.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="space-y-3">
          <Label 
            htmlFor="frequency" 
            className="text-base font-medium"
          >
            Fréquence
          </Label>
          <Select
            name="frequency"
            value={settings.frequency}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Sélectionnez la fréquence" />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-base"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label 
            htmlFor="executionDay" 
            className="text-base font-medium"
          >
            Jour d'Exécution
          </Label>
          <Input
            id="executionDay"
            name="executionDay"
            type="number"
            min="1"
            max={28}
            value={settings.executionDay}
            onChange={handleInputChange}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-3">
          <Label 
            htmlFor="executionTime" 
            className="text-base font-medium"
          >
            Heure d'Exécution
          </Label>
          <Input
            id="executionTime"
            name="executionTime"
            type="time"
            value={settings.executionTime}
            onChange={handleInputChange}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            Prochaine Exécution
          </Label>
          <Input
            value={new Date(settings.nextExecutionDate).toLocaleString('fr-FR')}
            disabled
            className="h-12 text-base bg-muted"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            Dernière Exécution
          </Label>
          <Input
            value={new Date(settings.lastExecutionDate).toLocaleString('fr-FR')}
            disabled
            className="h-12 text-base bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  );
}

