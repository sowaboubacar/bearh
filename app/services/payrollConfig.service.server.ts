import { BaseService } from "~/core/abstracts/service.server";
import PayrollConfig, { IPayrollConfig, IPayrollConfigMethods, PayrollConfigModel } from "~/core/entities/payrollConfig.entity.server";
import mongoose from "mongoose";

export default class PayrollConfigService extends BaseService<IPayrollConfig, IPayrollConfigMethods, PayrollConfigModel> {
  constructor() {
    super(PayrollConfig);
  }

  private static instance: PayrollConfigService;

  public static getInstance(): PayrollConfigService {
    if (!PayrollConfigService.instance) {
      PayrollConfigService.instance = new PayrollConfigService();
    }
    return PayrollConfigService.instance;
  }

  // Add methods for payroll configuration operations here

  public async findOne(): Promise<IPayrollConfig | null> {
    return this.model.findOne().exec();
  }

  public async update(id: string, data: Partial<IPayrollConfig>): Promise<IPayrollConfig | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export const payrollConfigService = PayrollConfigService.getInstance(); 