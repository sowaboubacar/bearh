/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from 'mongoose';
import toJSON from '~/core/db/plugins/toJSON.plugin.server';
import paginate from '../db/plugins/paginate.plugin.server';
import { IBaseModel } from '../abstracts/model.server';

export interface IError {
  userId: string;
  error: string;
}

export interface IPrimeCronJob extends IBaseModel {
  jobId: string;
  status: 'in-progress' | 'completed';
  startDate: Date;
  endDate: Date;
  remainingUsers: mongoose.Types.ObjectId[];
  completedUsers: mongoose.Types.ObjectId[];
  errorsDetails: IError[];
}

export type IPrimeCronJobMethods = {};

export type PrimeCronJobModel = Model<IPrimeCronJob, {}, IPrimeCronJobMethods>;

const errorSchema = new Schema<IError>(
  {
    userId: { type: String, required: true },
    error: { type: String, required: true },
  },
  { _id: false }
);

const primeCronJobSchema = new Schema<IPrimeCronJob, PrimeCronJobModel, IPrimeCronJobMethods>(
  {
    jobId: { type: String, required: true },
    status: { type: String, enum: ['in-progress', 'completed'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    remainingUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    completedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    errorsDetails: [errorSchema],
  },
  {
    timestamps: true,
  }
);

primeCronJobSchema.plugin(toJSON);
primeCronJobSchema.plugin(paginate);

const PrimeCronJob =
  mongoose.models.PrimeCronJob ||
  mongoose.model<IPrimeCronJob, PrimeCronJobModel>('PrimeCronJob', primeCronJobSchema);

export default PrimeCronJob;