/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IUserSession extends IBaseModel {
  data: Record<string, unknown>; // To store flexible session data
  expires: Date; // Expiration date for the session
}

export type IUserSessionMethods = {};

export type UserSessionModel = Model<IUserSession, {}, IUserSessionMethods>;

const userSessionSchema = new Schema<
  IUserSession,
  UserSessionModel,
  IUserSessionMethods
>(
  {
    data: {
     type: Schema.Types.Mixed, // Allows for any data type
      required: true,
      default: {},
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt`
    
  }
);

// Add plugins to enhance schema functionality
userSessionSchema.plugin(toJSON); // Converts Mongoose documents to JSON
userSessionSchema.plugin(paginate); // Adds pagination functionality

// Create or reuse the UserSession model
const UserSession =
  mongoose.models.UserSession ||
  mongoose.model<IUserSession, UserSessionModel>("UserSession", userSessionSchema);

export default UserSession;
