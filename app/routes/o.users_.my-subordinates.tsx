import { useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { LoaderFunction, redirect } from "@remix-run/node";
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
import { UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({ request }) => {
  const currentLoggedUser = await authService.requireUser(request, {condition: {any: [UserActions.List] }});
  const users = await userService.readMany(
    {
      supervisors: currentLoggedUser.id,
    },
    {
      populate: "documents,supervisors,access,avatar",
      sort: { updatedAt: -1 },
    }
  );

  const can = {
    create: await authService.can(currentLoggedUser?.id as string, UserActions.Create),
    edit: await authService.can(currentLoggedUser?.id as string, {any: [UserActions.Edit, UserActions.EditOwn]} ),
    delete: await authService.can(currentLoggedUser?.id as string, {any: [UserActions.Delete, UserActions.DeleteOwn]} ),
    view: await authService.can(currentLoggedUser?.id as string, {any: [UserActions.View, UserActions.ViewOwn]} ),
    quickMakeObservation: await authService.can(currentLoggedUser?.id as string, UserActions.QuickMakeObservation),
    quickMakeKpiEvaluation: await authService.can(currentLoggedUser?.id as string, UserActions.QuickMakeKpiEvaluation),
    quickAssignTask: await authService.can(currentLoggedUser?.id as string, UserActions.QuickAssignTask),
    quickChangeAccess: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeAccess),
    quickChangePosition: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangePosition),
    quickChangeTeam: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeTeam),
    quickChangeDepartment: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeDepartment),
    quickChangeHourGroup: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeHourGroup),
    quickChangeBonusCategory: await authService.can(currentLoggedUser?.id as string, UserActions.QuickChangeBonusCategory),
  }
  return Response.json({ users, currentLoggedUser });
};

// Action which handle user deletion from the list (userId, _action=delete, expected from the formData)
export const action: LoaderFunction = async ({ request }) => {
  await authService.requireUser(request, {condition: {any: [UserActions.Delete]}});
  const formData = await request.formData();
  const userId = formData.get("userId");
  const action = formData.get("_action");

  if (action === "delete" && userId) {
    await userService.deleteOne(userId as string);
  }

  return redirect("/o/users");
};

export default function EmployeeList() {
  const { users, currentLoggedUser,can } = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const navigate = useNavigate();

  const filteredUsers = useMemo(() => users.length > 0 ? users.filter(
    (user) =>
      (user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === "all" || user.role === roleFilter)
  ) : [], [users, searchTerm, roleFilter]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {currentLoggedUser.firstName} {currentLoggedUser.lastName} - Mes subordonnés
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          Vous avez {users.length} subordonné(s).
        </p>

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

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredUsers.map((user) => (
              <UserCard className="flex flex-col" user={user} key={user.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <UserTable users={filteredUsers} can={can} />
          </div>
        )}
      </div>
    </div>
  );
}
