/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Users,
} from "lucide-react";
import { userService } from "~/services/user.service.server";
import { teamService } from "~/services/team.service.server";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { ITeam } from "~/core/entities/team.entity.server";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { TeamActions, UserActions } from "~/core/entities/utils/access-permission";
/**
 * This route displays the user's current team and the history of teams they have held.
 *
 * Steps:
 * 1. Fetch the user by the :id param.
 * 2. Extract user.currentTeam (ObjectId) and user.teamsTraces (Array<{team:ObjectId, at:Date}>).
 * 3. Use teamService to fetch the current team details.
 * 4. Use teamService to fetch all teams from teamsTraces.
 * 5. Render a page showing:
 *    - The current team (highlighted at the top).
 *    - A history (timeline or list) of all past teams with the date the user joined them.
 */

export async function loader({ params, request }: LoaderFunctionArgs) {
  const currentLoggedUser =  await authService.requireUser(request, {condition: UserActions.ViewOnProfileTeamsInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentTeam and teamsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentTeam,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const { currentTeam: currentTeamData, teamsTraces } = user;

  const can =  {
    view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
    team: {
      view: await authService.can(currentLoggedUser?.id as string , {any: [TeamActions.View]})
    }
  }

  // Fetch history teams (if any)
  let historyTeams: ITeam[] = [];
  if (teamsTraces && teamsTraces.length > 0) {
    const teamIds = teamsTraces.map((trace) => trace.team);
    historyTeams = await teamService.readMany(
      { _id: { $in: teamIds } },
      {
        sort: { createdAt: -1 },
      }
    );

    const teamsTracesData = teamsTraces.map((trace) => {
      const teamData = historyTeams.find(
        (team) => team._id.toString() === trace.team?.toString()
      );
      return { teamData, at: trace.at };
    });

    // Sort the datas by  at date fields
    teamsTracesData.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
    return Response.json({ user, currentTeamData, teamsTracesData, can });
  }

  return Response.json({ user, currentTeamData, teamsTracesData: [], can });
}
export default function UserTeamsPage() {
  const { user, currentTeamData, teamsTracesData, can } =
    useLoaderData<typeof loader>();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 space-y-6 max-w-4xl"
    >
      

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <CompactUserHeader user={user} can={can}/>
        <h1 className="text-3xl font-bold mt-4 text-center">
          Equipes & Historique d'appartenance aux équipes
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              Equipe Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentTeamData ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Badge variant="secondary" className="text-sm px-2 py-1">
                  Actuelle
                </Badge>
                <div>
                  <p className="font-medium text-lg text-primary">
                  {can?.team?.view ? (
                  <Link prefetch="intent" to={`/o/teams/view/${currentTeamData.id}`}>
                    {currentTeamData.name}
                  </Link>
                  ): (<span>{currentTeamData.name}</span>)}
                  </p>
                  <small className="text-sm text-muted-foreground mt-1 flex">
                    <Users className="mr-2 h-4 w-4" /> Avec{" "}
                    {currentTeamData.members.length} autre(s) personne(s) dans
                    cette équipe
                  </small>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ne fais partie d'aucune équipe.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Separator className="my-8" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <ArrowRight className="mr-2 h-5 w-5 text-primary" />
              Historique des appartenances aux équipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamsTracesData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun historique d'appartenances aux équipes.
              </p>
            ) : (
              <ul className="space-y-6">
                {teamsTracesData.map((trace: any, i: number) => (
                  <motion.li
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <ArrowRight className="text-primary h-5 w-5" />
                      </div>
                      {trace.teamData ? (
                        <div>
                          <p className="font-medium text-lg text-primary">
                          {can?.team?.view ? (
                          <Link prefetch="intent" to={`/o/teams/view/${trace.teamData.id}`}>
                            {trace.teamData.name}
                          </Link>
                          ): (<span>{trace.teamData.name}</span>)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Rejoint le {formatDateToFrenchWithTime(trace.at)}
                          </p>
                          <small className="text-sm text-muted-foreground mt-1 flex ">
                            <Users className="mr-2 h-4 w-4" />
                            {currentTeamData.members.length} autre(s)
                            personne(s) appartiennent aussi à cette équipe
                          </small>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">
                          Equipe introuvable
                        </p>
                      )}
                    </div>
                    <hr className="text-center" />
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
