
import Patrimoine, { IPatrimoine, IPatrimoineMethods, PatrimoineModel } from '~/core/entities/patrimoine.entity.server';
import { BaseService } from '~/core/abstracts/service.server';
import mongoose from 'mongoose';

export default class PatrimoineService extends BaseService<IPatrimoine, IPatrimoineMethods, PatrimoineModel> {
  constructor() {
    super(Patrimoine);
  }

  private static instance: PatrimoineService;

  public static getInstance(): PatrimoineService {
    if (!PatrimoineService.instance) {
      PatrimoineService.instance = new PatrimoineService();
    }
    return PatrimoineService.instance;
  }

  // Méthode pour assigner un bien à un utilisateur ou un département
  async assignPatrimoine(patrimoineId: string, assignedTo: string): Promise<IPatrimoine | null> {
    return await this.updateOne(patrimoineId, { assignedTo });
  }

  // Méthode pour obtenir les biens d'un type spécifique
  async getPatrimoinesByType(typeId: string): Promise<IPatrimoine[]> {
    return await this.readMany({ type: typeId });
  }
}

export const patrimoineService = PatrimoineService.getInstance();