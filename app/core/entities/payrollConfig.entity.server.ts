import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IPayrollConfig extends IBaseModel {
  smig: number;
  contributions: {
    cnps: number;
    amu: number;
    others: Record<string, number>;
  };
  taxation: {
    brackets: {
      threshold: number;
      rate: number;
    }[];
  };
}

export type IPayrollConfigMethods = Record<string, never>;

export type PayrollConfigModel = Model<IPayrollConfig, Record<string, never>, IPayrollConfigMethods>;

const payrollConfigSchema = new Schema<IPayrollConfig, PayrollConfigModel, IPayrollConfigMethods>(
  {
    smig: {
      type: Number,
      required: true,
    },
    contributions: {
      cnps: {
        type: Number,
        required: true,
      },
      amu: {
        type: Number,
        required: true,
      },
      others: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    taxation: {
      brackets: [
        {
          threshold: {
            type: Number,
            required: true,
          },
          rate: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

payrollConfigSchema.plugin(toJSON);
payrollConfigSchema.plugin(paginate);
payrollConfigSchema.plugin(documentReferencePlugin);

const PayrollConfig = mongoose.models.PayrollConfig || mongoose.model<IPayrollConfig, PayrollConfigModel>("PayrollConfig", payrollConfigSchema);
export default PayrollConfig; 