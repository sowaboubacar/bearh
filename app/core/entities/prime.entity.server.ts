/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";


/**
 * Entity Prime. Allow to calculate the prime of a user based on the KPI values and observations.
 * Prime are calculated using a formula that can be changed at any time.
 * The calculation is done automatically by the system each 1st of the month at 00:00 for the previous month.
 */
export interface IPrime extends IBaseModel {
  user: mongoose.Types.ObjectId; // User ID
  calculationDetails: {
    kpiValue: mongoose.Types.ObjectId;
    bonusCategory: mongoose.Types.ObjectId;
    observations: mongoose.Types.ObjectId[];
    formula: string;
  }
  startTrackingDate: Date; // the lowest date of creation of the observations or kpi value used in the calculation
  endTrackingDate: Date; // the highest date of creation of the observations or kpi value used in the calculation
  totalAmount: number; // The total amount of the prime which is the result of the calculation using the formula
  calculationDate: Date; // The date of the calculation (1st of the month at 00:00). Will be set by the system
}

export type IPrimeMethods = {};

export type PrimeModel = Model<IPrime, {}, IPrimeMethods>;

const primeSchema = new Schema<IPrime, PrimeModel, IPrimeMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    calculationDetails: {
      kpiValue: {
        type: Schema.Types.ObjectId,
        ref: "KpiValue",
        required: true,
      },
      bonusCategory: {
        type: Schema.Types.ObjectId,
        ref: "BonusCategory",
        required: true,
      },
      observations: [
        {
          type: Schema.Types.ObjectId,
          ref: "Observation",
          default: [],
        },
      ],
      formula: {
        type: String,
        required: true,
      },
    },
    startTrackingDate: {
      type: Date,
      required: true,
    },
    endTrackingDate: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    calculationDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

primeSchema.plugin(toJSON);
primeSchema.plugin(paginate);

const Prime =
  mongoose.models.Prime || mongoose.model<IPrime, PrimeModel>("Prime", primeSchema);
export default Prime;