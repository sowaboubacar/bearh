/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IKpiScore {
  criterionName: string;
  score: number;
}

export interface IKpiValue extends IBaseModel {
  kpiForm: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId; // The associated user
  scores: IKpiScore[];
  meanScore: number; // The mean of all the scores (need for calculation of prime)
  evaluator: mongoose.Types.ObjectId;

  // Candidate to be removed
  totalScore?: number;
  evaluationDate?: Date; 
}

export type IKpiValueMethods = {};

export type KpiValueModel = Model<IKpiValue, {}, IKpiValueMethods>;

const kpiScoreSchema = new Schema<IKpiScore>(
  {
    criterionName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const kpiValueSchema = new Schema<IKpiValue, KpiValueModel, IKpiValueMethods>(
  {
    kpiForm: {
      type: Schema.Types.ObjectId,
      ref: "KpiForm",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scores: [kpiScoreSchema],
    meanScore: {
      type: Number,
    },
    evaluator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add a hooks to calculate the mean score
kpiValueSchema.pre("save", function (next) {
  const kpiValue = this as IKpiValue;
  kpiValue.meanScore = kpiValue.scores.reduce(
    (acc, curr) => acc + curr.score,
    0
  );
  kpiValue.meanScore /= kpiValue.scores.length;

  // We have to compute here the total score
  next();
});

kpiValueSchema.plugin(toJSON);
kpiValueSchema.plugin(paginate);

const KpiValue =
  mongoose.models.KpiValue ||
  mongoose.model<IKpiValue, KpiValueModel>("KpiValue", kpiValueSchema);
export default KpiValue;



