import { useLoaderData, Link, useNavigation } from "@remix-run/react";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { UserHeader } from "~/components/users/UserHeader";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { userService } from "~/services/user.service.server";
import { authService } from "~/services/auth.service.server";
import { UserSectionsGrid } from "~/components/users/UserSectionsGrid";
import { UserPageSkeleton } from "~/components/users/UserPageSkeleton";
import { employeeOfTheMonthService } from "~/services/employeeOfTheMonth.service.server";
import { userSections } from "~/datas/userSections";
import {  UserActions } from "~/core/entities/utils/access-permission";

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const currentLoggedUser = await authService.requireUser(request, {
    condition: { any: [UserActions.View, UserActions.ViewOwn] }
  });

  const user = await userService.readOne({
    id: params.id as string,
    populate: "avatar,access,currentBonusCategory,currentPosition,currentDepartment,currentHourGroup,currentTeam,documents",
  });

  if (!user) {
    throw Response.json({ message: "Utilisateur non trouvé" }, { status: 404 });
  }

  // Check if user has permission to view this specific user
  const hasFullViewAccess = await authService.can(currentLoggedUser.id, UserActions.View);
  const canViewOwn = await authService.can(currentLoggedUser.id, UserActions.ViewOwn, {
    resourceOwnerId: user.id,
    targetUserId: currentLoggedUser.id
  });

  if (!hasFullViewAccess && !canViewOwn) {
    throw Response.json({ message: "Accès non autorisé" }, { status: 403 });
  }

  const isWinner = await employeeOfTheMonthService.isWinnerForPeriod(user.id);

  // First, let's define all the permission checks
  const permissionChecks = await Promise.all([
    // Basic user actions
    authService.can(currentLoggedUser.id, UserActions.Create),
    authService.can(currentLoggedUser.id, {
      any: [UserActions.Edit, UserActions.EditOwn]
    }, {
      resourceOwnerId: user.id,
      targetUserId: currentLoggedUser.id
    }),
    authService.can(currentLoggedUser.id, {
      any: [UserActions.Delete, UserActions.DeleteOwn]
    }, {
      resourceOwnerId: user.id,
      targetUserId: currentLoggedUser.id
    }),
    authService.can(currentLoggedUser.id, {
      any: [UserActions.View, UserActions.ViewOwn]
    }, {
      resourceOwnerId: user.id,
      targetUserId: currentLoggedUser.id
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

    // Profile insights
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileAttendanceInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfilePositionsInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileDepartmentsInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileHourGroupsInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileTeamsInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfilePrimeInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileDocumentInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileObservationInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileKpiInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileTaskInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOwnOnProfileVideoInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOnProfileExpenseInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOneProfileNotesInsight),
    authService.can(currentLoggedUser.id, UserActions.ViewOneProfileMonthlyReportInsight),
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
    ViewOnProfileAttendanceInsight,
    ViewOnProfilePositionsInsight,
    ViewOnProfileDepartmentsInsight,
    ViewOnProfileHourGroupsInsight,
    ViewOnProfileTeamsInsight,
    ViewOnProfilePrimeInsight,
    ViewOnProfileDocumentInsight,
    ViewOnProfileObservationInsight,
    ViewOnProfileKpiInsight,
    ViewOnProfileTaskInsight,
    ViewOwnOnProfileVideoInsight,
    ViewOnProfileExpenseInsight,
    ViewOneProfileNotesInsight,
    ViewOneProfileMonthlyReportInsight,
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
    ViewOnProfileAttendanceInsight,
    ViewOnProfilePositionsInsight,
    ViewOnProfileDepartmentsInsight,
    ViewOnProfileHourGroupsInsight,
    ViewOnProfileTeamsInsight,
    ViewOnProfilePrimeInsight,
    ViewOnProfileDocumentInsight,
    ViewOnProfileObservationInsight,
    ViewOnProfileKpiInsight,
    ViewOnProfileTaskInsight,
    ViewOwnOnProfileVideoInsight,
    ViewOnProfileExpenseInsight,
    ViewOneProfileNotesInsight,
    ViewOneProfileMonthlyReportInsight,
  };

  return Response.json({ user, isWinner, can });
};

export default function UserProfile() {
  const { user , isWinner, can} = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  

  return isLoading ? (
    <UserPageSkeleton />
  ) : (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        
        {can?.list && (
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto h-12 text-base"
        >
          <Link prefetch="intent" to="/o/users">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour à la liste
          </Link>
        </Button>
        )}

        {can?.edit && (
          <Button asChild className="w-full sm:w-auto h-12 text-base">
          <Link prefetch="intent" to={`/o/users/edit/${user.id}`}>
            <Edit className="mr-2 h-5 w-5" />
            Modifier l'utilisateur
          </Link>
        </Button>
        )}

        
      </div>

      <div className="mb-8">
        <UserHeader user={user} isWinner={isWinner} />
      </div>

      {/* Page Title */}
          <h1 className="text-3xl font-bold mt-4 mb-2 text-center">
            Sections de l'utilisateur
          </h1>
      

      {/* Sections Grid */}
      <UserSectionsGrid userId={user.id}  userSections={userSections} can={can}/>
    </div> 
  );
}
