/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface ITeam extends IBaseModel {
  name: string;
  description?: string;
  leader?: mongoose.Types.ObjectId ;

  members?: mongoose.Types.ObjectId[];
  attachments?: mongoose.Types.ObjectId[];
}

export type ITeamMethods = {};

export type TeamModel = Model<ITeam, {}, ITeamMethods>;

const teamSchema = new Schema<ITeam, TeamModel, ITeamMethods>(
  {
    name: {
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
    leader: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);



teamSchema.plugin(toJSON);
teamSchema.plugin(paginate);
teamSchema.plugin(documentReferencePlugin);

const Team =
  mongoose.models.Team || mongoose.model<ITeam, TeamModel>("Team", teamSchema);
export default Team;
