
import HourGroup, { IHourGroup, IHourGroupMethods, HourGroupModel, IWorkTime } from '~/core/entities/hourGroup.entity.server';
import { BaseService } from '~/core/abstracts/service.server';
import mongoose from 'mongoose';

export default class HourGroupService extends BaseService<IHourGroup, IHourGroupMethods, HourGroupModel> {
  constructor() {
    super(HourGroup);
  }

  private static instance: HourGroupService;

  public static getInstance(): HourGroupService {
    if (!HourGroupService.instance) {
      HourGroupService.instance = new HourGroupService();
    }
    return HourGroupService.instance;
  }


  /**
   * Add a member to a item
   * 
   * @param id The ID of the item
   * @param userId The ID of the user to add
   * @returns The updated item or null if the item is not found
   */
  async addMember(id: string, userId: string): Promise<IHourGroup | null> {
    const item = await this.readOne({id});
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
  async removeMember(id: string, userId: string): Promise<IHourGroup | null> {
    const item = await this.readOne({id});
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.members) {
      return item;
    }

    item.members = item.members.filter(member => member.toString() !== userId);
    return await item.save();
  }

}

export const hourGroupService = HourGroupService.getInstance();