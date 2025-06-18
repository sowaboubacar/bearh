import SystemConfig, {
  ISystemConfig,
  ISystemConfigMethods,
  SystemConfigModel,
} from "~/core/entities/systemConfig.entity.server";
import { BaseService } from "~/core/abstracts/service.server";

export default class SystemConfigService extends BaseService<
  ISystemConfig,
  ISystemConfigMethods,
  SystemConfigModel
> {
  constructor() {
    super(SystemConfig);
  }

  private static instance: SystemConfigService;

  public static getInstance(): SystemConfigService {
    if (!SystemConfigService.instance) {
      SystemConfigService.instance = new SystemConfigService();
    }
    return SystemConfigService.instance;
  }

  /**
   * Get the current system configuration
   *
   * @returns The current system configuration
   */
  async getCurrentConfig(): Promise<ISystemConfig | null> {
    return await this.readOne({
      populate:
        "settings.employeeOfTheMonth.notifications.voters.votersList,updatedBy,settings.notifications.checkIn.recipients,settings.notifications.checkOut.recipients,settings.notifications.breakStart.recipients,settings.notifications.breakEnd.recipients,settings.notifications.permission.recipients,settings.notifications.permissionApproved.recipients,settings.notifications.permissionRejected.recipients,settings.notifications.news.recipients,settings.notifications.observation.recipients,settings.notifications.taskAssigned.recipients,settings.notifications.taskCompleted.recipients,settings.notifications.expenseRequest.recipients,settings.notifications.expenseRequestApproved.recipients,settings.notifications.expenseRequestRejected.recipients,settings.notifications.guardTourUpdate.recipients,settings.notifications.evaluateAnEmployee.recipients,settings.notifications.addToOrUpdateDepartmentMemberships.recipients,settings.notifications.addToOrUpdateTeamMemberships.recipients,settings.notifications.addToOrUpdatePositionMemberships.recipients,settings.notifications.addToOrUpdateHourGroupMemberships.recipients,settings.notifications.accessControlUpdate.recipients,settings.notifications.accessControlAssignedToUser.recipients,settings.notifications.accessControlAssignedToPosition.recipients",
    });
  }

  /**
   * Create a new system configuration or update the existing one
   *
   * @param configData The data to create or update the configuration
   * @returns The created or updated configuration
   */
  async updateConfig(
    configData: Partial<ISystemConfig>
  ): Promise<ISystemConfig | null> {
    configData.lastUpdatedBy = "user";
    const existingConfig =
      (await this.getCurrentConfig()) as ISystemConfig | null;
    if (existingConfig) {
      // If the configuration is blocked, do not allow updates, just return the existing configuration
      if (existingConfig.isBlocked) {
        return existingConfig;
      }
      return (await this.updateOne(
        existingConfig?.id as string,
        configData
      )) as ISystemConfig;
    } else {
      return await this.createOne(configData);
    }
  }

  
  /**
   * Block or unblock the system configuration
   * This is used to prevent modification of the system configuration
   * @param block True to block the configuration, false to unblock
   * @returns The updated configuration
   */
  async blockConfig(block: boolean): Promise<ISystemConfig | null> {
    const existingConfig =
      (await this.getCurrentConfig()) as ISystemConfig | null;
    if (existingConfig) {
      return (await this.updateOne(
        existingConfig?.id as string,
        { isBlocked: block }
      )) as ISystemConfig;
    } else {
      return null;
    }
  }

  /**
   * Initialize the system configuration
   * If the configuration already exists, it will return the existing configuration
   * @returns The initial system configuration
   */
  async initConfig(): Promise<ISystemConfig | null> {
    const existingConfig = await this.getCurrentConfig();
    if (existingConfig) {
      return existingConfig;
    }

    const newConfig = {
      settings: {
        notifications: {
          checkIn: { recipients: [] },
          checkOut: { recipients: [] },
          breakStart: { recipients: [] },
          breakEnd: { recipients: [] },
          permission: { recipients: [] },
          permissionApproved: { recipients: [] },
          permissionRejected: { recipients: [] },
          news: { recipients: [] },
          observation: { recipients: [] },
          taskAssigned: { recipients: [] },
          taskCompleted: { recipients: [] },
          expenseRequest: { recipients: [] },
          expenseRequestApproved: { recipients: [] },
          expenseRequestRejected: { recipients: [] },
          guardTourUpdate: { recipients: [] },
          evaluateAnEmployee: { recipients: [] },
          addToOrUpdateDepartmentMemberships: { recipients: [] },
          addToOrUpdateTeamMemberships: { recipients: [] },
          addToOrUpdatePositionMemberships: { recipients: [] },
          addToOrUpdateHourGroupMemberships: { recipients: [] },
          accessControlUpdate: { recipients: [] },
          accessControlAssignedToUser: { recipients: [] },
          accessControlAssignedToPosition: { recipients: [] },
        },
        bonusCalculation: {
          frequency: "quarterly",
          executionDay: 5,
          executionTime: "02:00",
          nextExecutionDate: new Date(),
          lastExecutionDate: new Date(),
        },
      },
      lastUpdatedBy: "system", // Can be user or system
    };

    const lastExecutionDate = new Date();
    const nextExecutionDate = this.calculateNextExecutionDate(
      lastExecutionDate,
      newConfig.settings.bonusCalculation.frequency,
      newConfig.settings.bonusCalculation.executionDay,
      newConfig.settings.bonusCalculation.executionTime
    );

    // Verify if nextExecutionDate is a valid date
    if (isNaN(nextExecutionDate.getTime())) {
      throw new Error(
        "La date retournée par calculateNextExecutionDate est invalide."
      );
    }
    newConfig.settings.bonusCalculation.lastExecutionDate = lastExecutionDate;
    newConfig.settings.bonusCalculation.nextExecutionDate = nextExecutionDate;

    return await this.createOne(newConfig);
  }

  /**
   * Calculate the next execution date based on the last execution date, frequency, and execution time
   *
   * @param lastExecutionDate The last execution date
   * @param frequency The frequency of the execution
   * @param executionDay The day of execution (1-28)
   * @param executionTime The time of execution ("HH:mm" or "HH:mm:ss")
   * @returns The next execution date
   */
  calculateNextExecutionDate(
    lastExecutionDate: Date,
    frequency: string,
    executionDay: number,
    executionTime: string
  ): Date {
    const nextExecutionDate = new Date(lastExecutionDate);

    switch (frequency) {
      case "daily":
        nextExecutionDate.setDate(lastExecutionDate.getDate() + 1);
        break;
      case "weekly":
        nextExecutionDate.setDate(lastExecutionDate.getDate() + 7);
        break;
      case "monthly":
        nextExecutionDate.setMonth(lastExecutionDate.getMonth() + 1);
        break;
      case "quarterly":
        nextExecutionDate.setMonth(lastExecutionDate.getMonth() + 3);
        break;
      case "semi-annually":
        nextExecutionDate.setMonth(lastExecutionDate.getMonth() + 6);
        break;
      case "annually":
        nextExecutionDate.setFullYear(lastExecutionDate.getFullYear() + 1);
        break;
      default:
        throw new Error("Unsupported frequency");
    }

    // Ensure the execution day is between 1 and 28
    const day = Math.min(Math.max(executionDay, 1), 28);
    nextExecutionDate.setDate(day);

    // Parse executionTime and default missing parts to zero
    const timeParts = executionTime.split(":").map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const seconds = timeParts[2] || 0;

    nextExecutionDate.setHours(hours);
    nextExecutionDate.setMinutes(minutes);
    nextExecutionDate.setSeconds(seconds);

    return nextExecutionDate;
  }
}

export const systemConfigService = SystemConfigService.getInstance();
