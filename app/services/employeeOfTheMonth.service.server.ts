/* eslint-disable @typescript-eslint/no-explicit-any */
import EmployeeOfTheMonth, {
  IEmployeeOfTheMonth,
  IEmployeeOfTheMonthMethods,
  EmployeeOfTheMonthModel,
  IVote,
} from "~/core/entities/employeeOfTheMonth.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import mongoose from "mongoose";

export default class EmployeeOfTheMonthService extends BaseService<
  IEmployeeOfTheMonth,
  IEmployeeOfTheMonthMethods,
  EmployeeOfTheMonthModel
> {
  constructor() {
    super(EmployeeOfTheMonth);
  }

  private static instance: EmployeeOfTheMonthService;

  public static getInstance(): EmployeeOfTheMonthService {
    if (!EmployeeOfTheMonthService.instance) {
      EmployeeOfTheMonthService.instance = new EmployeeOfTheMonthService();
    }
    return EmployeeOfTheMonthService.instance;
  }

  /**
   * Nominate an employee for Employee of the Month.
   * The nomination is not finalized until a winner is selected.
   * So, nominate someone means they are in the running.
   *
   * @param employeeId - ID of the employee to nominate.
   * @param metrics - Metrics that contributed to the nomination.
   * @param message - A congratulatory or nomination message.
   */
  async nominateEmployee(
    employeeId: string,
    metrics: { [key: string]: number },
    message: string
  ): Promise<IEmployeeOfTheMonth> {
    const nomination = await this.createOne({
      employee: new mongoose.Types.ObjectId(employeeId),
      isWinner: false,
      message,
      metrics,
      nominationDate: new Date(),
    });
    return nomination;
  }

  /**
   * Cast a vote for an employee.
   * @param nominationId - ID of the nomination to vote for.
   * @param voterId - ID of the voter.
   * @param voteValue - Value of the vote (e.g., 1 for positive, -1 for negative or 0 for neutral).
   */
  async castVote(
    nominationId: string,
    voterId: string,
    voteValue: number
  ): Promise<IEmployeeOfTheMonth | null> {
    const nomination = await this.readOne({ _id: nominationId });
    if (!nomination) return null;

    const existingVoteIndex = nomination.votes.findIndex(
      (vote) => vote.voter.toString() === voterId
    );

    if (existingVoteIndex > -1) {
      // Update existing vote
      nomination.votes[existingVoteIndex].voteValue = voteValue;
      nomination.votes[existingVoteIndex].votedAt = new Date();
    } else {
      // Add new vote
      nomination.votes.push({
        voter: new mongoose.Types.ObjectId(voterId),
        voteValue,
        votedAt: new Date(),
      });
    }

    return await nomination.save();
  }

  /**
   * Finalize the Employee of the Month.
   * Ensure only one is designated as winner.
   * @param nominationId - ID of the nomination to finalize.
   */
  async finalizeWinner(
    nominationId: string
  ): Promise<IEmployeeOfTheMonth | null> {
    // Unset any existing winner
    await this.updateMany({ isWinner: true }, { isWinner: false });

    const nomination = await this.readOne({ _id: nominationId });
    if (!nomination) return null;

    nomination.isWinner = true;
    nomination.finalizationDate = new Date();
    return await nomination.save();
  }

  /**
   * Retrieve the winner of Employee of the Month for a specific period.
   * By default, it retrieves the winner of for last 31 days. (1 month)
   * @param startDate - Start of the period.
   * @param endDate - End of the period.
   */
  async getWinnerForPeriod(
    startDate: Date = new Date(new Date().setDate(new Date().getDate() - 31)),
    endDate: Date = new Date()
  ): Promise<IEmployeeOfTheMonth | null> {
    return await this.model
      .findOne({
        isWinner: true,
        finalizationDate: { $gte: startDate, $lte: endDate },
      })
      .populate([
        { path: "employee" },
        { path: "employee", populate: { path: "avatar" } },
        { path: "employee", populate: { path: "currentDepartment" } },
        { path: "employee", populate: { path: "currentPosition" } },
      ]);
  }

  /**
   * Check if a user is a winner for a specific period.
   * 
   * Default period is last 31 days.
   * @param userId The user id
   * @param startDate Start date, default is 31 days ago
   * @param endDate End date, default is today
   * @returns True if the user is a winner, false otherwise
   */
  async isWinnerForPeriod(userId: string , startDate: Date = new Date(new Date().setDate(new Date().getDate() - 31)), endDate: Date = new Date()): Promise<{ isWinner: boolean, item: any }> {
    const item = await this.model.findOne({
      employee: userId,
      isWinner: true,
      finalizationDate: { $gte: startDate, $lte: endDate },
    });

    console.log("Item", item);
    return {isWinner: item !== null, item};
  }
  
  /**
   * Prefer using this method to get a famous by id over the readOne method.
   * 
   * @param id The id of the famous
   * @returns The famous
   */
  async getAFamous(
    id : string,
  ): Promise<IEmployeeOfTheMonth | null> {
    return await this.model
      .findById(id)
      .populate([
        { path: "employee" },
        { path: "employee", populate: { path: "avatar" } },
        { path: "employee", populate: { path: "currentDepartment" } },
        { path: "employee", populate: { path: "currentPosition" } },
        // voter, voter
        {path: 'votes', populate: {path: 'voter'}},
        {path: 'votes', populate: {path: "voter.avatar" }},

      ]);
  }

  // Get all winners for a specific period, by default select all winners of last 12 months
  async getWinnersForPeriod(
    startDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 12)),
    endDate: Date = new Date()
  ): Promise<IEmployeeOfTheMonth[]> {
    return await this.model
      .find({
        isWinner: true,
        finalizationDate: { $gte: startDate, $lte: endDate },
      })
      .populate([
        { path: "employee" },
        { path: "employee", populate: { path: "avatar" } },
        { path: "employee", populate: { path: "currentDepartment" } },
        { path: "employee", populate: { path: "currentPosition" } },
      ]);
  }

  /**
   * Retrieve the votes for a specific nomination by a voter
   * @param nominationId  The nomination id
   * @param voterId The voter id
   * @returns The vote or null if not found
   */
  async getUserVoteForCandidate(
    nominationId: string,
    voterId: string
  ): Promise<IVote | null> {
    const nomination = await this.readOne({ _id: nominationId });
    if (!nomination) return null;

    return nomination.votes.find(
      (vote) => vote.voter.toString() === voterId
    ) || null;
  }

  /**
   * Retrieve all nominations within a specific date range.
   * Candidate which need votes cannot exceed 5 or the limit set in the system config.
   * 
   * By default, it retrieves all nominations for current month. Candidate which need votes.
   * @param startDate - Start of the range.
   * @param endDate - End of the range.
   */
  async getNominationsInRange(
    startDate: Date = new Date(new Date().setDate(1)),
    endDate: Date = new Date()
  ): Promise<IEmployeeOfTheMonth[]> {
    return await this.model
      .find({
        isWinner: false,
        nominationDate: { $gte: startDate, $lte: endDate },
        finalizationDate: { $exists: false },
      })
      .populate([
        { path: "employee" },
        { path: "employee", populate: { path: "avatar" } },
        { path: "employee", populate: { path: "currentDepartment" } },
        { path: "employee", populate: { path: "currentPosition" } },
      ]).limit(5);
  }

  /**
   * Calculate total votes for a nomination.
   * @param nominationId - ID of the nomination.
   */
  async calculateVotes(nominationId: string): Promise<number | null> {
    const nomination = await this.readOne({ _id: nominationId });
    if (!nomination) return null;

    return nomination.votes.reduce((total, vote) => total + vote.voteValue, 0);
  }

  /**
   * Generate sample data for Employee of the Month.
   * @param usersId - List of user IDs to use for the nominations.
   */
  async generateSampleData(usersId: string[]): Promise<void> {
    const months = ["2024-10", "2024-11", "2024-12"]; // Oct, Nov, Dec 2024

    for (const month of months) {
      const monthStart = new Date(`${month}-01T00:00:00Z`);
      const monthEnd = new Date(`${month}-31T23:59:59Z`);

      // Generate 5-10 nominations for the month
      const nominations = await Promise.all(
        Array.from({ length: Math.floor(Math.random() * 6) + 5 }).map(
          async () => {
            const employeeId =
              usersId[Math.floor(Math.random() * usersId.length)];
            const metrics = {
              positiveObservation: Math.floor(Math.random() * 20) + 5,
              negativeObservation: Math.floor(Math.random() * 5),
              tasksCompleted: Math.floor(Math.random() * 50) + 20,
              kpiAverageScore: parseFloat((Math.random() * 3 + 2).toFixed(1)),
              workingHours: Math.floor(Math.random() * 40) + 160,
              breakHours: Math.floor(Math.random() * 10) + 10,
              lateDays: Math.floor(Math.random() * 3),
              absentDays: Math.floor(Math.random() * 2),
            };

            const message =
              "Congratulations on your nomination! Keep up the great work.";
            return await this.nominateEmployee(employeeId, metrics, message);
          }
        )
      );

      // Ensure exactly one winner is finalized for the month
      const winner =
        nominations[Math.floor(Math.random() * nominations.length)];
      if (winner) {
        await this.finalizeWinner(winner._id.toString());
      }
    }
  }
}

export const employeeOfTheMonthService =
  EmployeeOfTheMonthService.getInstance();
