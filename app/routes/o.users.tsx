/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { UserCard } from "~/components/users/UserCard";
import { UserTable } from "~/components/users/UserTable";
import { userService } from "~/services/user.service.server";
import { LayoutGrid, List, Plus } from "lucide-react";
import { authService } from "~/services/auth.service.server";
import { kpiFormService } from "~/services/kpiForm.service.server";
import LoadingSkeleton from "~/components/val/loading-skeleton";
import NoDataMessage from "~/components/val/no-data-message";
import { taskService } from "~/services/task.service.server";
import { accessService } from "~/services/access.service.server";
import { departmentService } from "~/services/department.service.server";
import { bonusCategoryService } from "~/services/bonusCategory.service.server";
import { positionService } from "~/services/position.service.server";
import { teamService } from "~/services/team.service.server";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { employeeOfTheMonthService } from "~/services/employeeOfTheMonth.service.server";
import { UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 6;

  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [UserActions.List] },
  });
  const users = await userService.readManyPaginated(
    {},
    {
      limit,
      page,
      populate:
        "documents,supervisors,access,avatar,currentPosition,currentTeam,currentHourGroup,currentBonusCategory,currentDepartment",
      sortBy: "updatedAt:desc",
    }
  );

  const tasks = await taskService.readMany({});
  const accesses = await accessService.readMany({});
  const departments = await departmentService.readMany({});
  // bonusCategories, positions, teams, hourGroups
  const bonusCategories = await bonusCategoryService.readMany({});
  const positions = await positionService.readMany({});
  const teams = await teamService.readMany({});
  const hourGroups = await hourGroupService.readMany({});

  const kpis = await Promise.all(
    users.results.map((u) => kpiFormService.getApplicableForms(u))
  );
  const wins = await Promise.all(
    users.results.map((u) => employeeOfTheMonthService.isWinnerForPeriod(u.id))
  );
  const applicableKpis: Record<string, any[]> = {};
  const isWinnerRecords: Record<string, any> = {};

  for (let index = 0; index < users.results.length; index++) {
    applicableKpis[users.results[index].id] = kpis[index];
    isWinnerRecords[users.results[index].id] = wins[index];
  }

  // First, let's define all the permission checks
  const permissionChecks = await Promise.all([
    // Basic user actions
    authService.can(currentLoggedUser.id, UserActions.Create),
    authService.can(currentLoggedUser.id, {
      any: [UserActions.Edit, UserActions.EditOwn],
    }),
    authService.can(currentLoggedUser.id, {
      any: [UserActions.Delete, UserActions.DeleteOwn],
    }),
    authService.can(currentLoggedUser.id, {
      any: [UserActions.View, UserActions.ViewOwn],
    }),

    // Quick actions
    authService.can(currentLoggedUser.id, UserActions.QuickMakeObservation),
    authService.can(currentLoggedUser.id, UserActions.QuickMakeKpiEvaluation),
    authService.can(currentLoggedUser.id, UserActions.QuickAssignTask),
    authService.can(currentLoggedUser.id, UserActions.QuickChangeAccess),
    authService.can(currentLoggedUser.id, UserActions.QuickChangePosition),
    authService.can(currentLoggedUser.id, UserActions.QuickChangeTeam),
    authService.can(currentLoggedUser.id, UserActions.QuickChangeDepartment),
    authService.can(currentLoggedUser.id, UserActions.QuickChangeHourGroup),
    authService.can(currentLoggedUser.id, UserActions.QuickChangeBonusCategory),
  ]);

  // Destructure the results in order
  const [
    create,
    edit,
    delete_,
    view,
    quickMakeObservation,
    quickMakeKpiEvaluation,
    quickAssignTask,
    quickChangeAccess,
    quickChangePosition,
    quickChangeTeam,
    quickChangeDepartment,
    quickChangeHourGroup,
    quickChangeBonusCategory,
  ] = permissionChecks;

  const can = {
    create,
    edit,
    delete: delete_,
    view,
    quickMakeObservation,
    quickMakeKpiEvaluation,
    quickAssignTask,
    quickChangeAccess,
    quickChangePosition,
    quickChangeTeam,
    quickChangeDepartment,
    quickChangeHourGroup,
    quickChangeBonusCategory,
  };

  return Response.json({
    users,
    applicableKpis,
    isWinnerRecords,
    tasks,
    accesses,
    departments,
    hourGroups,
    teams,
    positions,
    bonusCategories,
    can,
    page,
    limit,
  });
};

