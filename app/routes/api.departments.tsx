import { ActionFunction } from "@remix-run/node";
import { DepartmentActions, UserActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { departmentService } from "~/services/department.service.server";
import { userService } from "~/services/user.service.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  let requiredPermission;

  switch (_action) {
    case "create":
      requiredPermission = DepartmentActions.Create;
      break;
    case "edit":
      requiredPermission = DepartmentActions.Edit;
      break;
    case "delete":
      requiredPermission = DepartmentActions.Delete;
      break;
    case "quickAssign":
      requiredPermission = UserActions.QuickChangeDepartment;
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
      const departmentID = formData.get("department") as string;
      await departmentService.addMember(departmentID, userID);
      const updatedUser = await userService.updateCurrentDepartment(
        departmentID,
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
