/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, ArrowRight, Briefcase, Users } from "lucide-react";
import { userService } from "~/services/user.service.server";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { IHourGroup } from "~/core/entities/hourGroup.entity.server";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { HourGroupActions, UserActions } from "~/core/entities/utils/access-permission";

/**
 * This route displays the user's current hourGroup and the history of hourGroups they have held.
 *
 * Steps:
 * 1. Fetch the user by the :id param.
 * 2. Extract user.currentHourGroup (ObjectId) and user.hourGroupsTraces (Array<{hourGroup:ObjectId, at:Date}>).
 * 3. Use hourGroupService to fetch the current hourGroup details.
 * 4. Use hourGroupService to fetch all hourGroups from hourGroupsTraces.
 * 5. Render a page showing:
 *    - The current hourGroup (highlighted at the top).
 *    - A history (timeline or list) of all past hourGroups with the date the user joined them.
 */

export async function loader({ params, request }: LoaderFunctionArgs) {
  const currentLoggedUser  = await authService.requireUser(request, {condition: UserActions.ViewOnProfileHourGroupsInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentHourGroup and hourGroupsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentHourGroup,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const { currentHourGroup: currentHourGroupData, hourGroupsTraces } = user;

  const can =  {
    view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
    hourGroup: {
      view: await authService.can(currentLoggedUser?.id as string, HourGroupActions.View)
    }
  }

  // Fetch history hourGroups (if any)
  let historyHourGroups: IHourGroup[] = [];
  if (hourGroupsTraces && hourGroupsTraces.length > 0) {
    const hourGroupIds = hourGroupsTraces.map((trace) => trace.hourGroup);
    historyHourGroups = await hourGroupService.readMany(
      { _id: { $in: hourGroupIds } },
      {
        sort: { createdAt: -1 },
      }
    );

    const hourGroupsTracesData = hourGroupsTraces.map((trace) => {
      const hourGroupData = historyHourGroups.find(
        (pos) => pos._id.toString() === trace.hourGroup?.toString()
      );
      return { hourGroupData, at: trace.at };
    });

    // Sort the datas by  at date fields
    hourGroupsTracesData.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    return Response.json({ user, currentHourGroupData, hourGroupsTracesData, can });
  }

  return Response.json({
    user,
    currentHourGroupData,
    hourGroupsTracesData: [],
    can
  });
}
export default function UserHourGroupsPage() {
  const { user, currentHourGroupData, hourGroupsTracesData, can} =
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
          Empoi du temps & Programmation
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
              Programme Actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentHourGroupData ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Badge variant="secondary" className="text-sm px-2 py-1">
                  Actuellement
                </Badge>
                <div>
                  <p className="font-medium text-lg text-primary">
                    {can?.hourGroup?.view ? (
                    <Link
                      prefetch="intent"
                      to={`/o/hour-group/view/${currentHourGroupData.id}`}
                    >
                      {currentHourGroupData.name}
                    </Link>
                    ): (<span>{currentHourGroupData.name}</span>)}
                  </p>
                  <small className="text-sm text-muted-foreground mt-1 flex">
                    <Users className="mr-2 h-4 w-4" /> Avec{" "}
                    {currentHourGroupData.members.length} autre(s) personne(s)
                    sur ce programme
                  </small>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun programme actuel.
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
              Historique des Programmations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hourGroupsTracesData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun historique des Programmations.
              </p>
            ) : (
              <ul className="space-y-6">
                {hourGroupsTracesData.map((trace: any, i: number) => (
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
                      {trace.hourGroupData ? (
                        <div>
                          <p className="font-medium text-lg text-primary">

                            {can?.hourGroup?.view ? (
                            <Link
                              prefetch="intent"
                              to={`/o/hour-group/view/${trace.hourGroupData.id}`}
                            >
                              {trace.hourGroupData.name}
                            </Link>
                            ): (
                              <span>{trace.hourGroupData.name}</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Depuis le {formatDateToFrenchWithTime(trace.at)}
                          </p>
                          <small className="text-sm text-muted-foreground mt-1 flex ">
                            <Users className="mr-2 h-4 w-4" />
                            {trace.hourGroupData.members.length} autre(s)
                            personne(s) sont aussi à sur ce programme
                          </small>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">
                          Programmation introuvable
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
