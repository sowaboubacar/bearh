/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";
export interface ICollaboratorVideo extends IBaseModel {
  user: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  attachments?: mongoose.Types.ObjectId[];
  uploadedBy: mongoose.Types.ObjectId;
}

export type ICollaboratorVideoMethods = {};

export type CollaboratorVideoModel = Model<
  ICollaboratorVideo,
  {},
  ICollaboratorVideoMethods
>;

const collaboratorVideoSchema = new Schema<
  ICollaboratorVideo,
  CollaboratorVideoModel,
  ICollaboratorVideoMethods
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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

collaboratorVideoSchema.plugin(toJSON);
collaboratorVideoSchema.plugin(paginate);
collaboratorVideoSchema.plugin(documentReferencePlugin);


const CollaboratorVideo =
  mongoose.models.CollaboratorVideo ||
  mongoose.model<ICollaboratorVideo, CollaboratorVideoModel>(
    "CollaboratorVideo",
    collaboratorVideoSchema
  );
export default CollaboratorVideo;