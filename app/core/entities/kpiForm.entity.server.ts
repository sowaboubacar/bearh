/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IKpiCriterion {
  name: string;
  maxScore: number;
  description?: string;
}

export interface IKpiForm extends IBaseModel {
  title: string;
  description?: string;
  criteria: IKpiCriterion[];
  applicableTo?: {
    users: mongoose.Types.ObjectId[];
    positions: mongoose.Types.ObjectId[];
  };
  createdBy: mongoose.Types.ObjectId;
}

export type IKpiFormMethods = {};

export type KpiFormModel = Model<IKpiForm, {}, IKpiFormMethods>;

const kpiCriterionSchema = new Schema<IKpiCriterion>(
  {
    name: {
      type: String,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { _id: false }
);

const kpiFormSchema = new Schema<IKpiForm, KpiFormModel, IKpiFormMethods>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    criteria: [kpiCriterionSchema],
    applicableTo: {
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
      },
      required: false,
      default: {
        users: [],
        positions: [],
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

kpiFormSchema.plugin(toJSON);
kpiFormSchema.plugin(paginate);

const KpiForm =
  mongoose.models.KpiForm ||
  mongoose.model<IKpiForm, KpiFormModel>("KpiForm", kpiFormSchema);
export default KpiForm;
