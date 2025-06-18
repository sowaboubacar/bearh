/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, ArrowRight, Briefcase, Users } from "lucide-react";
import { userService } from "~/services/user.service.server";
import { positionService } from "~/services/position.service.server";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { IPosition } from "~/core/entities/position.entity.server";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { PositionActions, UserActions } from "~/core/entities/utils/access-permission";

/**
 * This route displays the user's current position and the history of positions they have held.
 *
 * Steps:
 * 1. Fetch the user by the :id param.
 * 2. Extract user.currentPosition (ObjectId) and user.positionsTraces (Array<{position:ObjectId, at:Date}>).
 * 3. Use positionService to fetch the current position details.
 * 4. Use positionService to fetch all positions from positionsTraces.
 * 5. Render a page showing:
 *    - The current position (highlighted at the top).
 *    - A history (timeline or list) of all past positions with the date the user joined them.
 */

export async function loader({ params , request}: LoaderFunctionArgs) {
  const currentLoggedUser = await authService.requireUser(request, {condition: UserActions.ViewOnProfilePositionsInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentPosition and positionsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const { currentPosition: currentPositionData, positionsTraces } = user;

  const can =  {
    view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
    positions: {
      view: await authService.can(currentLoggedUser?.id as string, PositionActions.View)
    }
  }

  // Fetch history positions (if any)
  let historyPositions: IPosition[] = [];
  if (positionsTraces && positionsTraces.length > 0) {
    const positionIds = positionsTraces.map((trace) => trace.position);
    historyPositions = await positionService.readMany(
      { _id: { $in: positionIds } },
      {
        sort: { createdAt: -1 },
      }
    );

    const positionsTracesData = positionsTraces.map((trace) => {
      const positionData = historyPositions.find(
        (pos) => pos._id.toString() === trace.position?.toString()
      );
      return { positionData, at: trace.at };
    });

    // Sort the datas by  at date fields
    positionsTracesData.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    return Response.json({ user, currentPositionData, positionsTracesData, can });
  }

  return Response.json({ user, currentPositionData, positionsTracesData: [], can });
}
export default function UserPositionsPage() {
  const { user, currentPositionData, positionsTracesData, can } =
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
        <CompactUserHeader user={user} can={can} />
        <h1 className="text-3xl font-bold mt-4 text-center">
          Postes & Évolution Professionnelle
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
              Position Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPositionData ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Badge variant="secondary" className="text-sm px-2 py-1">
                  Actuelle
                </Badge>
                <div>
                  <p className="font-medium text-lg text-primary">
                    {can?.positions?.view ? (
                      <Link prefetch="intent" to={`/o/positions/view/${currentPositionData.id}`}>
                        {currentPositionData.title}
                      </Link>
                    ): (
                      <span>{currentPositionData.title}</span>
                    )}
                  </p>
                  <small className="text-sm text-muted-foreground mt-1 flex">
                    <Users className="mr-2 h-4 w-4" /> Avec{" "}
                    {currentPositionData.members.length} autre(s) personne(s)
                    dans cette fiche de poste
                  </small>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune position actuelle.
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
              Historique des Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {positionsTracesData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun historique de positions.
              </p>
            ) : (
              <ul className="space-y-6">
                {positionsTracesData.map((trace: any, i: number) => (
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
                      {trace.positionData ? (
                        <div>
                          <p className="font-medium text-lg text-primary">
                            {can?.positions?.view ? (
                              <Link prefetch="intent" to={`/o/positions/view/${trace.positionData.id}`}>
                                {trace.positionData.title}
                              </Link>
                            ): (
                              <span>{trace.positionData.title}</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Accédé le {formatDateToFrenchWithTime(trace.at)}
                          </p>
                          <small className="text-sm text-muted-foreground mt-1 flex ">
                            <Users className="mr-2 h-4 w-4" />
                            {trace.positionData.members.length} autre(s)
                            personne(s) appartiennent aussi à cette fiche de
                            poste
                          </small>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">
                          Position introuvable
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
