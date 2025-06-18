import KpiForm, {
  IKpiCriterion,
  IKpiForm,
  IKpiFormMethods,
  KpiFormModel,
} from "~/core/entities/kpiForm.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import { IUser } from "~/core/entities/user.entity.server";
import mongoose from "mongoose";

export default class KpiFormService extends BaseService<
  IKpiForm,
  IKpiFormMethods,
  KpiFormModel
> {
  constructor() {
    super(KpiForm);
  }

  private static instance: KpiFormService;

  public static getInstance(): KpiFormService {
    if (!KpiFormService.instance) {
      KpiFormService.instance = new KpiFormService();
    }
    return KpiFormService.instance;
  }

  /**
   * Get all KPI forms that are applicable to a user.
   */
  async getApplicableForms(user: IUser): Promise<IKpiForm[]> {
    return await this.readMany({
      $or: [
        { "applicableTo.users": user.id },
        { "applicableTo.position": (user.currentPosition?.id || user.currentPosition) },
      ],
    });
  }

  /**
   * Clone a KPI form by its ID to create a new one.
   * Useful for creating a new form based on an existing one.
   */
  async cloneKpiForm(kpiFormId: string): Promise<IKpiForm | null> {
    const kpiForm = await this.readOne({ _id: kpiFormId });
    if (kpiForm) {
      const newKpiForm = { ...kpiForm.toObject(), _id: undefined };
      return await this.createOne(newKpiForm);
    }
    return null;
  }

  /**
   * Add a member to a item
   *
   * @param id The ID of the item
   * @param userId The ID of the user to add
   * @returns The updated item or null if the item is not found
   */
  async addMember(id: string, userId: string): Promise<IKpiForm | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.applicableTo) {
      item.applicableTo = [];
    }

    item.applicableTo.push(userId);
    return await item.save();
  }

  /**
   * Remove a member from a item
   *
   * @param id The ID of the item
   * @param userId The ID of the user to remove
   * @returns The updated item or null if the item is not found
   */
  async removeMember(id: string, userId: string): Promise<IKpiForm | null> {
    const item = await this.readOne({ id });
    if (!item) {
      // Just silently return null if the item is not found
      return null;
    }

    if (!item.applicableTo) {
      return item;
    }

    item.applicableTo = item.applicableTo.filter(
      (member) => member.toString() !== userId
    );
    return await item.save();
  }
}

export const kpiFormService = KpiFormService.getInstance();
