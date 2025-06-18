/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IPermissionAndLeave extends IBaseModel {
  user: mongoose.Types.ObjectId;
  type: string; // 'Permission', 'Leave'
  startDate: Date;
  endDate: Date;
  reason: string;
  status: string; // 'Pending', 'Approved', 'Rejected'
  approver?: mongoose.Types.ObjectId;

  attachments?: mongoose.Types.ObjectId[]; // Reference to Document entity
}

export type IPermissionAndLeaveMethods = {};

export type PermissionAndLeaveModel = Model<
  IPermissionAndLeave,
  {},
  IPermissionAndLeaveMethods
>;

const permissionAndLeaveSchema = new Schema<
  IPermissionAndLeave,
  PermissionAndLeaveModel,
  IPermissionAndLeaveMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Permission", "Leave"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
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

permissionAndLeaveSchema.plugin(toJSON);
permissionAndLeaveSchema.plugin(paginate);
permissionAndLeaveSchema.plugin(documentReferencePlugin);

const PermissionAndLeave =
  mongoose.models.PermissionAndLeave ||
  mongoose.model<IPermissionAndLeave, PermissionAndLeaveModel>(
    "PermissionAndLeave",
    permissionAndLeaveSchema
  );
export default PermissionAndLeave;
