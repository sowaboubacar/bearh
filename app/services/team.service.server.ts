import Team, {
  ITeam,
  ITeamMethods,
  TeamModel,
} from "~/core/entities/team.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class TeamService extends BaseService<
  ITeam,
  ITeamMethods,
  TeamModel
> {
  constructor() {
    super(Team);
  }

  private static instance: TeamService;

  public static getInstance(): TeamService {
    if (!TeamService.instance) {
      TeamService.instance = new TeamService();
    }
    return TeamService.instance;
  }

  /**
   * Add a member to a item
   *
   * @param id The ID of the item
   * @param userId The ID of the user to add
   * @returns The updated item or null if the item is not found
   */
  async addMember(id: string, userId: string): Promise<ITeam | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.members) {
      item.members = [];
    }

    item.members.push(userId);
    return await item.save();
  }

  /**
   * Remove a member from a item
   *
   * @param id The ID of the item
   * @param userId The ID of the user to remove
   * @returns The updated item or null if the item is not found
   */
  async removeMember(id: string, userId: string): Promise<ITeam | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.members) {
      return item;
    }

    item.members = item.members.filter(
      (member) => member.toString() !== userId
    );
    return await item.save();
  }

}

export const teamService = TeamService.getInstance();
