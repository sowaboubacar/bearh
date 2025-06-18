import Position, {
  IPosition,
  IPositionMethods,
  PositionModel,
} from "~/core/entities/position.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class PositionService extends BaseService<
  IPosition,
  IPositionMethods,
  PositionModel
> {
  constructor() {
    super(Position);
  }

  private static instance: PositionService;

  public static getInstance(): PositionService {
    if (!PositionService.instance) {
      PositionService.instance = new PositionService();
    }
    return PositionService.instance;
  }

  // Find the last position of the 
  // Each time user add en employee as member of a position, we get it and add it to the user.currentPosition

  /**
   * Add a member to a item
   *
   * @param id The ID of the item
   * @param userId The ID of the user to add
   * @returns The updated item or null if the item is not found
   */
  async addMember(id: string, userId: string): Promise<IPosition | null> {
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
  async removeMember(id: string, userId: string): Promise<IPosition | null> {
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

export const positionService = PositionService.getInstance();
