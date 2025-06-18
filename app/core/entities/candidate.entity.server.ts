/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model, plugin } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface ICandidate extends IBaseModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  positionApplied: string;
  attachments?: mongoose.Types.ObjectId[]; // Related Document entity
  status: string; // 'In Process', 'Rejected', 'Hired'
  applicationDate: Date;
  notes?: string;
}

export type ICandidateMethods = {};

export type CandidateModel = Model<ICandidate, {}, ICandidateMethods>;

const candidateSchema = new Schema<
  ICandidate,
  CandidateModel,
  ICandidateMethods
>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    positionApplied: {
      type: String,
      required: true,
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    status: {
      type: String,
      enum: ["In Process", "Rejected", "Hired"],
      default: "In Process",
    },
    applicationDate: {
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

candidateSchema.plugin(toJSON);
candidateSchema.plugin(paginate);
candidateSchema.plugin(documentReferencePlugin);

const Candidate =
  mongoose.models.Candidate ||
  mongoose.model<ICandidate, CandidateModel>("Candidate", candidateSchema);
export default Candidate;
