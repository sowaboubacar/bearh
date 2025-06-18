import Candidate, {
  ICandidate,
  ICandidateMethods,
  CandidateModel,
} from "~/core/entities/candidate.entity.server";
import { BaseService } from "~/core/abstracts/service.server";

export default class CandidateService extends BaseService<
  ICandidate,
  ICandidateMethods,
  CandidateModel
> {
  constructor() {
    super(Candidate);
  }

  private static instance: CandidateService;

  public static getInstance(): CandidateService {
    if (!CandidateService.instance) {
      CandidateService.instance = new CandidateService();
    }
    return CandidateService.instance;
  }
}

export const candidateService = CandidateService.getInstance();
