import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { IPosition } from "~/core/entities/position.entity.server";

interface UserPositionProps {
  position: IPosition;
}

export function UserPosition({ position }: UserPositionProps) {

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Poste actuel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {position && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Titre du poste
              </h3>
              <p className="text-base">
                {position.title}
              </p>
            </div>
            
            {position.description && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Description
                </h3>
                <p className="text-base">
                  {position.description}
                </p>
              </div>
            )}
            
            {position.attachments && position.attachments.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Pièces jointes
                </h3>
                <p className="text-base">
                  {position.attachments.length} document(s) attaché(s)
                </p>
              </div>
            )}
            
            {position.members && position.members.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Membres
                </h3>
                <p className="text-base">
                  {position.members.length} membre(s) associé(s)
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );  
}
