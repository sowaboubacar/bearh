import Observation, {
  IObservation,
  IObservationMethods,
  ObservationModel,
} from "~/core/entities/observation.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class ObservationService extends BaseService<
  IObservation,
  IObservationMethods,
  ObservationModel
> {
  constructor() {
    super(Observation);
  }

  private static instance: ObservationService;

  public static getInstance(): ObservationService {
    if (!ObservationService.instance) {
      ObservationService.instance = new ObservationService();
    }
    return ObservationService.instance;
  }

  // Méthode pour ajouter une observation
  async addObservation(observationData: IObservation): Promise<IObservation> {
    return await this.createOne(observationData);
  }

  // Méthode pour obtenir les observations d'un utilisateur
  async getUserObservations(userId: string): Promise<IObservation[]> {
    return await this.readMany({ user: userId });
  }

  // Méthode pour calculer le score des observations (positives - négatives)
  async calculateObservationScore(userId: string): Promise<number> {
    const observations = await this.getUserObservations(userId);
    let score = 0;
    observations.forEach((obs) => {
      score += obs.type === "Positive" ? 1 : -1;
    });
    return score;
  }

  // Used in the user monthly report service
  async getMonthlyObservationMetrics(
    userId: string,
    year: number,
    month: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const obs = await Observation.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const positive = obs.filter((o) => o.type === "Positive").length;
    const negative = obs.filter((o) => o.type === "Negative").length;
    const total = positive + negative;
    const ratioPositive = total > 0 ? positive / total : 0;

    return {
      positive,
      negative,
      ratioPositive,
    };
  }
}

export const observationService = ObservationService.getInstance();
