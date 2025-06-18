/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IDepartment extends IBaseModel {
  name: string;
  description?: string;
  manager?: mongoose.Types.ObjectId;
  members?: mongoose.Types.ObjectId[];
  attachments?: mongoose.Types.ObjectId[];
}

export type IDepartmentMethods = {};

export type DepartmentModel = Model<IDepartment, {}, IDepartmentMethods>;

const departmentSchema = new Schema<
  IDepartment,
  DepartmentModel,
  IDepartmentMethods
>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

departmentSchema.plugin(toJSON);
departmentSchema.plugin(paginate);
departmentSchema.plugin(documentReferencePlugin);

const Department =
  mongoose.models.Department ||
  mongoose.model<IDepartment, DepartmentModel>("Department", departmentSchema);
export default Department;
