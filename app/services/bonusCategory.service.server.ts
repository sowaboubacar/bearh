import BonusCategory, {
  IBonusCategory,
  IBonusCategoryMethods,
  BonusCategoryModel,
} from "~/core/entities/bonusCategory.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class BonusCategoryService extends BaseService<
  IBonusCategory,
  IBonusCategoryMethods,
  BonusCategoryModel
> {
  constructor() {
    super(BonusCategory);
  }

  private static instance: BonusCategoryService;

  public static getInstance(): BonusCategoryService {
    if (!BonusCategoryService.instance) {
      BonusCategoryService.instance = new BonusCategoryService();
    }
    return BonusCategoryService.instance;
  }


  /**
   * Ajoute un membre à une catégorie de bonus
   *
   * @param id L'ID de la catégorie de bonus
   * @param userId L'ID de l'utilisateur à ajouter
   * @returns La catégorie de bonus mise à jour ou null si la catégorie n'est pas trouvée
   */
  async addMember(id: string, userId: string): Promise<IBonusCategory | null> {
    const category = await this.readOne({ _id: id });
    if (!category) {
      // Retourne null si la catégorie n'est pas trouvée
      return null;
    }

    if (!category.members) {
      category.members = [];
    }

    // Vérifie si l'utilisateur est déjà membre pour éviter les doublons
    if (!category.members.includes(new mongoose.Types.ObjectId(userId))) {
      category.members.push(new mongoose.Types.ObjectId(userId));
      await category.save();
    }

    return category;
  }

  /**
   * Supprime un membre d'une catégorie de bonus
   *
   * @param id L'ID de la catégorie de bonus
   * @param userId L'ID de l'utilisateur à supprimer
   * @returns La catégorie de bonus mise à jour ou null si la catégorie n'est pas trouvée
   */
  async removeMember(
    id: string,
    userId: string
  ): Promise<IBonusCategory | null> {
    const category = await this.readOne({ _id: id });
    if (!category) {
      // Retourne null si la catégorie n'est pas trouvée
      return null;
    }

    if (!category.members) {
      return category;
    }

    category.members = category.members.filter(
      (member) => member.toString() !== userId
    );
    return await category.save();
  }
}

export const bonusCategoryService = BonusCategoryService.getInstance();
