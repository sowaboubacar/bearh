/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "~/core/db/plugins/paginate.plugin.server";
import { documentReferencePlugin } from "../db/plugins/documentReferencePlugin";
import { first } from "lodash";
import { EarningItem } from "~/types/payslip";
import { DeductionItem } from "~/types/payslip";

export interface IUser extends IBaseModel {
  employeeID: string; // ID of the employee in the payroll system and other systems (not this DB id). It's a 6 unique alphanumeric number
  firstName: string;
  lastName: string;
  avatar: mongoose.Types.ObjectId; // Related to Document entity
  email: string;
  pin: string;
  password: string;
  // 'employee', 'pharmacy-owner' Default is 'employee'.
  // Employee is the default role for all users
  // When access rules matters, pharmacy-owner is not subject to any access rules
  role: string;

  // Custom fields for payroll for the user to include each time in his payslip
  payroll: {
    earnings: EarningItem[]
    deductions: DeductionItem[]
  };
  
  currentPosition?: mongoose.Types.ObjectId; // This is updated each time the user is added as a member of a position
  positionsTraces?: {
    position: mongoose.Types.ObjectId;
    at: Date;
  }[]; // Each time the user is added as a member of a position, this fields is updated along with the above (currentPosition field)

  currentDepartment?: mongoose.Types.ObjectId;
  departmentsTraces?: {
    department: mongoose.Types.ObjectId;
    at: Date;
  }[];

  currentTeam?: mongoose.Types.ObjectId;
  teamsTraces?: {
    team: mongoose.Types.ObjectId;
    at: Date;
  }[];

  currentHourGroup?: mongoose.Types.ObjectId;
  hourGroupsTraces?: {
    hourGroup: mongoose.Types.ObjectId;
    at: Date;
  }[];

  currentBonusCategory?: mongoose.Types.ObjectId;
  bonusCategoriesTraces?: {
    bonusCategory: mongoose.Types.ObjectId;
    at: Date;
  }[];

  documents?: mongoose.Types.ObjectId[]; // Contains all document ids related to the user (CV, Payslip, etc.). Related to Document entity
  access?: mongoose.Types.ObjectId; // Related to Access entity. It define the access level of the user
  status?: string; // 'present', 'absent', 'left', 'onLeave', 'permission','sickLeave', 'workFromHome', 'traveling', 'remote'

  supervisors?: mongoose.Types.ObjectId[]; // Related to User entity. It's the direct supervisor of the user
}

export type IUserMethods = {
  /**
   * Check if password matches the user's password
   *
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  isPasswordMatch(password: string): Promise<boolean>;

  /**
   * Check if pin matches the user's pin
   *
   * @param {string} pin
   * @returns {Promise<boolean>}
   */
  isPinMatch(pin: string): Promise<boolean>;
};

export type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    // employeeID: {
    //   type: String,
    //   //required: true,
    //   unique: true,
    // },
    status: {
      type: String,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: Schema.Types.ObjectId,
      ref: "Document",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    pin: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["employee", "pharmacy-owner",
        // To delete in prod after deploy
        "admin","manager"
      ],
      default: "employee",
    },
    supervisors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    access: {
      type: Schema.Types.ObjectId,
      ref: "Access",
    },

    currentPosition: {
      type: Schema.Types.ObjectId,
      ref: "Position",
    },
    positionsTraces: {
      type: [
        {
          position: {
            type: Schema.Types.ObjectId,
            ref: "Position",
          },
          at: {
            type: Date,
          },
        },
      ],
      default: [],
    },

    currentDepartment: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    departmentsTraces: {
      type: [
        {
          department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
          },
          at: {
            type: Date,
          },
        },
      ],
      default: [],
    },

    currentTeam: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    teamsTraces: {
      type: [
        {
          team: {
            type: Schema.Types.ObjectId,
            ref: "Team",
          },
          at: {
            type: Date,
          },
          default: {},
        },
      ],
      default: [],
    },

    currentHourGroup: {
      type: Schema.Types.ObjectId,
      ref: "HourGroup",
    },
    hourGroupsTraces: {
      type: [
        {
          hourGroup: {
            type: Schema.Types.ObjectId,
            ref: "HourGroup",
          },
          at: {
            type: Date,
          },
          default: {},
        },
      ],
      default: [],
    },

    currentBonusCategory: {
      type: Schema.Types.ObjectId,
      ref: "BonusCategory",
    },
    bonusCategoriesTraces: {
      type: [
        {
          type: {
            bonusCategory: {
              type: Schema.Types.ObjectId,
              ref: "BonusCategory",
            },
            at: {
              type: Date,
            },
          },
          default: {},
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/** Method isPasswordMatch */
userSchema.method(
  "isPasswordMatch",
  async function isPasswordMatch(password: string) {
    return bcrypt.compare(password, this.password);
  }
);

/** Method isPinMatch */
userSchema.method("isPinMatch", async function isPinMatch(pin: string) {
  return bcrypt.compare(pin, this.pin);
});

// Pre-save hook to hash sensitive fields and generate employeeID if needed
userSchema.pre("save", async function (next) {
  const user = this as IUser & mongoose.Document;

  if (!user.employeeID) {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const generateID = () => {
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    // Keep generating until we find a unique ID
    let newID;
    do {
      newID = generateID();
      // Check if ID exists
      const existingUser = await mongoose.model("User").findOne({ employeeID: newID });
      if (!existingUser) break;
    // eslint-disable-next-line no-constant-condition
    } while (true);

    user.employeeID = newID;
  }

  // Hash PIN if it is modified
  if (user.isModified("pin")) {
    user.pin = await bcrypt.hash(user.pin, 10);
  }

  // Hash password if it is modified
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  const password = update.password;
  const pin = update.pin;
  if (password) {
    update.password = await bcrypt.hash(password, 10);
  }

  if (pin) {
    update.pin = await bcrypt.hash(pin, 10);
  }
  next();
});

// Add plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);
userSchema.plugin(documentReferencePlugin);

// Add indexes to speed up queries
userSchema.index({ email: 1, role: 1, status: 1, firstName: 1, lastName: 1 });

const User =
  mongoose.models.User || mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
