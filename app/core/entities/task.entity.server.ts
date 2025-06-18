/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface ITask extends IBaseModel {
  title: string;
  description?: string;
  assignedTo?: {
    users: mongoose.Types.ObjectId[];
    positions: mongoose.Types.ObjectId[];
    teams: mongoose.Types.ObjectId[];
    departments: mongoose.Types.ObjectId[];
    hourGroups: mongoose.Types.ObjectId[];
    access: mongoose.Types.ObjectId[];
    bonusCategories: mongoose.Types.ObjectId[];
  };
  status: string; // 'To Do', 'In Progress', 'Completed'
  dueDate?: Date;
  author: mongoose.Types.ObjectId

  // A recurring task is a task is a task which is not intented to be completed
  // Instead when user completes the task, the task is cloned and saved into the database as completed task
  // The same logic when the task's status is changed, the task is cloned and saved into the database as a new task with the new status
  isRecurrent?: boolean; 
  completedBy?: mongoose.Types.ObjectId; // The user who completed the task
  completedAt?: Date; // The date when the task was completed
  startedBy?: mongoose.Types.ObjectId; // The user who started the task
  startedAt?: Date; // The date when the task was started
}

export type ITaskMethods = {};

export type TaskModel = Model<ITask, {}, ITaskMethods>;

const taskSchema = new Schema<ITask, TaskModel, ITaskMethods>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assignedTo:
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
          bonusCategories: [],
        }
      },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Completed"],
      default: "To Do",
    },
    dueDate: {
      type: Date,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required  : true
    },
    isRecurrent: {
      type: Boolean,
      default: false,
    },

    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
    },
    startedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    startedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.plugin(toJSON);
taskSchema.plugin(paginate);

const Task =
  mongoose.models.Task || mongoose.model<ITask, TaskModel>("Task", taskSchema);
export default Task;
