import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IPayroll extends IBaseModel {
  employeeId: mongoose.Types.ObjectId;
  month: string;
  baseSalary: number;
  allowances: {
    id: mongoose.Types.ObjectId;
    amount: number;
  }[];
  deductions: {
    id: mongoose.Types.ObjectId;
    amount: number;
  }[];
  overtime: number;
  grossTotal: number;
  socialCharges: number;
  netToPay: number;
  status: "generated" | "updated" | "validated";
}

export type IPayrollMethods = Record<string, never>;

export type PayrollModel = Model<IPayroll, Record<string, never>, IPayrollMethods>;

const payrollSchema = new Schema<IPayroll, PayrollModel, IPayrollMethods>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    allowances: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: "Allowance",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    deductions: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: "Deduction",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    overtime: {
      type: Number,
      default: 0,
    },
    grossTotal: {
      type: Number,
      required: true,
    },
    socialCharges: {
      type: Number,
      required: true,
    },
    netToPay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["generated", "updated", "validated"],
      default: "generated",
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.plugin(toJSON);
payrollSchema.plugin(paginate);
payrollSchema.plugin(documentReferencePlugin);

const Payroll = mongoose.models.Payroll || mongoose.model<IPayroll, PayrollModel>("Payroll", payrollSchema);
export default Payroll; 