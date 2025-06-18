/* eslint-disable @typescript-eslint/no-explicit-any */
import UserSession, {
  IUserSession,
  IUserSessionMethods,
  UserSessionModel,
} from "~/core/entities/session.entity.server";
import { BaseService } from "~/core/abstracts/service.server";

export default class SessionService extends BaseService<
  IUserSession,
  IUserSessionMethods,
  UserSessionModel
> {
  constructor() {
    super(UserSession);
  }

  private static instance: SessionService;

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  async createSession(
    data: Record<string, unknown>,
    expires: Date
  ): Promise<string> {
    const session = await this.createOne({ data, expires });
    return session.id.toString();
  }

  async getSession(id: string): Promise<Record<string, unknown> | null> {
    const session = await this.model.findById(id).lean().exec(); // Use lean()
    if (session && session.expires > new Date()) {
      return session.data;
    }
    return null; // Session expired or not found
  }


  async updateSession(
    id: string,
    data: Record<string, unknown>,
    expires: Date
  ): Promise<void> {
    const session = await this.model.findById(id).lean().exec(); // Use lean()
    if (session) {
      const mergedData = { ...session.data, ...data }; // Merge data
      await this.model.updateOne({ _id: id }, { data: mergedData, expires }).exec();
    } else {
      // If session doesn't exist, create a new one
      await this.createSession(data, expires);
    }
  }

  async deleteSession(id: string): Promise<void> {
    await this.deleteOne({ _id: id });
  }
}

export const sessionService = SessionService.getInstance();
