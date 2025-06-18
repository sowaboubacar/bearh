/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

export interface INews extends IBaseModel {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  type: string; // 'Announcement', 'Event', etc.
  isPublished: boolean; // true if published, false if draft
  isPublic: boolean; // true if public, false if private (and that case, only targetAudience can see)
  isEmergency: boolean; // true if emergency news
  targetAudience?: {
    users: mongoose.Types.ObjectId[];
    positions: mongoose.Types.ObjectId[];
    teams: mongoose.Types.ObjectId[];
    departments: mongoose.Types.ObjectId[];
    hourGroups: mongoose.Types.ObjectId[];
    access: mongoose.Types.ObjectId[];
    bonusCategories: mongoose.Types.ObjectId[];
  };
  attachments?: mongoose.Types.ObjectId[]; // related to Documents entity
  publishedAt: Date;
}

export type INewsMethods = {};

export type NewsModel = Model<INews, {}, INewsMethods>;

const newsSchema = new Schema<INews, NewsModel, INewsMethods>(
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
    isEmergency: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: [
        "Announcement",
        "Event",
        "Update",
        "Annonce",
        "Événement",
        "Sécurité",
        "Politique",
        "Équipe",
        "Produit",
        "Sensibilisation",
        "Réunion",
        "Formation",
        "Succès",
        "Partenariat",
        "Développement Durable",
        "Bien-être",
        "Reconnaissance",
        "Structure",
      ],
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
    },
    targetAudience: {
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
        bonusCategoryService: {
          type: [Schema.Types.ObjectId],
          ref: "BonusCategory",
          default: [],
        },
      },
      required: false,
      default: {
        users: [],
        positions: [],
        teams: [],
        departments: [],
        hourGroups: [],
        access: [],
        bonusCategories: [],
      },
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

newsSchema.plugin(toJSON);
newsSchema.plugin(paginate);
newsSchema.plugin(documentReferencePlugin);

const News =
  mongoose.models.News || mongoose.model<INews, NewsModel>("News", newsSchema);
export default News;
