import Payroll, { IPayroll, IPayrollMethods, PayrollModel } from "~/core/entities/payroll.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class PayrollService extends BaseService<IPayroll, IPayrollMethods, PayrollModel> {
  constructor() {
    super(Payroll);
  }

  private static instance: PayrollService;

  public static getInstance(): PayrollService {
    if (!PayrollService.instance) {
      PayrollService.instance = new PayrollService();
    }
    return PayrollService.instance;
  }

  // Add methods for payroll operations here

  public async findAll(): Promise<IPayroll[]> {
    return this.model.find().exec();
  }

  public async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  public async update(id: string, data: Partial<IPayroll>): Promise<IPayroll | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}

export const payrollService = PayrollService.getInstance(); 