/* eslint-disable @typescript-eslint/no-explicit-any */
import Task, {
  ITask,
  ITaskMethods,
  TaskModel,
} from "~/core/entities/task.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";
import { userService } from "./user.service.server";
import { sortBy } from "lodash";

export default class TaskService extends BaseService<
  ITask,
  ITaskMethods,
  TaskModel
> {
  constructor() {
    super(Task);
  }

  private static instance: TaskService;

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * Retrieve tasks related to a user based on the user's current position, team, department, hour group, access, and bonus category.
   * Also includes tasks the user has started or completed.
   * Optionally filter by task status and whether the task is recurrent.
   *
   * @param userId The ID of the user
   * @param status The status of the tasks to filter by
   * @param isRecurrent Whether to filter by recurrent tasks
   * @param page The page number for pagination
   * @param limit The number of items per page
   * @returns A paginated list of tasks related to the user
   * @throws Error if the user is not found
   */
  async tasksOf({
    userId,
    status = "To Do",
    isRecurrent,
    page = 1,
    limit = 10,
    sortBy = "updatedAt:desc",
    searchString,
  }: {
    userId: string;
    status?: string | undefined;
    isRecurrent?: boolean | undefined;
    page?: number;
    limit?: number;
    sortBy?: string;
    searchString?: string | undefined;
  }): Promise<any> {
    // Get the user
    const user = await userService.readOne({ id: userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Create the filter object
    const filter: any = {
      $or: [
        { title: { $regex: searchString, $options: "i" } },
        { description: { $regex: searchString, $options: "i" } },
        {status: { $regex: searchString, $options: "i" },},
        { "assignedTo.users": userId },
        {
          "assignedTo.positions": {
            $in: user.currentPosition ? [user.currentPosition] : [],
          },
        },
        {
          "assignedTo.teams": {
            $in: user.currentTeam ? [user.currentTeam] : [],
          },
        },
        {
          "assignedTo.departments": {
            $in: user.currentDepartment ? [user.currentDepartment] : [],
          },
        },
        {
          "assignedTo.hourGroups": {
            $in: user.currentHourGroup ? [user.currentHourGroup] : [],
          },
        },
        { "assignedTo.access": { $in: user.access ? [user.access] : [] } },
        {
          "assignedTo.bonusCategories": {
            $in: user.currentBonusCategory ? [user.currentBonusCategory] : [],
          },
        },
        { startedBy: userId },
        { completedBy: userId },
      ],
    };

    if (status) {
      filter.status = status;
    }

    if (isRecurrent !== undefined) {
      filter.isRecurrent = isRecurrent;
    }

    const options = {
      page,
      limit,
      sortBy,
      // populate is comma separated string
      populate:
        "assignedTo.users,assignedTo.positions,assignedTo.teams,assignedTo.departments,assignedTo.hourGroups,assignedTo.access,assignedTo.bonusCategories,startedBy,completedBy,author",
    };

    return await this.readManyPaginated(filter, options);
  }

  /**
   * Retrieve a task by its id or return the task object if provided
   * @param taskOrId The task or id of the task
   * @returns The task object
   */
  private async getTask(taskOrId: ITask | string): Promise<ITask> {
    if (typeof taskOrId === "string") {
      const task = await this.readOne({ _id: taskOrId });
      if (!task) {
        throw new Error("Task not found");
      }
      return task;
    }
    return taskOrId;
  }

  /**
   * Mark a task as completed (clone the task and save it as a new task with status 'Completed')
   *
   * Applied only on recurrent tasks. When a user completes a recurrent task, the task is cloned and saved as a new task with status 'Completed'
   * @param taskOrId The task or id of the task to mark as completed
   * @returns The new task that is marked as completed
   */
  private async markAsCompleted(taskOrId: ITask | string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    const completedTask = new Task({
      ...task.toObject(),
      _id: undefined,
      isRecurrent: false,
      status: "Completed",
    });
    return await completedTask.save();
  }

  /**
   * Mark a recurring task as in progress (clone the task and save it as a new task)
   *
   * This function should be called when a user wants to mark a recurrent task as in progress.
   * @param taskOrId The task or id of the task to mark as in progress
   * @returns The new task that is marked as in progress
   */
  private async markAsInProgress(taskOrId: ITask | string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    const inProgressTask = new Task({
      ...task.toObject(),
      _id: undefined,
      isRecurrent: false,
      status: "In Progress",
    });
    return await inProgressTask.save();
  }

  /**
   * Mark a task as recurring (clone the task and save it as a new task and set the isRecurrent flag to true)
   *
   * This function can be called when a user wants to mark a task as recurring and let employee do it repeatedly
   * @param taskOrId The task or id of the task to mark as recurring
   * @returns The new task that is marked as recurring
   */
  async markAsRecurrent(taskOrId: ITask | string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    const recurrentTask = new Task({
      ...task.toObject(),
      _id: undefined,
      isRecurrent: true,
    });
    return await recurrentTask.save();
  }

  /**
   * Mark a normal (non recurrent) task as completed
   * @param taskOrId The task or id of the task to mark as completed
   * @returns The updated task
   */
  private async complete(taskOrId: ITask | string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    task.status = "Completed";
    return await task.save();
  }

  /**
   * Mark a task as in progress
   * @param taskOrId The task or id of the task to mark as in progress
   * @returns The updated task
   */
  private async start(taskOrId: ITask | string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    task.status = "In Progress";
    return await task.save();
  }

  /**
   * Reset a task to 'To Do' status
   * @param taskOrId The task or id of the task to reset
   * @returns The updated task
   */
  async reset(taskOrId: ITask | string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    task.status = "To Do";
    return await task.save();
  }

  /**
   * Complete a task (mark as completed).
   * If the task is recurrent, it will be cloned and saved as a new task with status 'Completed'
   * If the task is not recurrent, the status of the task will be set to 'Completed'
   *
   * @param taskOrId The task or id of the task to complete
   * @param userId The ID of the user who completed the task
   * @returns The updated task
   */
  async completeTask(taskOrId: ITask | string, userId: string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    task.completedBy = new mongoose.Types.ObjectId(userId);
    task.completedAt = new Date();

    console.log("completeTasking  ", JSON.stringify(taskOrId))
    return task.isRecurrent
      ? await this.markAsCompleted(task)
      : await this.complete(task);
  }

  async updateTaskStatus(taskOrId: ITask | string, status: string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    task.status = status;
    return await task.save();
  }

  /**
   * Start a task (mark as in progress).
   * If the task is recurrent, it will be cloned and saved as a new task with status 'In Progress'
   * If the task is not recurrent, the status of the task will be set to 'In Progress'
   *
   * @param taskOrId The task or id of the task to start
   * @param userId The ID of the user who started the task
   * @returns The updated task
   */
  async startTask(taskOrId: ITask | string, userId: string): Promise<ITask> {
    const task = await this.getTask(taskOrId);
    task.startedBy = new mongoose.Types.ObjectId(userId);
    task.startedAt = new Date();
    return task.isRecurrent
      ? await this.markAsInProgress(task)
      : await this.start(task);
  }

  /**
   * Assign a task to the member
   *
   * @param id The ID of the task
   * @param userId The ID of the user to assign the task
   * @returns The updated task or null if the task is not found
   */
  async assignToUser(id: string, userId: string): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.assignedTo) {
      item.assignedTo = {};
    }

    if (!item.assignedTo.users) {
      item.assignedTo.users = [];
    }

    item.assignedTo?.users?.push(userId);
    return await item.save();
  }

  /**
   * Remove a member from a task
   *
   * @param id The ID of the task
   * @param userId The ID of the user to remove
   * @returns The updated task or null if the task is not found
   */
  async unAssignToUser(id: string, userId: string): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (item.assignedTo?.users) {
      item.assignedTo.users = item.assignedTo.users.filter(
        (user) => user.toString() !== userId
      );
    }

    return await item.save();
  }

  /**
   * Assigne une tâche à une position
   *
   * @param id L'ID de la tâche
   * @param positionId L'ID de la position à assigner à la tâche
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async assignToPosition(
    id: string,
    positionId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.assignedTo) {
      item.assignedTo = {};
    }

    if (!item.assignedTo.positions) {
      item.assignedTo.positions = [];
    }

    item.assignedTo.positions.push(positionId);
    return await item.save();
  }

  /**
   * Retire une position d'une tâche
   *
   * @param id L'ID de la tâche
   * @param positionId L'ID de la position à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unAssignToPosition(
    id: string,
    positionId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.assignedTo?.positions) {
      item.assignedTo.positions = item.assignedTo.positions.filter(
        (pos) => pos.toString() !== positionId
      );
    }

    return await item.save();
  }

  /**
   * Assigne une tâche à une équipe
   *
   * @param id L'ID de la tâche
   * @param teamId L'ID de l'équipe à assigner à la tâche
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async assignToTeam(id: string, teamId: string): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.assignedTo) {
      item.assignedTo = {};
    }

    if (!item.assignedTo.teams) {
      item.assignedTo.teams = [];
    }

    item.assignedTo?.teams.push(teamId);
    return await item.save();
  }

  /**
   * Retire une équipe d'une tâche
   *
   * @param id L'ID de la tâche
   * @param teamId L'ID de l'équipe à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unAssignToTeam(id: string, teamId: string): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.assignedTo?.teams) {
      item.assignedTo.teams = item.assignedTo.teams.filter(
        (team) => team.toString() !== teamId
      );
    }

    return await item.save();
  }

  /**
   * Assigne une tâche à un département
   *
   * @param id L'ID de la tâche
   * @param departmentId L'ID du département à assigner à la tâche
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async assignToDepartment(
    id: string,
    departmentId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.assignedTo) {
      item.assignedTo = {};
    }

    if (!item.assignedTo.departments) {
      item.assignedTo.departments = [];
    }

    item.assignedTo?.departments.push(departmentId);
    return await item.save();
  }

  /**
   * Retire un département d'une tâche
   *
   * @param id L'ID de la tâche
   * @param departmentId L'ID du département à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unAssignToDepartment(
    id: string,
    departmentId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.assignedTo?.departments) {
      item.assignedTo.departments = item.assignedTo.departments.filter(
        (dept) => dept.toString() !== departmentId
      );
    }

    return await item.save();
  }

  /**
   * Assigne une tâche à un programme
   *
   * @param id L'ID de la tâche
   * @param hourGroupId L'ID du programme à assigner à la tâche
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async assignToHourGroup(
    id: string,
    hourGroupId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.assignedTo) {
      item.assignedTo = {};
    }

    if (!item.assignedTo.hourGroups) {
      item.assignedTo.hourGroups = [];
    }

    item.assignedTo.hourGroups.push(hourGroupId);
    return await item.save();
  }

  /**
   * Retire un programme d'une tâche
   *
   * @param id L'ID de la tâche
   * @param hourGroupId L'ID du programme à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unAssignToHourGroup(
    id: string,
    hourGroupId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.assignedTo?.hourGroups) {
      item.assignedTo.hourGroups = item.assignedTo.hourGroups.filter(
        (group) => group.toString() !== hourGroupId
      );
    }

    return await item.save();
  }

  /**
   * Assigne une tâche à une catégorie de bonus
   *
   * @param id L'ID de la tâche
   * @param bonusCategoryId L'ID de la catégorie de bonus à assigner à la tâche
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async assignToBonusCategory(
    id: string,
    bonusCategoryId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.assignedTo) {
      item.assignedTo = {};
    }

    if (!item.assignedTo.bonusCategories) {
      item.assignedTo.bonusCategories = [];
    }

    item.assignedTo?.bonusCategories?.push(bonusCategoryId);
    return await item.save();
  }

  /**
   * Retire une catégorie de bonus d'une tâche
   *
   * @param id L'ID de la tâche
   * @param bonusCategoryId L'ID de la catégorie de bonus à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unAssignToBonusCategory(
    id: string,
    bonusCategoryId: string
  ): Promise<ITask | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.assignedTo?.bonusCategories) {
      item.assignedTo.bonusCategories =
        item.assignedTo?.bonusCategories?.filter(
          (category) => category.toString() !== bonusCategoryId
        );
    }

    return await item.save();
  }

  // Used in user montly reports page
  async getMonthlyTaskMetrics(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Tasks that are relevant to user:
    // Assume `assignedTo.users` array may contain userId. Filter tasks that user is assigned to and either created or updated in that month.
    // Adjust logic as needed based on how tasks are associated with a month.
    const tasks = await Task.find({
      "assignedTo.users": userId,
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { updatedAt: { $gte: startDate, $lte: endDate } },
      ],
    }).lean();

    const totalTasks = tasks.length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const ratioCompleted = totalTasks > 0 ? completed / totalTasks : 0;

    return {
      totalTasks,
      completed,
      inProgress,
      ratioCompleted,
    };
  }
}

export const taskService = TaskService.getInstance();
