import GuardTour, {
  IGuardTour,
  IGuardTourMethods,
  GuardTourModel,
} from "~/core/entities/guardTour.entity.server";
import { BaseService } from "~/core/abstracts/service.server";

export default class GuardTourService extends BaseService<
  IGuardTour,
  IGuardTourMethods,
  GuardTourModel
> {
  constructor() {
    super(GuardTour);
  }

  private static instance: GuardTourService;

  public static getInstance(): GuardTourService {
    if (!GuardTourService.instance) {
      GuardTourService.instance = new GuardTourService();
    }
    return GuardTourService.instance;
  }
}

export const guardTourService = GuardTourService.getInstance();
