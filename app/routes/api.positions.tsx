import { ActionFunction } from "@remix-run/node";
import { PositionActions, UserActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { positionService } from "~/services/position.service.server";
import { userService } from "~/services/user.service.server";

export const action: ActionFunction = async ({ request }) => {
 
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  let requiredPermission;

  switch(_action){
    case "quickAssign":
      requiredPermission = PositionActions.Create;
      break;
    case "quickChange":
      requiredPermission = UserActions.QuickChangePosition;
      break;
      default: 
      requiredPermission = UserActions.QuickChangePosition;
  }


  await authService.requireUser(request,{condition: requiredPermission});
  try {
    if (_action === "quickAssign") {
      const userID = formData.get("user") as string;
      const positionID = formData.get("position") as string;
       await positionService.addMember(positionID,userID);
      const updatedUser = await userService.updateCurrentPosition(positionID,userID);
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
