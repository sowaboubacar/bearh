/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IEnterpriseVideo extends IBaseModel {
  title: string;
  description?: string;
  attachments?: mongoose.Types.ObjectId[];
  uploadedBy: mongoose.Types.ObjectId;
}

export type IEnterpriseVideoMethods = {};

export type EnterpriseVideoModel = Model<
  IEnterpriseVideo,
  {},
  IEnterpriseVideoMethods
>;

const enterpriseVideoSchema = new Schema<
  IEnterpriseVideo,
  EnterpriseVideoModel,
  IEnterpriseVideoMethods
>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

enterpriseVideoSchema.plugin(toJSON);
enterpriseVideoSchema.plugin(paginate);
enterpriseVideoSchema.plugin(documentReferencePlugin);  

const EnterpriseVideo =
  mongoose.models.EnterpriseVideo ||
  mongoose.model<IEnterpriseVideo, EnterpriseVideoModel>(
    "EnterpriseVideo",
    enterpriseVideoSchema
  );
export default EnterpriseVideo;