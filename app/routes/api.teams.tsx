import { ActionFunction } from "@remix-run/node";
import { TeamActions, UserActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { teamService } from "~/services/team.service.server";
import { userService } from "~/services/user.service.server";

export const action: ActionFunction = async ({ request }) => {
  
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  let requiredPermission;

  switch(_action){
    case "quickAssign":
      requiredPermission = UserActions.QuickChangeTeam;
      break;
    default:
      requiredPermission = UserActions.QuickChangeTeam;
  }

  await authService.requireUser(request, {condition: requiredPermission});

  try {
    if (_action === "quickAssign") {
      const userID = formData.get("user") as string;
      const teamID = formData.get("team") as string;
       await teamService.addMember(teamID,userID);
      const updatedUser = await userService.updateCurrentTeam(teamID,userID);
      return Response.json({
        success: true,
        updatedUser,
      });
    } else {
      return Response.json(
        { success: false, error: "Action not supported" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating observation:", error);
    return Response.json(
      { success: false, error: "Échec de la création de l'observation" },
      { status: 400 }
    );
  }
};
