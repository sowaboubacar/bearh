import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { ITeam } from "~/core/entities/team.entity.server";

interface UserTeamProps {
  team: ITeam;
}

export function UserTeam({ team }: UserTeamProps) {


  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Équipe
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {team && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Nom de l'équipe
              </h3>
              <p className="text-base">{team.name}</p>
            </div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Description
              </h3>
              <p className="text-base">{team.description}</p>
            </div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3">
                Leader de l'équipe
              </h3>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage
                    src={team.leader?.avatar || ""}
                    alt={`${team.leader?.firstName || ""} ${
                      team.leader?.lastName || ""
                    }`}
                  />
                  <AvatarFallback className="text-base">
                    {team.leader?.firstName?.[0] || ""}
                    {team.leader?.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <span className="text-base">
                  {team.leader?.firstName} {team.leader?.lastName}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4">
                Membres de l'équipe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.members?.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage
                        src={member.avatar || ""}
                        alt={`${member.firstName || ""} ${
                          member.lastName || ""
                        }`}
                      />
                      <AvatarFallback className="text-base">
                        {member.firstName?.[0] || ""}
                        {member.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base">
                      {member.firstName} {member.lastName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );  
}
