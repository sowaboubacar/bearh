import { ActionFunction } from "@remix-run/node";
import { HourGroupActions, UserActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { hourGroupService } from "~/services/hourGroup.service.server";
import { userService } from "~/services/user.service.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  let requiredPermission; 

  switch (_action) {
    case "create": 
      requiredPermission = HourGroupActions.Create;
      break;
    case "edit":
      requiredPermission = HourGroupActions.Edit;
      break;
    case "delete":
      requiredPermission = HourGroupActions.Delete;
      break;
    case "quickAssign":
      requiredPermission = UserActions.QuickChangeHourGroup;
      break;
    default:
      return Response.json(
        { success: false, error: "Action not supported" },
        { status: 400 }
      );
  }

  await authService.requireUser(request, {
    condition: requiredPermission,
  });

  try {
    if (_action === "quickAssign") {
      const userID = formData.get("user") as string;
      const hourGroupID = formData.get("hourGroup") as string;
      await hourGroupService.addMember(hourGroupID, userID);
      const updatedUser = await userService.updateCurrentHourGroup(
        hourGroupID,
        userID
      );
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
