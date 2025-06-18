/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface INote extends IBaseModel {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  visibility: string; // 'Private', 'Public', 'Shared'
  sharedWith?: {
    users: mongoose.Types.ObjectId[];
    positions: mongoose.Types.ObjectId[];
    teams: mongoose.Types.ObjectId[];
    departments: mongoose.Types.ObjectId[];
    hourGroups: mongoose.Types.ObjectId[];
    access: mongoose.Types.ObjectId[];
    bonusCategories: mongoose.Types.ObjectId[];
  };

  attachments?: mongoose.Types.ObjectId[]; // Related Document entity

}


export type INoteMethods = {};

export type NoteModel = Model<INote, {}, INoteMethods>;

const noteSchema = new Schema<INote, NoteModel, INoteMethods>(
  {
    title: {
      type: String,
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
    visibility: {
      type: String,
      enum: ["Private", "Public", "Shared"],
      default: "Private",
    },
    sharedWith: 
    {
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
        teams: {
          type: [Schema.Types.ObjectId],
          ref: "Team",
          default: [],
        },
        departments: {
          type: [Schema.Types.ObjectId],
          ref: "Department",
          default: [],
        },
        hourGroups: {
          type: [Schema.Types.ObjectId],
          ref: "HourGroup",
          default: [],
        },
        access: {
          type: [Schema.Types.ObjectId],
          ref: "Access",
          default: [],
        },
        bonusCategories: {
          type: [Schema.Types.ObjectId],
          ref: "BonusCategory",
          default: [],
        }
      },
      required: false,
      default: {
        users: [],
        positions: [],
        teams: [],
        departments: [],
        hourGroups: [],
        access: [],
      }
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

noteSchema.plugin(toJSON);
noteSchema.plugin(paginate);
noteSchema.plugin(documentReferencePlugin);

const Note =
  mongoose.models.Note || mongoose.model<INote, NoteModel>("Note", noteSchema);
export default Note;
