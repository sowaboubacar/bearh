/* eslint-disable @typescript-eslint/no-explicit-any */
import User, {
  IUser,
  IUserMethods,
  UserModel,
} from "~/core/entities/user.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import { generatePIN } from "~/core/utils/pin.server";
import { attendanceService } from "./attendance.service.server";
import { positionService } from "./position.service.server";
import { departmentService } from "./department.service.server";
import { teamService } from "./team.service.server";
import { primeService } from "./prime.service.server";
import { documentService } from "./document.service.server";
import { observationService } from "./observation.service.server";
import { taskService } from "./task.service.server";
import { noteService } from "./note.service.server";
import { collaboratorVideoService } from "./collaboratorVideo.service.server";
import { expenseReportService } from "./expenseReport.service.server";
import { kpiValueService } from "./kpiValue.service.server";
import { hourGroupService } from "./hourGroup.service.server";
import mongoose from "mongoose";

export default class UserService extends BaseService<
  IUser,
  IUserMethods,
  UserModel
> {
  constructor() {
    super(User);
  }

  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async updateCurrentPosition(id: string, userId: string): Promise<any> {
    const user = await this.updateOneAfterFindIt(userId, {
      currentPosition: id,
    });

    if (!user) return;

    if (!user.positionsTraces) {
      user.positionsTraces = [];
      user?.positionsTraces?.push({
        position: id,
        at: new Date(),
      });

      return await user?.save();
    } else {
      const haveAlreadyThisItem = user.positionsTraces.filter(
        (item) => item.position.toString() === id
      );

      if (haveAlreadyThisItem.length < 1) {
        // Push and update
        user?.positionsTraces?.push({
          position: id,
          at: new Date(),
        });

        return await user?.save();
      } else {
        return user;
      }
    }
  }

  async updateCurrentDepartment(id: string, userId: string): Promise<any> {
    console.log("Setting user current position");
    const user = await this.updateOneAfterFindIt(userId, {
      currentDepartment: id,
    });

    if (!user) return;

    if (!user.departmentsTraces) {
      user.departmentsTraces = [];
    }

    const haveAlreadyThisItem = user.departmentsTraces.filter(
      (item) => item.department.toString() === id
    );

    if (haveAlreadyThisItem.length < 1) {
      // Push and update
      user?.departmentsTraces?.push({
        department: id,
        at: new Date(),
      });

      return await user?.save();
    } else {
      // DOn"t push
      return user;
    }
  }

  async updateCurrentTeam(id: string, userId: string): Promise<IUser | null> {
    const user = await this.updateOneAfterFindIt(userId, { currentTeam: id });

    if (!user) return null;

    if (!user.teamsTraces) {
      user.teamsTraces = [];

      user?.teamsTraces?.push({
        team: id,
        at: new Date(),
      });

      return await user?.save();
    } else {
      const haveAlreadyThisItem = user.teamsTraces.filter(
        (item) => item.team.toString() === id
      );

      if (haveAlreadyThisItem.length < 1) {
        // Push and update
        user?.teamsTraces?.push({
          team: id,
          at: new Date(),
        });

        return await user?.save();
      } else {
        // DOn"t push
        return user;
      }
    }
  }

  async updateCurrentHourGroup(id: string, userId: string): Promise<any> {
    const user = await this.updateOneAfterFindIt(userId, {
      currentHourGroup: id,
    });

    if (!user) return;

    if (!user.hourGroupsTraces) {
      user.hourGroupsTraces = [];
      user?.hourGroupsTraces?.push({
        hourGroup: id,
        at: new Date(),
      });

      return await user?.save();
    } else {
      const haveAlreadyThisItem = user.hourGroupsTraces.filter(
        (item) => item.hourGroup.toString() === id
      );

      if (haveAlreadyThisItem.length < 1) {
        // Push and update
        user?.hourGroupsTraces?.push({
          hourGroup: id,
          at: new Date(),
        });

        return await user?.save();
      } else {
        // DOn"t push
        return user;
      }
    }
  }

  async updateCurrentBonusCategory(id: string, userId: string): Promise<any> {
    const user = await this.updateOneAfterFindIt(userId, {
      currentBonusCategory: id,
    });

    if (!user) return;

    if (!user.bonusCategoriesTraces) {
      user.bonusCategoriesTraces = [];
      user?.bonusCategoriesTraces?.push({
        bonusCategory: id,
        at: new Date(),
      });
      return await user?.save();
    } else {
      const haveAlreadyThisItem = user.bonusCategoriesTraces.filter(
        (item) => item.bonusCategory.toString() === id
      );

      if (haveAlreadyThisItem.length < 1) {
        // Push and update

        user?.bonusCategoriesTraces?.push({
          bonusCategory: id,
          at: new Date(),
        });

        return await user?.save();
      } else {
        // DOn"t push
        return user;
      }
    }
  }

  /**
   * Check if a PIN is unique among all users
   * @param pin The PIN to check
   * @returns  A boolean indicating whether the PIN is unique
   */
  async isPinUnique(pin: string): Promise<boolean> {
    const users = await this.model.find();
    for (const existingUser of users) {
      if (await existingUser.isPinMatch(pin)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verify if a PIN is valid
   *
   * @param pin The PIN to verify
   * @param userId The ID of the user to verify the PIN for
   * @returns A boolean indicating whether the PIN is valid. True if a user with the PIN exists, false otherwise
   */
  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await this.model.findById(userId);
    return user ? await user.isPinMatch(pin) : false;
  }

  /**
   * Generate a unique 4-character PIN
   *
   * @returns {Promise<string>} A unique 4-character PIN
   */
  async generatePIN(): Promise<string> {
    let pin = generatePIN();
    while (!(await this.isPinUnique(pin))) {
      pin = generatePIN();
    }
    return pin;
  }

  /**
   * Create a new user with a unique 4-character PIN
   *
   * @param data The data to create the user with
   * @returns The created user
   */
  async create(data: Partial<IUser>): Promise<IUser> {
    const pin = await this.generatePIN();
    console.log("User:", { ...data, pin });
    return super.createOne({ ...data, pin });
  }

  /**
   * Authenticate a user by their PIN
   *
   * @param pin  The PIN to authenticate with
   * @returns  The authenticated user or undefined if no user is found
   */
  async findByPin(pin: string): Promise<IUser | undefined> {
    // Ensure pin hash matches
    const users = await this.model
      .find({})
      .populate("documents supervisors access avatar");
    for (const user of users) {
      if (await user.isPinMatch(pin)) {
        return user;
      }
    }
    return undefined;
  }

  /**
   * Authenticate a user by their email and password
   *
   * @param email The email to authenticate with
   * @param password The password to authenticate with
   * @returns The authenticated user or undefined if no user is found
   */
  async findByEmailAndPassword(
    email: string,
    password: string
  ): Promise<IUser | undefined> {
    const user = await this.model
      .findOne({ email })
      .populate("documents supervisors access avatar");
    if (user && (await user.isPasswordMatch(password))) {
      return user;
    }

    return undefined;
  }

  async findByEmail(email: string): Promise<IUser | undefined> {
    const user = await this.model.findOne({ email });
    return user || undefined;
  }

  async findById(id: string): Promise<IUser | undefined> {
    const user = await this.model.findById(id);
    return user || undefined;
  }

  async findUserWithAccess(id: string): Promise<IUser | undefined> {
    const user = await this.model
      .findById(id)
      .populate({
        path: "access",
        select: "permissions",
      })
      .populate({
        path: "currentPosition",
        populate: {
          path: "access",
          select: "permissions",
        },
      })
      .exec();
    return user || undefined;
  }

  /**
   * Get user profile data
   * @param userId The ID of the user
   * @returns An object containing various user-related data
   */
  async getUserProfile(userId: string) {
    try {
      const user = await this.readOne({
        id: userId,
        populate:
          "documents,supervisors,access,avatar,currentPosition,currentDepartment,currentTeam,currentHourGroup,currentBonusCategory",
      });
      console.log("User found:", user);
      if (!user) {
        throw new Error("User not found");
      }

      const [
        attendance,
        position,
        department,
        hourGroup,
        team,
        bonus,
        documents,
        observations,
        evaluations,
        tasks,
        videos,
        expenseReports,
        notes,
      ] = await Promise.all([
        attendanceService.readOne({ user: userId }),
        positionService.readOne({ members: userId }),
        departmentService.readMany(
          { members: userId },
          { populate: "manager,members,attachments" }
        ),
        hourGroupService.readOne({ members: userId }),
        teamService.readOne({ members: userId }),
        primeService.readMany({ user: userId }),
        documentService.readMany({
          $or: [
            { owner: userId },
            { "availableFor.users": userId },
            { uploadedBy: userId },
          ],
        }),
        observationService.readMany({ user: userId }),
        kpiValueService.readMany({ user: userId }),
        taskService.readMany({
          $or: [{ "assignedTo.users": userId }, { author: userId }],
        }),
        collaboratorVideoService.readMany({
          $or: [{ user: userId }, { uploadedBy: userId }],
        }),
        expenseReportService.readMany({ user: userId }),
        noteService.readMany({
          $or: [
            { author: userId },
            { "sharedWith.users": userId },
            { "sharedWith.access": user.access },
          ],
        }),
      ]);

      return {
        user,
        attendance,
        position,
        department,
        hourGroup,
        team,
        access: user.access,
        bonus,
        documents,
        observations,
        evaluations,
        tasks,
        videos,
        chat: [], // Will be implemented later
        expenseReports,
        notes,
        performance: {}, // Will be implemented later
        globalReport: {}, // Will be implemented later
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      throw error;
    }
  }
}

export const userService = UserService.getInstance();
