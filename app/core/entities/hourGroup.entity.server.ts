/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "~/core/db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";

/**
 * Represente un crénau de travail qui peut contenir une pause (début et fin)
 */
export interface IWorkTime {
  date: Date;
  startAt: string;
  endAt: string;
  restShouldStartAt?: string;
  restShouldEndAt?: string;
}

export interface IHourGroup extends IBaseModel {
  name: string;
  note?: string;
  members?: mongoose.Types.ObjectId[];
  attachments?: mongoose.Types.ObjectId[];
  startAt: Date;
  endAt: Date;
  restShouldStartAt?: string; // Heure de début de la pause pour tous les jours si un crénau ne précise pas de pause
  restShouldEndAt?: string; // Heure de fin de la pause pour tous les jours si un crénau ne précise pas de pause
  workTimes: IWorkTime[]; // Tous les crénaux de travail de ce groupe qui peuvent s'etendre sur plusieurs jours
}


export type IHourGroupMethods = {};

export type HourGroupModel = Model<IHourGroup, {}, IHourGroupMethods>;

const workTimeSchema = new Schema<IWorkTime>({
  date: { type: Date, required: true },
  startAt: { type: String, required: true },
  endAt: { type: String, required: true },
  restShouldStartAt: { type: String },
  restShouldEndAt: { type: String },
});

const hourGroupSchema = new Schema<IHourGroup, HourGroupModel, IHourGroupMethods>(
  {
    name: {
      type: String,
    },
    note: {
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
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    restShouldStartAt: {
      type: String,
    },
    restShouldEndAt: {
      type: String,
    },
    workTimes: [workTimeSchema],
  },
  {
    timestamps: true,
  }
);

hourGroupSchema.plugin(toJSON);
hourGroupSchema.plugin(paginate);
hourGroupSchema.plugin(documentReferencePlugin);

// Auto-generate name based on startAt and endAt
hourGroupSchema.pre('save', function(next) {
  if (!this.name) {
    const startDate = this.startAt.toLocaleDateString('fr-FR');
    const endDate = this.endAt.toLocaleDateString('fr-FR');
    this.name = `Emploi du temps du ${startDate} au ${endDate}`;
  }
  next();
});

const HourGroup =
  mongoose.models.HourGroup ||
  mongoose.model<IHourGroup, HourGroupModel>("HourGroup", hourGroupSchema);

export default HourGroup;

