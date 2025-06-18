import { ActionFunction } from "@remix-run/node";
import { TaskActions, UserActions } from "~/core/entities/utils/access-permission";
import { authService } from "~/services/auth.service.server";
import { observationService } from "~/services/observation.service.server";
import { taskService } from "~/services/task.service.server";

export const action: ActionFunction = async ({ request }) => {
  
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  let requiredPermission;

  switch(_action){
    case "quickAssign":
      requiredPermission = UserActions.QuickAssignTask;
      break;
    case "quickAssignNewTask":
      requiredPermission = UserActions.QuickAssignTask;
      break;
    case "delete":
      requiredPermission = {any: [TaskActions.Delete, TaskActions.DeleteOwn]};
      break;
    case "update":
      requiredPermission = {any: [TaskActions.Edit, TaskActions.EditOwn]};
      break;
    case "toggleComplete":
      requiredPermission = {any: [TaskActions.Edit, TaskActions.EditOwn, TaskActions.ToggleDoneOwn]};
      break;
    default:
      requiredPermission = {any: [TaskActions.Edit, TaskActions.EditOwn]};
  }

  const authenticatedUser = await authService.requireUser(request, {condition: requiredPermission});

  try {
    if (_action === "quickAssign") {
      const userID = formData.get("user") as string;
      const taskID = formData.get("task") as string;
      const newTask = await taskService.assignToUser(taskID, userID);

      return Response.json({
        success: true,
        newTask,
      });
    } else if (_action === "quickAssignNewTask") {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const status = formData.get("status") as string;
      const dueDate = formData.get("dueDate") as string;
      const userID = formData.get("user") as string;

      const assignedTo = {
        users: [], // Will have the user ids after creation
        positions: [],
        teams: [],
        departments: [],
        hourGroups: [],
        access: [],
      };

      const newTask = await taskService.createOne({
        title,
        description,
        assignedTo,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        author: authenticatedUser.id,
      });

      // Now, assign the task to the user
      const updatedTask = await taskService.assignToUser(newTask.id, userID);

      return Response.json({
        success: true,
        updatedTask,
      });
    } else if (_action === "update") {
      const taskID = formData.get("task") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const status = formData.get("status") as string;
      const dueDate = formData.get("dueDate") as string;

      const assignedTo = {
        users: formData.getAll("assignedTo.users") as string[],
        positions: formData.getAll("assignedTo.positions") as string[],
        teams: formData.getAll("assignedTo.teams") as string[],
        departments: formData.getAll("assignedTo.departments") as string[],
        hourGroups: formData.getAll("assignedTo.hourGroups") as string[],
        access: formData.getAll("assignedTo.access") as string[],
      };

      const updatedTask = await taskService.updateOneAfterFindIt(taskID, {
        title,
        description,
        assignedTo,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        updatedBy: authenticatedUser.id,
      });
      return Response.json({
        success: true,
        updatedTask,
      });
    } else if (_action === "delete") {
      const taskID = formData.get("task") as string;
      const data = await taskService.deleteOne(taskID);
      return Response.json({
        success: true,
        data,
      });
    } else if (_action === "toggleComplete") {
      const taskID = formData.get("task") as string;
      const task = await taskService.readOne(taskID);
      const newStatus = task.status === "Completed" ? "To Do" : "Completed";
      await taskService.updateOne(taskID, { status: newStatus });
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
