/* eslint-disable @typescript-eslint/no-explicit-any */
import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { formatDateToFrenchWithTime } from "~/utils/dateFormatting";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ArrowLeft, ArrowRight, Briefcase, Users } from "lucide-react";
import { userService } from "~/services/user.service.server";
import { departmentService } from "~/services/department.service.server";
import { CompactUserHeader } from "~/components/users/CompactUserHeader";
import { Button } from "~/components/ui/button";
import { IDepartment } from "~/core/entities/department.entity.server";
import { motion } from "framer-motion";
import { authService } from "~/services/auth.service.server";
import { DepartmentActions, UserActions } from "~/core/entities/utils/access-permission";


export async function loader({ params, request }: LoaderFunctionArgs) {
  const currentLoggedUser = await authService.requireUser(request, {condition: UserActions.ViewOnProfileDepartmentsInsight});
  const userId = params.id;
  if (!userId) {
    throw new Response("User ID not provided", { status: 400 });
  }

  // Fetch the user with currentDepartment and departmentsTraces
  const user = await userService.readOne({
    id: userId,
    populate: "avatar,currentDepartment,currentPosition",
  });
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

    const can =  {
      view: await authService.can(currentLoggedUser?.id as string, UserActions.View),
      department: {
        view: await authService.can(currentLoggedUser?.id as string, DepartmentActions.View)
      }
    }

  const { currentDepartment: currentDepartmentData, departmentsTraces } = user;

  // Fetch history departments (if any)
  let historyDepartments: IDepartment[] = [];
  if (departmentsTraces && departmentsTraces.length > 0) {
    const departmentIds = departmentsTraces.map((trace) => trace.department);
    historyDepartments = await departmentService.readMany(
      { _id: { $in: departmentIds } },
      {
        sort: { createdAt: -1 },
      }
    );

    const departmentsTracesData = departmentsTraces.map((trace) => {
      const departmentData = historyDepartments.find(
        (pos) => pos._id.toString() === trace.department?.toString()
      );
      return { departmentData, at: trace.at };
    });

    // Sort the datas by  at date fields
    departmentsTracesData.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    return Response.json({ user, currentDepartmentData, departmentsTracesData, can });
  }

  return Response.json({ user, currentDepartmentData, departmentsTracesData: [], can });
}
export default function UserDepartmentsPage() {
  const { user, currentDepartmentData, departmentsTracesData, can } =
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
          Appartenances aux Departements
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
              Departement Actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentDepartmentData ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Badge variant="secondary" className="text-sm px-2 py-1">
                  Actuelle
                </Badge>
                <div>
                  <p className="font-medium text-lg text-primary">
                    {can?.department?.view ? (
                    <Link prefetch="intent" to={`/o/departments/view/${currentDepartmentData.id}`}>
                      {currentDepartmentData.name}
                    </Link>
                    ): (
                      <span className="text-muted-foreground">{currentDepartmentData.name}</span>
                    )}
                  </p>
                  <small className="text-sm text-muted-foreground mt-1 flex">
                    <Users className="mr-2 h-4 w-4" /> Avec{" "}
                    {currentDepartmentData.members.length} autre(s) personne(s)
                    dans ce département
                  </small>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune departement actuel.
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
              Historique des Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentsTracesData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun historique de departments.
              </p>
            ) : (
              <ul className="space-y-6">
                {departmentsTracesData.map((trace: any, i: number) => (
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
                      {trace.departmentData ? (
                        <div>
                          <p className="font-medium text-lg text-primary">
                            {can?.department?.view ? (
                          <Link prefetch="intent" to={`/o/departments/view/${trace.departmentData.id}`}>
                            {trace.departmentData.name}
                          </Link>
                            ): (
                              <span className="text-muted-foreground">{trace.departmentData.name}</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Accédé le {formatDateToFrenchWithTime(trace.at)}
                          </p>
                          <small className="text-sm text-muted-foreground mt-1 flex ">
                            <Users className="mr-2 h-4 w-4" />
                            {trace.departmentData.members.length} autre(s)
                            personne(s) appartiennent aussi à cette fiche de
                            poste
                          </small>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">
                          Department introuvable
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
