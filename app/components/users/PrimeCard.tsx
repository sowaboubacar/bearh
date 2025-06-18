// app/components/PrimeCard.tsx

import { FC } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Award, ArrowRight } from "lucide-react";

interface IPrime {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: {
      file: {
        url: string;
      };
    };
  };
  calculationDetails: {
    kpiValue: {
      title: string;
    };
    bonusCategory: {
      title: string;
    };
    observations: string[];
    formula: string;
  };
  startTrackingDate: string; // ISO string
  endTrackingDate: string;   // ISO string
  totalAmount: number;
  calculationDate: string;   // ISO string
}

interface PrimeCardProps {
  prime: IPrime;
}

export const PrimeCard: FC<PrimeCardProps> = ({ prime }) => {
  return (
    <Card className="bg-white border shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center text-lg font-bold">
          <Award className="mr-3 h-5 w-5" />
          <div className="space-y-1">
            <div>
              Prime de {prime.user.firstName} {prime.user.lastName}
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              {new Date(prime.startTrackingDate).toLocaleDateString()} -{" "}
              {new Date(prime.endTrackingDate).toLocaleDateString()}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Montant total: {prime.totalAmount.toFixed(2)} F CFA
          </p>
          <p className="text-sm text-muted-foreground">
            Date de calcul: {new Date(prime.calculationDate).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-3">
          <h5 className="text-md font-semibold text-center">Details du Calcul</h5>
          <ol className="space-y-2 text-sm">
            <li>
              <span className="font-medium">KPIs:</span>{" "}
              {prime.calculationDetails.kpiValue.title}
            </li>
            <li>
              <span className="font-medium">Catégorie:</span>{" "}
              {prime.calculationDetails.bonusCategory.title}
            </li>
            <li>
              <span className="font-medium">Remarques:</span>{" "}
              {prime.calculationDetails.observations.length} Remarque(s)
            </li>
            {/* <li className="pt-1">
              <span className="font-medium">Formule:</span>{" "}
              <i>{prime.calculationDetails.formula}</i>
            </li> */}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
