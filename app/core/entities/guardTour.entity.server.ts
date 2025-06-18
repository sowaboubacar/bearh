/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IGuardTour extends IBaseModel {
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export type IGuardTourMethods = {};

export type GuardTourModel = Model<IGuardTour, {}, IGuardTourMethods>;

const guardTourSchema = new Schema<
  IGuardTour,
  GuardTourModel,
  IGuardTourMethods
>(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

guardTourSchema.plugin(toJSON);
guardTourSchema.plugin(paginate);

const GuardTour =
  mongoose.models.GuardTour ||
  mongoose.model<IGuardTour, GuardTourModel>("GuardTour", guardTourSchema);
export default GuardTour;
