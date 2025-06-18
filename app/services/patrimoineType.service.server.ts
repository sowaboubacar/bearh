
import PatrimoineType, { IPatrimoineType, IPatrimoineTypeMethods, PatrimoineTypeModel } from '~/core/entities/patrimoineType.entity.server';
import { BaseService } from '~/core/abstracts/service.server';

export default class PatrimoineTypeService extends BaseService<IPatrimoineType, IPatrimoineTypeMethods, PatrimoineTypeModel> {
  constructor() {
    super(PatrimoineType);
  }

  private static instance: PatrimoineTypeService;

  public static getInstance(): PatrimoineTypeService {
    if (!PatrimoineTypeService.instance) {
      PatrimoineTypeService.instance = new PatrimoineTypeService();
    }
    return PatrimoineTypeService.instance;
  }

  // Méthode pour obtenir tous les types de patrimoine
  async getAllPatrimoineTypes(): Promise<IPatrimoineType[]> {
    return await this.readMany({});
  }
}

export const patrimoineTypeService = PatrimoineTypeService.getInstance();