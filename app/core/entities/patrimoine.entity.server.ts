/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IPatrimoine extends IBaseModel {
  name: string;
  type: mongoose.Types.ObjectId;
  purchaseDate: Date;
  status: string; // 'Active', 'Under Maintenance', 'Out of Service'
  attachments?: mongoose.Types.ObjectId[];
  assignedTo?: {
    users: mongoose.Types.ObjectId[];
    positions: mongoose.Types.ObjectId[];
    teams: mongoose.Types.ObjectId[];
    departments: mongoose.Types.ObjectId[];
    hourGroups: mongoose.Types.ObjectId[];
    access: mongoose.Types.ObjectId[];
  }
}

export type IPatrimoineMethods = {};

export type PatrimoineModel = Model<IPatrimoine, {}, IPatrimoineMethods>;

const patrimoineSchema = new Schema<
  IPatrimoine,
  PatrimoineModel,
  IPatrimoineMethods
>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: Schema.Types.ObjectId,
      ref: "PatrimoineType",
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Under Maintenance", "Out of Service"],
      default: "Active",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    assignedTo:{
      type: {
        users: {
          type: [Schema.Types.ObjectId],
          ref: "User",
          default: [],
        },
        positions: {
          type: [Schema.Types.ObjectId],
          ref: "Position",
          default: [],
        },
        teams: {
          type: [Schema.Types.ObjectId],
          ref: "Team",
          default: [],
        },
        departments: {
          type: [Schema.Types.ObjectId],
          ref: "Department",
          default: [],
        },
        hourGroups: {
          type: [Schema.Types.ObjectId],
          ref: "HourGroup",
          default: [],
        },
        access: {
          type: [Schema.Types.ObjectId],
          ref: "Access",
          default: [],
        },
      },
      required: false,
      default: {
        users: [],
        positions: [],
        teams: [],
        departments: [],
        hourGroups: [],
        access: [],
      }
    },
  },
  {
    timestamps: true,
  }
);

patrimoineSchema.plugin(toJSON);
patrimoineSchema.plugin(paginate);
patrimoineSchema.plugin(documentReferencePlugin);

const Patrimoine =
  mongoose.models.Patrimoine ||
  mongoose.model<IPatrimoine, PatrimoineModel>("Patrimoine", patrimoineSchema);
export default Patrimoine;
