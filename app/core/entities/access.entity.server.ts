/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { AccessPermission } from "./utils/access-permission";

export interface IAccess extends IBaseModel {
  name: string;
  description?: string;
  permissions: AccessPermission;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;


  // Candidate to deletion
  user?: mongoose.Types.ObjectId;
  position?: mongoose.Types.ObjectId;
  team?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
}

export type IAccessMethods = {};

export type AccessModel = Model<IAccess, {}, IAccessMethods>;

const accessSchema = new Schema<IAccess, AccessModel, IAccessMethods>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: "Position",
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    permissions: {
      user: [{ type: String }],
      pointage: [{ type: String }],
      access: [{ type: String }],
      candidate: [{ type: String }],
      department: [{ type: String }],
      team: [{ type: String }],
      kpiForm: [{ type: String }],
      kpiValue: [{ type: String }],
      news: [{ type: String }],
      note: [{ type: String }],
      patrimoine: [{ type: String }],
      pause: [{ type: String }],
      permissions: [{ type: String }],
      presence: [{ type: String }],
      position: [{ type: String }],
      task: [{ type: String }],
      systemConfig: [{ type: String }],
      hourGroup: [{ type: String }],
      guardTour: [{ type: String }],
      expenseReport: [{ type: String }],
      enterpriseVideo: [{ type: String }],
      collaboratorVideo: [{ type: String }],
      document: [{ type: String }],
      auth: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

accessSchema.plugin(toJSON);
accessSchema.plugin(paginate);

const Access =
  mongoose.models.Access ||
  mongoose.model<IAccess, AccessModel>("Access", accessSchema);
export default Access;
