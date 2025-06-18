
import UserMonthlyReport, { IUserMonthlyReport, IUserMonthlyReportMethods, UserMonthlyReportModel } from '~/core/entities/userMonthlyReport.entity.server';
import { BaseService } from '~/core/abstracts/service.server';
import { attendanceService } from "~/services/attendance.service.server";
import { taskService } from "~/services/task.service.server";
import { kpiValueService } from "~/services/kpiValue.service.server";
import { observationService } from "~/services/observation.service.server";
import { permissionAndLeaveService } from "~/services/permissionAndLeave.service.server";
import { userService } from './user.service.server';
export default class UserMonthlyReportService extends BaseService<IUserMonthlyReport, IUserMonthlyReportMethods, UserMonthlyReportModel> {
  constructor() {
    super(UserMonthlyReport);
  }

  private static instance: UserMonthlyReportService;

  public static getInstance(): UserMonthlyReportService {
    if (!UserMonthlyReportService.instance) {
      UserMonthlyReportService.instance = new UserMonthlyReportService();
    }
    return UserMonthlyReportService.instance;
  }

  

  async generateMonthlyReport(userId: string, year: number, month: number) {
    const attendanceData = await attendanceService.getMonthlyAttendanceMetrics(userId, year, month);
    const taskData = await taskService.getMonthlyTaskMetrics(userId, year, month);
    const performanceData = await kpiValueService.getMonthlyKpiMeanScore(userId, year, month);
    const observationData = await observationService.getMonthlyObservationMetrics(userId, year, month);
    const leaveData = await permissionAndLeaveService.getMonthlyLeaveMetrics(userId, year, month);

    const doc = await this.model.findOneAndUpdate(
      { user: userId, year, month },
      {
        user: userId,
        year,
        month,
        attendanceData,
        taskData,
        performanceData,
        observationData,
        leaveData,
      },
      { upsert: true, new: true }
    );

    return doc;
  }

  async getMonthlyReport(userId: string, year: number, month: number) {
    let report = await this.model.findOne({ user: userId, year, month }).lean();
    if (!report) {
      report = (await this.generateMonthlyReport(userId, year, month))?.toJSON();
    }
    return report;
  }

}

export const userMonthlyReportService = UserMonthlyReportService.getInstance();