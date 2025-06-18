import EnterpriseVideo, {
  IEnterpriseVideo,
  IEnterpriseVideoMethods,
  EnterpriseVideoModel,
} from "~/core/entities/enterpriseVideo.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class EnterpriseVideoService extends BaseService<
  IEnterpriseVideo,
  IEnterpriseVideoMethods,
  EnterpriseVideoModel
> {
  constructor() {
    super(EnterpriseVideo);
  }

  private static instance: EnterpriseVideoService;

  public static getInstance(): EnterpriseVideoService {
    if (!EnterpriseVideoService.instance) {
      EnterpriseVideoService.instance = new EnterpriseVideoService();
    }
    return EnterpriseVideoService.instance;
  }
}

export const enterpriseVideoService = EnterpriseVideoService.getInstance();
