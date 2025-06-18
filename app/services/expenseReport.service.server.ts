import ExpenseReport, {
  IExpenseReport,
  IExpenseReportMethods,
  ExpenseReportModel,
} from "~/core/entities/expenseReport.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class ExpenseReportService extends BaseService<
  IExpenseReport,
  IExpenseReportMethods,
  ExpenseReportModel
> {
  constructor() {
    super(ExpenseReport);
  }

  private static instance: ExpenseReportService;

  public static getInstance(): ExpenseReportService {
    if (!ExpenseReportService.instance) {
      ExpenseReportService.instance = new ExpenseReportService();
    }
    return ExpenseReportService.instance;
  }
 
  /**
   * Determines the status of the expense report based on predefined probabilities.
   *
   * @returns A status string: 'Pending', 'Approved', or 'Rejected'.
   */
  private getRandomStatus(): "Pending" | "Approved" | "Rejected" {
    const rand = Math.random();
    if (rand < 0.6) return "Pending"; // 60% chance
    if (rand < 0.9) return "Approved"; // 30% chance
    return "Rejected"; // 10% chance
  }
}

export const expenseReportService = ExpenseReportService.getInstance();
