import { ActionFunction } from "@remix-run/node";
import {
  BonusCategoryActions,
  UserActions,
} from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { bonusCategoryService } from "~/services/bonusCategory.service.server";
import { userService } from "~/services/user.service.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  let requiredPermission;

  switch (_action) {
    case "create":
      requiredPermission = BonusCategoryActions.Create;
      break;
    case "edit":
      requiredPermission = BonusCategoryActions.Edit;
      break;
    case "delete":
      requiredPermission = BonusCategoryActions.Delete;
      break;
    case "quickAssign":
      requiredPermission = UserActions.QuickChangeBonusCategory;
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
      const bonusCategoryID = formData.get("bonusCategory") as string;
      await bonusCategoryService.addMember(bonusCategoryID, userID);
      const updatedUser = await userService.updateCurrentBonusCategory(
        bonusCategoryID,
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
