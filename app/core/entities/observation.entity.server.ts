/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";


export interface IObservation extends IBaseModel {
  user: mongoose.Types.ObjectId; // User which is observed. Related to User
  type: string; // 'Positive', 'Negative', 'Neutral'
  content: string;
  author: mongoose.Types.ObjectId; // Related to User
  attachments?: mongoose.Types.ObjectId[];
}

export type IObservationMethods = {};

export type ObservationModel = Model<IObservation, {}, IObservationMethods>;

const observationSchema = new Schema<
  IObservation,
  ObservationModel,
  IObservationMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Positive", "Negative","Neutral"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

observationSchema.plugin(toJSON);
observationSchema.plugin(paginate);
observationSchema.plugin(documentReferencePlugin);


const Observation =
  mongoose.models.Observation ||
  mongoose.model<IObservation, ObservationModel>(
    "Observation",
    observationSchema
  );
export default Observation;
