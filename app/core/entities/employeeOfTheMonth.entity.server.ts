/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IVote {
  voter: mongoose.Types.ObjectId; // ID of the voter (manager or user)
  voteValue: number; // Value of the vote (e.g., weight of the vote. Can be -1, 0, or 1)
  votedAt: Date; // Date when the vote was cast
}

export interface IEmployeeOfTheMonth extends IBaseModel {
  employee: mongoose.Types.ObjectId; // ID of the designated employee
  isWinner: boolean; // Has the employee been designated as Employee of the Month?
  message: string; // Congratulations message
  metrics: { [key: string]: number }; // Metrics that contributed to selection
  votes: IVote[]; // List of votes cast for the employee
  nominationDate: Date; // Date when the employee was nominated
  finalizationDate?: Date; // Date when the winner was selected
}

export type IEmployeeOfTheMonthMethods = {};

export type EmployeeOfTheMonthModel = Model<
  IEmployeeOfTheMonth,
  {},
  IEmployeeOfTheMonthMethods
>;

const voteSchema = new Schema<IVote>(
  {
    voter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voteValue: {
      type: Number,
      required: true,
      enum: [-1, 0, 1],
    },
    votedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false } // Embedded document, no separate _id field
);

const employeeOfTheMonthSchema = new Schema<
  IEmployeeOfTheMonth,
  EmployeeOfTheMonthModel,
  IEmployeeOfTheMonthMethods
>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isWinner: {
      type: Boolean,
      required: true,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
    metrics: {
      type: Map,
      of: Number,
      required: true,
    },
    votes: [voteSchema],
    nominationDate: { // Nomination means when the employee was nominated to participate to vote
      type: Date,
      required: true,
    },
    finalizationDate: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

employeeOfTheMonthSchema.plugin(toJSON);
employeeOfTheMonthSchema.plugin(paginate);

const EmployeeOfTheMonth =
  mongoose.models.EmployeeOfTheMonth ||
  mongoose.model<IEmployeeOfTheMonth, EmployeeOfTheMonthModel>(
    "EmployeeOfTheMonth",
    employeeOfTheMonthSchema
  );

export default EmployeeOfTheMonth;