
import Access, { IAccess, IAccessMethods, AccessModel } from '~/core/entities/access.entity.server';
import { BaseService } from '~/core/abstracts/service.server';

export default class AccessService extends BaseService<IAccess, IAccessMethods, AccessModel> {
  constructor() {
    super(Access);
  }

  private static instance: AccessService;

  public static getInstance(): AccessService {
    if (!AccessService.instance) {
      AccessService.instance = new AccessService();
    }
    return AccessService.instance;
  }


  /**
   * Get the permissions of a specific user
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const access = await this.readOne({ user: userId });
    return access ? access.permissions : [];
  }
}

export const accessService = AccessService.getInstance();