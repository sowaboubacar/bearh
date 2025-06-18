/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IExpenseItem {
  description: string;
  amount: number;
  receipt?: mongoose.Types.ObjectId; // Reference to Document entity
}

export interface IExpenseReport extends IBaseModel {
  user: mongoose.Types.ObjectId; // Related to User entity
  items: IExpenseItem[];
  totalAmount: number;
  submissionDate: Date;
  status: string; // 'Pending', 'Approved', 'Rejected'
  approver?: mongoose.Types.ObjectId; // Reference to User who approved the report

  attachments?: mongoose.Types.ObjectId[]; // Reference to Document entity
}

export type IExpenseReportMethods = {};

export type ExpenseReportModel = Model<
  IExpenseReport,
  {},
  IExpenseReportMethods
>;

const expenseItemSchema = new Schema<IExpenseItem>(
  {
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    receipt: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
  },
  { _id: false }
);

const expenseReportSchema = new Schema<
  IExpenseReport,
  ExpenseReportModel,
  IExpenseReportMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [expenseItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    submissionDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approver: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
  },
  {
    timestamps: true,
  }
);

expenseReportSchema.plugin(toJSON);
expenseReportSchema.plugin(paginate);
expenseReportSchema.plugin(documentReferencePlugin);

const ExpenseReport =
  mongoose.models.ExpenseReport ||
  mongoose.model<IExpenseReport, ExpenseReportModel>(
    "ExpenseReport",
    expenseReportSchema
  );
export default ExpenseReport;
