/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
export interface IPatrimoineType extends IBaseModel {
  name: string;
  description?: string;
}

export type IPatrimoineTypeMethods = {};

export type PatrimoineTypeModel = Model<
  IPatrimoineType,
  {},
  IPatrimoineTypeMethods
>;

const patrimoineTypeSchema = new Schema<
  IPatrimoineType,
  PatrimoineTypeModel,
  IPatrimoineTypeMethods
>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

patrimoineTypeSchema.plugin(toJSON);
patrimoineTypeSchema.plugin(paginate);

const PatrimoineType =
  mongoose.models.PatrimoineType ||
  mongoose.model<IPatrimoineType, PatrimoineTypeModel>(
    "PatrimoineType",
    patrimoineTypeSchema
  );
export default PatrimoineType;
