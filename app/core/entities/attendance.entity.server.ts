/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

export interface IAttendanceRecord extends IBaseModel {
  user: mongoose.Types.ObjectId;
  date: Date;
  entries: {
    type: 'checkIn' | 'checkOut' | 'breakStart' | 'breakEnd';
    timestamp: Date;
  }[];
  status: 'present' | 'absent' | 'late' | 'onBreak';
  totalWorkTime?: number; // in minutes
  totalBreakTime?: number; // in minutes
  notes?: string;
}

export type IAttendanceRecordMethods = {
  addEntry: (type: 'checkIn' | 'checkOut' | 'breakStart' | 'breakEnd') => void;
  calculateTotalTimes: () => void;
};

export type AttendanceRecordModel = Model<IAttendanceRecord, {}, IAttendanceRecordMethods>;

const attendanceRecordSchema = new Schema<IAttendanceRecord, AttendanceRecordModel, IAttendanceRecordMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    entries: [{
      type: {
        type: String,
        enum: ['checkIn', 'checkOut', 'breakStart', 'breakEnd'],
        required: true,
      },
      timestamp: {
        type: Date,
        required: true,
      },
    }],
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'onBreak'],
      default: 'absent',
    },
    totalWorkTime: {
      type: Number,
      default: 0,
    },
    totalBreakTime: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

attendanceRecordSchema.method('addEntry', function(type: 'checkIn' | 'checkOut' | 'breakStart' | 'breakEnd') {
  this.entries.push({ type, timestamp: new Date() });
  this.calculateTotalTimes();
  
  if (type === 'checkIn') this.status = 'present';
  else if (type === 'checkOut') this.status = 'absent';
  else if (type === 'breakStart') this.status = 'onBreak';
  else if (type === 'breakEnd') this.status = 'present';
});

attendanceRecordSchema.method('calculateTotalTimes', function() {
  let workStart: Date | null = null;
  let breakStart: Date | null = null;
  let totalWorkTime = 0;
  let totalBreakTime = 0;

  for (const entry of this.entries) {
    if (entry.type === 'checkIn') {
      workStart = entry.timestamp;
    } else if (entry.type === 'checkOut' && workStart) {
      totalWorkTime += entry.timestamp.getTime() - workStart.getTime();
      workStart = null;
    } else if (entry.type === 'breakStart') {
      breakStart = entry.timestamp;
      if (workStart) {
        totalWorkTime += entry.timestamp.getTime() - workStart.getTime();
        workStart = null;
      }
    } else if (entry.type === 'breakEnd' && breakStart) {
      totalBreakTime += entry.timestamp.getTime() - breakStart.getTime();
      breakStart = null;
      workStart = entry.timestamp;
    }
  }

  this.totalWorkTime = Math.round(totalWorkTime / 60000); // Convert to minutes
  this.totalBreakTime = Math.round(totalBreakTime / 60000); // Convert to minutes
});

attendanceRecordSchema.plugin(toJSON);
attendanceRecordSchema.plugin(paginate);

const AttendanceRecord =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord, AttendanceRecordModel>("AttendanceRecord", attendanceRecordSchema);

export default AttendanceRecord;

