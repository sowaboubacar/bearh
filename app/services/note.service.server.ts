import Note, {
  INote,
  INoteMethods,
  NoteModel,
} from "~/core/entities/note.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class NoteService extends BaseService<
  INote,
  INoteMethods,
  NoteModel
> {
  constructor() {
    super(Note);
  }

  private static instance: NoteService;

  public static getInstance(): NoteService {
    if (!NoteService.instance) {
      NoteService.instance = new NoteService();
    }
    return NoteService.instance;
  }

  /**
   * Assign a task to the member
   *
   * @param id The ID of the task
   * @param userId The ID of the user to assign the task
   * @returns The updated task or null if the task is not found
   */
  async shareWithUser(id: string, userId: string): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.sharedWith) {
      item.sharedWith = {};
    }

    if (!item.sharedWith.users) {
      item.sharedWith.users = [];
    }

    item.sharedWith?.users?.push(userId);
    return await item.save();
  }

  /**
   * Remove a member from a task
   *
   * @param id The ID of the task
   * @param userId The ID of the user to remove
   * @returns The updated task or null if the task is not found
   */
  async unShareWithUser(id: string, userId: string): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (item.sharedWith?.users) {
      item.sharedWith.users = item.sharedWith.users.filter(
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
  async shareWithPosition(
    id: string,
    positionId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.sharedWith) {
      item.sharedWith = {};
    }

    if (!item.sharedWith.positions) {
      item.sharedWith.positions = [];
    }

    item.sharedWith.positions.push(positionId);
    return await item.save();
  }

  /**
   * Retire une position d'une tâche
   *
   * @param id L'ID de la tâche
   * @param positionId L'ID de la position à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unShareWithPosition(
    id: string,
    positionId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.sharedWith?.positions) {
      item.sharedWith.positions = item.sharedWith.positions.filter(
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
  async shareWithTeam(id: string, teamId: string): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.sharedWith) {
      item.sharedWith = {};
    }

    if (!item.sharedWith.teams) {
      item.sharedWith.teams = [];
    }

    item.sharedWith?.teams.push(teamId);
    return await item.save();
  }

  /**
   * Retire une équipe d'une tâche
   *
   * @param id L'ID de la tâche
   * @param teamId L'ID de l'équipe à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unShareWithTeam(id: string, teamId: string): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.sharedWith?.teams) {
      item.sharedWith.teams = item.sharedWith.teams.filter(
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
  async shareWithDepartment(
    id: string,
    departmentId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.sharedWith) {
      item.sharedWith = {};
    }

    if (!item.sharedWith.departments) {
      item.sharedWith.departments = [];
    }

    item.sharedWith?.departments.push(departmentId);
    return await item.save();
  }

  /**
   * Retire un département d'une tâche
   *
   * @param id L'ID de la tâche
   * @param departmentId L'ID du département à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unShareWithDepartment(
    id: string,
    departmentId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.sharedWith?.departments) {
      item.sharedWith.departments = item.sharedWith.departments.filter(
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
  async shareWithHourGroup(
    id: string,
    hourGroupId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.sharedWith) {
      item.sharedWith = {};
    }

    if (!item.sharedWith.hourGroups) {
      item.sharedWith.hourGroups = [];
    }

    item.sharedWith.hourGroups.push(hourGroupId);
    return await item.save();
  }

  /**
   * Retire un programme d'une tâche
   *
   * @param id L'ID de la tâche
   * @param hourGroupId L'ID du programme à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unShareWithHourGroup(
    id: string,
    hourGroupId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.sharedWith?.hourGroups) {
      item.sharedWith.hourGroups = item.sharedWith.hourGroups.filter(
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
  async shareWithBonusCategory(
    id: string,
    bonusCategoryId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.sharedWith) {
      item.sharedWith = {};
    }

    if (!item.sharedWith.bonusCategories) {
      item.sharedWith.bonusCategories = [];
    }

    item.sharedWith?.bonusCategories?.push(bonusCategoryId);
    return await item.save();
  }

  /**
   * Retire une catégorie de bonus d'une tâche
   *
   * @param id L'ID de la tâche
   * @param bonusCategoryId L'ID de la catégorie de bonus à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unShareWithBonusCategory(
    id: string,
    bonusCategoryId: string
  ): Promise<INote | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.sharedWith?.bonusCategories) {
      item.sharedWith.bonusCategories =
        item.sharedWith?.bonusCategories?.filter(
          (category) => category.toString() !== bonusCategoryId
        );
    }

    return await item.save();
  }


  /**
   * Selects a random visibility option based on predefined probabilities.
   *
   * @returns A visibility string: 'Private', 'Public', or 'Shared'.
   */
  private getRandomVisibility(): "Private" | "Public" | "Shared" {
    const rand = Math.random();
    if (rand < 0.4) return "Private"; // 40% chance
    if (rand < 0.8) return "Public"; // 40% chance
    return "Shared"; // 20% chance
  }
}

export const noteService = NoteService.getInstance();
