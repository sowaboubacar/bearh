import KpiValue, {
  IKpiScore,
  IKpiValue,
  IKpiValueMethods,
  KpiValueModel,
} from "~/core/entities/kpiValue.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class KpiValueService extends BaseService<
  IKpiValue,
  IKpiValueMethods,
  KpiValueModel
> {
  constructor() {
    super(KpiValue);
  }

  private static instance: KpiValueService;

  public static getInstance(): KpiValueService {
    if (!KpiValueService.instance) {
      KpiValueService.instance = new KpiValueService();
    }
    return KpiValueService.instance;
  }

  // Used in the user monthly report service
  async getMonthlyKpiMeanScore(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const kpiValues = await KpiValue.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    if (kpiValues.length === 0) return { meanScore: 0 };

    // If each kpiValue has a meanScore field:
    const totalScore = kpiValues.reduce(
      (sum, kv) => sum + (kv.meanScore || 0),
      0
    );
    const meanScore = totalScore / kpiValues.length;

    return { meanScore };
  }
}

export const kpiValueService = KpiValueService.getInstance();