// Action which handle user deletion from the list (userId, _action=delete, expected from the formData)
export const action: LoaderFunction = async ({ request }) => {
  await authService.requireUser(request, {
    condition: { any: [UserActions.Delete] },
  });
  const formData = await request.formData();
  const userId = formData.get("userId");
  const action = formData.get("_action");

  if (action === "delete" && userId) {
    await userService.deleteOne(userId as string);
  }

  return redirect("/o/users");
};

export default function EmployeeList() {
  const {
    users,
    applicableKpis,
    isWinnerRecords,
    tasks,
    accesses,
    departments,
    hourGroups,
    teams,
    positions,
    bonusCategories,
    can,
    page,
    limit,
  } = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const [searchParams] = useSearchParams();

  const filteredUsers = users.results.filter(
    (user) =>
      (user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === "all" || user.role === roleFilter)
  );

  const renderUserCard = (user) => {
    const userKpisForms = applicableKpis[user.id];
    return (
      <UserCard
        className="flex flex-col"
        applicableKpis={userKpisForms}
        tasks={tasks}
        user={user}
        accesses={accesses}
        departments={departments}
        hourGroups={hourGroups}
        teams={teams}
        positions={positions}
        bonusCategories={bonusCategories}
        key={user.id}
        isWinnerRecords={isWinnerRecords[user.id]}
        can={can}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Liste des Employés
          </h1>
          {can.create && (
            <Button
              onClick={() => navigate("/o/users/new")}
              className="w-full sm:w-auto h-12 text-base"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un employe
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-80">
              <Input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 text-base w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-12 text-base w-full sm:w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-base">
                  Tous les rôles
                </SelectItem>
                <SelectItem value="employee" className="text-base">
                  Employé
                </SelectItem>
                <SelectItem value="manager" className="text-base">
                  Manager
                </SelectItem>
                <SelectItem value="admin" className="text-base">
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
              className="flex-1 sm:flex-none h-12 text-base"
            >
              <LayoutGrid className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Grille</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="flex-1 sm:flex-none h-12 text-base"
            >
              <List className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>
        </div>


        {users.results.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (page - 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={page === 1}
              className="w-full sm:w-auto h-12 text-base"
            >
              Précédent
            </Button>
            <span className="text-base">
            Page {page} sur {Math.ceil(users.totalResults / limit)}
          </span>
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (page + 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={users.results.length < limit}
              className="w-full sm:w-auto h-12 text-base"
            >
              Suivant
            </Button>
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton view={viewMode} itemCount={20} />
        ) : users.results.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredUsers.map((user) => renderUserCard(user))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <UserTable
                users={filteredUsers}
                tasks={tasks}
                applicableKpis={applicableKpis}
                accesses={accesses}
                departments={departments}
                hourGroups={hourGroups}
                teams={teams}
                positions={positions}
                bonusCategories={bonusCategories}
                isWinnerRecords={isWinnerRecords}
                can={can}
              />
            </div>
          )
        ) : (
          <NoDataMessage type="Employé" view={viewMode} />
        )}

        {users.results.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (page - 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={page === 1}
              className="w-full sm:w-auto h-12 text-base"
            >
              Précédent
            </Button>
            <span className="text-base">
            Page {page} sur {Math.ceil(users.totalResults / limit)}
          </span>
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("page", (page + 1).toString());
                navigate(`?${params.toString()}`);
              }}
              disabled={users.results.length < limit}
              className="w-full sm:w-auto h-12 text-base"
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
