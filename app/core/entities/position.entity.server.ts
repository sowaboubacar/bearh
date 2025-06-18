/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface IPosition extends IBaseModel {
  title: string;
  description?: string;
  access?: mongoose.Types.ObjectId;// Is related to access entity, need to check
  
  attachments?: mongoose.Types.ObjectId[];
  members?: mongoose.Types.ObjectId[];
}

export type IPositionMethods = {};

export type PositionModel = Model<IPosition, {}, IPositionMethods>;

const positionSchema = new Schema<IPosition, PositionModel, IPositionMethods>(
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
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    access: 
      {
        type: Schema.Types.ObjectId,
        ref: "Access",
      },
    
  },
  {
    timestamps: true,
  }
);

positionSchema.plugin(toJSON);
positionSchema.plugin(paginate);
positionSchema.plugin(documentReferencePlugin);

const Position =
  mongoose.models.Position ||
  mongoose.model<IPosition, PositionModel>("Position", positionSchema);
export default Position;
