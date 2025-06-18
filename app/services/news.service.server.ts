import News, {
  INews,
  INewsMethods,
  NewsModel,
} from "~/core/entities/news.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class NewsService extends BaseService<
  INews,
  INewsMethods,
  NewsModel
> {
  constructor() {
    super(News);
  }

  private static instance: NewsService;

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  /**
   * Assign a task to the member
   *
   * @param id The ID of the task
   * @param userId The ID of the user to assign the task
   * @returns The updated task or null if the task is not found
   */
  async targetAudienceUser(id: string, userId: string): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.targetAudience) {
      item.targetAudience = {};
    }

    if (!item.targetAudience.users) {
      item.targetAudience.users = [];
    }

    item.targetAudience?.users?.push(userId);
    return await item.save();
  }

  /**
   * Remove a member from a task
   *
   * @param id The ID of the task
   * @param userId The ID of the user to remove
   * @returns The updated task or null if the task is not found
   */
  async unTargetAudienceUser(
    id: string,
    userId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (item.targetAudience?.users) {
      item.targetAudience.users = item.targetAudience.users.filter(
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
  async targetAudiencePosition(
    id: string,
    positionId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.targetAudience) {
      item.targetAudience = {};
    }

    if (!item.targetAudience.positions) {
      item.targetAudience.positions = [];
    }

    item.targetAudience.positions.push(positionId);
    return await item.save();
  }

  /**
   * Retire une position d'une tâche
   *
   * @param id L'ID de la tâche
   * @param positionId L'ID de la position à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unTargetAudiencePosition(
    id: string,
    positionId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.targetAudience?.positions) {
      item.targetAudience.positions = item.targetAudience.positions.filter(
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
  async targetAudienceTeam(id: string, teamId: string): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.targetAudience) {
      item.targetAudience = {};
    }

    if (!item.targetAudience.teams) {
      item.targetAudience.teams = [];
    }

    item.targetAudience?.teams.push(teamId);
    return await item.save();
  }

  /**
   * Retire une équipe d'une tâche
   *
   * @param id L'ID de la tâche
   * @param teamId L'ID de l'équipe à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unTargetAudienceTeam(
    id: string,
    teamId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.targetAudience?.teams) {
      item.targetAudience.teams = item.targetAudience.teams.filter(
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
  async targetAudienceDepartment(
    id: string,
    departmentId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.targetAudience) {
      item.targetAudience = {};
    }

    if (!item.targetAudience.departments) {
      item.targetAudience.departments = [];
    }

    item.targetAudience?.departments.push(departmentId);
    return await item.save();
  }

  /**
   * Retire un département d'une tâche
   *
   * @param id L'ID de la tâche
   * @param departmentId L'ID du département à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unTargetAudienceDepartment(
    id: string,
    departmentId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.targetAudience?.departments) {
      item.targetAudience.departments = item.targetAudience.departments.filter(
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
  async targetAudienceHourGroup(
    id: string,
    hourGroupId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.targetAudience) {
      item.targetAudience = {};
    }

    if (!item.targetAudience.hourGroups) {
      item.targetAudience.hourGroups = [];
    }

    item.targetAudience.hourGroups.push(hourGroupId);
    return await item.save();
  }

  /**
   * Retire un programme d'une tâche
   *
   * @param id L'ID de la tâche
   * @param hourGroupId L'ID du programme à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unTargetAudienceHourGroup(
    id: string,
    hourGroupId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.targetAudience?.hourGroups) {
      item.targetAudience.hourGroups = item.targetAudience.hourGroups.filter(
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
  async targetAudienceBonusCategory(
    id: string,
    bonusCategoryId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (!item.targetAudience) {
      item.targetAudience = {};
    }

    if (!item.targetAudience.bonusCategories) {
      item.targetAudience.bonusCategories = [];
    }

    item.targetAudience?.bonusCategories?.push(bonusCategoryId);
    return await item.save();
  }

  /**
   * Retire une catégorie de bonus d'une tâche
   *
   * @param id L'ID de la tâche
   * @param bonusCategoryId L'ID de la catégorie de bonus à retirer
   * @returns La tâche mise à jour ou null si la tâche n'est pas trouvée
   */
  async unTargetAudienceBonusCategory(
    id: string,
    bonusCategoryId: string
  ): Promise<INews | null> {
    const item = await this.readOne({ id });
    if (!item) {
      return null;
    }

    if (item.targetAudience?.bonusCategories) {
      item.targetAudience.bonusCategories =
        item.targetAudience?.bonusCategories?.filter(
          (category) => category.toString() !== bonusCategoryId
        );
    }

    return await item.save();
  }
}

export const newsService = NewsService.getInstance();