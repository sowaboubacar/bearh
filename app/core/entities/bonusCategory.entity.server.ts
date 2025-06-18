/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
/**
 * Entity Category. Allow to categorize the employees when needed to calculate the bonus.
 * 
 * ```latex
 *   TotalBonusAmount  =  baseAmount + coefficient * means(kpi1, kpi2, kpi3, ...) 
 *  + remarkBonusAmount * [sum(remark1, remark2, remark3, ...)]
 *  ```  
 */
export interface IBonusCategory extends IBaseModel {
  name?: string;
  baseAmount: number;
  remarkBonusAmount: number; // How many cost a positive remark in FCFA. A negative remark will be the opposite of this value.
  coefficient: number; // The coefficient to apply to the base amount to get the total amount.
  

  // Users in this category
  members?: mongoose.Types.ObjectId[];
}

export type IBonusCategoryMethods = {};

export type BonusCategoryModel = Model<IBonusCategory, {}, IBonusCategoryMethods>;

const bonusCategorySchema = new Schema<IBonusCategory, BonusCategoryModel, IBonusCategoryMethods>(
  {
    name: {
      type: String,
      required: true,
    },
    baseAmount: {
      type: Number,
      required: true,
    },
    remarkBonusAmount: {
      type: Number,
      required: true,
    },
    coefficient: {
      type: Number,
      required: true
    },
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

bonusCategorySchema.plugin(toJSON);
bonusCategorySchema.plugin(paginate);

const BonusCategory =
  mongoose.models.BonusCategory || mongoose.model<IBonusCategory, BonusCategoryModel>("BonusCategory", bonusCategorySchema);
export default BonusCategory;