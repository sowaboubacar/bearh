/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IUserMonthlyReport extends IBaseModel {
  user: mongoose.Types.ObjectId; // The user id the report is for

  month: number; // The month the report is for
  year: number; // The year the report is for

  attendanceData: Record<string, any>; // Contains report and metrics about the user attendance for the month
  taskData: Record<string, any>; // Contains report and metrics about the user tasks for the month
  performanceData: Record<string, any>; // Contains report and metrics about the user performance for the month
  leaveData: Record<string, any>; // Contains report and metrics about the user leaves for the month
  observationData: Record<string, any>; // Contains report and metrics about the user observations for the month
}

export type IUserMonthlyReportMethods = {};

export type UserMonthlyReportModel = Model<
  IUserMonthlyReport,
  {},
  IUserMonthlyReportMethods
>;

const userMonthlyReportSchema = new Schema<
  IUserMonthlyReport,
  UserMonthlyReportModel,
  IUserMonthlyReportMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    attendanceData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    performanceData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    leaveData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    observationData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    taskData: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userMonthlyReportSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

userMonthlyReportSchema.plugin(toJSON);
userMonthlyReportSchema.plugin(paginate);

const UserMonthlyReport =
  mongoose.models.UserMonthlyReport ||
  mongoose.model<IUserMonthlyReport, UserMonthlyReportModel>(
    "UserMonthlyReport",
    userMonthlyReportSchema
  );
export default UserMonthlyReport;