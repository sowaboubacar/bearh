
import PermissionAndLeave, { IPermissionAndLeave, IPermissionAndLeaveMethods, PermissionAndLeaveModel } from '~/core/entities/permissionAndLeave.entity.server';
import { BaseService } from '~/core/abstracts/service.server';
import mongoose from 'mongoose';

export default class PermissionAndLeaveService extends BaseService<IPermissionAndLeave, IPermissionAndLeaveMethods, PermissionAndLeaveModel> {
  constructor() {
    super(PermissionAndLeave);
  }

  private static instance: PermissionAndLeaveService;

  public static getInstance(): PermissionAndLeaveService {
    if (!PermissionAndLeaveService.instance) {
      PermissionAndLeaveService.instance = new PermissionAndLeaveService();
    }
    return PermissionAndLeaveService.instance;
  }

  // Méthode pour soumettre une nouvelle demande
  async submitRequest(requestData: IPermissionAndLeave): Promise<IPermissionAndLeave> {
    return await this.createOne(requestData);
  }

  // Méthode pour approuver une demande
  async approveRequest(requestId: string, approverId: string): Promise<IPermissionAndLeave | null> {
    return await this.updateOne(requestId, { status: 'Approved', approver: approverId });
  }

  // Méthode pour rejeter une demande
  async rejectRequest(requestId: string, approverId: string): Promise<IPermissionAndLeave | null> {
    return await this.updateOne(requestId, { status: 'Rejected', approver: approverId });
  }

  // Méthode pour obtenir les demandes en attente pour un manager
  async getPendingRequestsForManager(managerId: string): Promise<IPermissionAndLeave[]> {
    // Obtenir les employés sous la supervision du manager
    const subordinates = await userService.getSubordinates(managerId);
    const subordinateIds = subordinates.map(sub => sub._id);
    return await this.readMany({ user: { $in: subordinateIds }, status: 'Pending' });
  }


  // Used in the user monthly report service
  async getMonthlyLeaveMetrics(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const totalDays = new Date(year, month, 0).getDate();

    const leaves = await PermissionAndLeave.find({
      user: userId,
      type: 'Leave',
      // If leaves are considered for that month if overlapping with the month range:
      $or: [
        { startDate: { $lte: endDate, $gte: startDate } },
        { endDate: { $lte: endDate, $gte: startDate } },
      ],
    }).lean();

    const totalLeaves = leaves.length;
    const leavesByType = leaves.reduce((acc, l) => {
      acc[l.reason] = (acc[l.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ratioLeaves = totalDays > 0 ? (totalLeaves / totalDays) : 0;

    return {
      totalLeaves,
      leavesByType,
      ratioLeaves,
    };
  }
  
  /**
   * Selects a random status based on predefined probabilities.
   * 
   * @returns A status string: 'Pending', 'Approved', or 'Rejected'.
   */
  private getRandomStatus(): 'Pending' | 'Approved' | 'Rejected' {
    const rand = Math.random();
    if (rand < 0.5) return 'Pending';    // 50% chance
    if (rand < 0.8) return 'Approved';   // 30% chance
    return 'Rejected';                   // 20% chance
  }
}

export const permissionAndLeaveService = PermissionAndLeaveService.getInstance();