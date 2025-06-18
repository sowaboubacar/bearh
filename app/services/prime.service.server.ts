import Prime, {
  IPrime,
  IPrimeMethods,
  PrimeModel,
} from "~/core/entities/prime.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import User, { IUser } from "~/core/entities/user.entity.server";
import BonusCategory from "~/core/entities/bonusCategory.entity.server";
import KpiValue from "~/core/entities/kpiValue.entity.server";
import Observation from "~/core/entities/observation.entity.server";
import SystemConfig from "~/core/entities/systemConfig.entity.server";
import PrimeCronJob from "~/core/entities/primeCronJob.entity.server";
import mongoose from "mongoose";

export default class PrimeService extends BaseService<
  IPrime,
  IPrimeMethods,
  PrimeModel
> {
  constructor() {
    super(Prime);
  }

  private static instance: PrimeService;

  public static getInstance(): PrimeService {
    if (!PrimeService.instance) {
      PrimeService.instance = new PrimeService();
    }
    return PrimeService.instance;
  }

  /**
   * Calculate the prime for a user within a given period.
   * @param user The user to calculate the prime for.
   * @param startDate  The start date of the period.
   * @param endDate  The end date of the period.
   * @returns The calculated prime.
   */
  public async calculatePrimeFor(
    user: IUser,
    startDate: Date,
    endDate: Date
  ): Promise<IPrime> {
    // Get the user's BonusCategory
    const bonusCategory = await BonusCategory.findOne({
      members: user._id,
    }).lean();

    if (!bonusCategory) {
      throw new Error(`BonusCategory not found for user ${user._id}`);
    }

    const { baseAmount, coefficient, remarkBonusAmount } = bonusCategory;

    // Fetch user's KpiValues within the period
    const kpiValues = await KpiValue.find({
      user: user._id,
      evaluationDate: { $gte: startDate, $lte: endDate },
    }).lean();

    // Compute the mean of meanScores
    let meanKpiScore = 0;
    if (kpiValues.length > 0) {
      const totalMeanScores = kpiValues.reduce(
        (sum, kpiValue) => sum + kpiValue.meanScore,
        0
      );
      meanKpiScore = totalMeanScores / kpiValues.length;
    }

    // Fetch user's Observations within the period
    const observations = await Observation.find({
      user: user._id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Count positive and negative remarks
    let remarkSum = 0;
    observations.forEach((obs) => {
      if (obs.type.toLowerCase() === "positive") {
        remarkSum += 1;
      } else if (obs.type.toLowerCase() === "negative") {
        remarkSum -= 1;
      }
    });

    // Calculate TotalBonusAmount
    const TotalBonusAmount =
      baseAmount + coefficient * meanKpiScore + remarkBonusAmount * remarkSum;

    // Create a new Prime document
    const primeData: IPrime = {
      user: user._id,
      baseAmount,
      coefficient,
      remarkBonusAmount,
      meanKpiScore,
      remarkSum,
      totalAmount: TotalBonusAmount,
      periodStartDate: startDate,
      periodEndDate: endDate,
    };

    const prime = await Prime.create(primeData);

    return prime;
  }

  /**
   * Compute the prime for all employees.
   */
  async computeEmployeesPrime() {
    // Check if a job is already in progress
    let jobData = await PrimeCronJob.findOne({ status: "in-progress" });

    if (!jobData) {
      // No job in progress, start a new one

      // Get the system configuration
      const systemConfig = await SystemConfig.findOne();
      const bonusConfig = systemConfig?.settings?.bonusCalculation;

      if (!bonusConfig) {
        throw new Error("Bonus calculation configuration not found");
      }

      const { lastExecutionDate, nextExecutionDate } = bonusConfig;

      const startDate = lastExecutionDate || new Date();
      const endDate = nextExecutionDate || new Date();

      const allUsers = await User.find({}).lean();
      const userIds = allUsers.map((user) => user._id);

      jobData = new PrimeCronJob({
        jobId: new Date().toISOString(),
        status: "in-progress",
        startDate,
        endDate,
        remainingUsers: userIds,
        completedUsers: [],
        errorsDetails: [],
      });

      // Save the job data
      await jobData.save();
    }

    // Process the remaining users
    const startDate = jobData.startDate;
    const endDate = jobData.endDate;

    for (const userId of jobData.remainingUsers.slice()) {
      try {
        const user = await User.findById(userId).lean();
        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        await this.calculatePrimeFor(user, startDate, endDate);

        // Move user from remainingUsers to completedUsers
        jobData.completedUsers.push(userId);
        const index = jobData.remainingUsers.indexOf(userId);
        if (index > -1) {
          jobData.remainingUsers.splice(index, 1);
        }

        // Save progress to database
        await jobData.save();
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);

        // Record the error
        jobData.errorsDetails.push({
          userId: userId.toString(),
          error: error.message,
        });

        // Move user from remainingUsers to completedUsers
        jobData.completedUsers.push(userId);
        const index = jobData.remainingUsers.indexOf(userId);
        if (index > -1) {
          jobData.remainingUsers.splice(index, 1);
        }

        // Save progress to database
        await jobData.save();
      }
    }

    // Job completed
    jobData.status = "completed";
    await jobData.save();
  }

  /**
   * Schedule the prime calculation cron job.
   * This method should be called once when the application starts in a cron job setup script.
   */
  async cronToSchedulePrimeCalculation() {
    // Check if a job is already in progress
    const existingJob = await PrimeCronJob.findOne({ status: "in-progress" });
    if (existingJob) {
      // Job is already in progress, do nothing
      return;
    }

    // Get the system configuration
    const systemConfig = await SystemConfig.findOne();
    const bonusConfig = systemConfig?.settings?.bonusCalculation;

    if (!bonusConfig) {
      throw new Error("Bonus calculation configuration not found");
    }

    const { nextExecutionDate } = bonusConfig;

    const now = new Date();

    if (nextExecutionDate && now >= new Date(nextExecutionDate)) {
      // It's time to run the bonus calculation
      await this.computeEmployeesPrime();

      // Update the last execution date and calculate the next execution date
      bonusConfig.lastExecutionDate = new Date(nextExecutionDate);

      const newNextExecutionDate = this.calculateNextExecutionDate(
        new Date(nextExecutionDate),
        bonusConfig.frequency,
        bonusConfig.executionDay,
        bonusConfig.executionTime
      );

      bonusConfig.nextExecutionDate = newNextExecutionDate;

      // Save the system configuration
      await systemConfig.save();
    }
  }

  /*
   * Calculate the next execution date based on the frequency, execution day, and execution time
   */
  calculateNextExecutionDate(
    lastExecutionDate: Date,
    frequency: string,
    executionDay: number | "last",
    executionTime: string
  ): Date {
    const nextExecutionDate = new Date(lastExecutionDate);

    switch (frequency) {
      case "daily":
        nextExecutionDate.setDate(nextExecutionDate.getDate() + 1);
        break;
      case "weekly":
        nextExecutionDate.setDate(nextExecutionDate.getDate() + 7);
        break;
      case "monthly":
        nextExecutionDate.setMonth(nextExecutionDate.getMonth() + 1);
        break;
      case "quarterly":
        nextExecutionDate.setMonth(nextExecutionDate.getMonth() + 3);
        break;
      case "semi-annually":
        nextExecutionDate.setMonth(nextExecutionDate.getMonth() + 6);
        break;
      case "annually":
        nextExecutionDate.setFullYear(nextExecutionDate.getFullYear() + 1);
        break;
      default:
        throw new Error("Unsupported frequency");
    }

    // Adjust the day of the month
    if (frequency !== "daily" && frequency !== "weekly") {
      let day;
      if (executionDay === "last") {
        // Set to the last day of the month
        day = new Date(
          nextExecutionDate.getFullYear(),
          nextExecutionDate.getMonth() + 1,
          0
        ).getDate();
      } else {
        day = Math.min(Math.max(executionDay as number, 1), 28);
      }
      nextExecutionDate.setDate(day);
    }

    // Set execution time
    const [hours, minutes, seconds] = executionTime.split(":").map(Number);
    nextExecutionDate.setHours(hours);
    nextExecutionDate.setMinutes(minutes);
    nextExecutionDate.setSeconds(seconds || 0);

    return nextExecutionDate;
  }

  async samples(user) {
    const examples: IPrime[] = [
      {
        user: new mongoose.Types.ObjectId(),
        calculationDetails: {
          kpiValue: new mongoose.Types.ObjectId(),
          bonusCategory: new mongoose.Types.ObjectId(),
          observations: [
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
          ],
          formula: "kpiValue * 0.1 + bonusCategory * 0.2",
        },
        startTrackingDate: new Date("2023-01-01"),
        endTrackingDate: new Date("2023-01-31"),
        totalAmount: 5000,
        calculationDate: new Date("2023-02-01T00:00:00Z"),
      },
      {
        user: new mongoose.Types.ObjectId(),
        calculationDetails: {
          kpiValue: new mongoose.Types.ObjectId(),
          bonusCategory: new mongoose.Types.ObjectId(),
          observations: [new mongoose.Types.ObjectId()],
          formula: "kpiValue * 0.15 + bonusCategory * 0.25",
        },
        startTrackingDate: new Date("2023-02-01"),
        endTrackingDate: new Date("2023-02-28"),
        totalAmount: 6000,
        calculationDate: new Date("2023-03-01T00:00:00Z"),
      },
      {
        user: new mongoose.Types.ObjectId(),
        calculationDetails: {
          kpiValue: new mongoose.Types.ObjectId(),
          bonusCategory: new mongoose.Types.ObjectId(),
          observations: [
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
          ],
          formula: "kpiValue * 0.2 + bonusCategory * 0.3",
        },
        startTrackingDate: new Date("2023-03-01"),
        endTrackingDate: new Date("2023-03-31"),
        totalAmount: 7000,
        calculationDate: new Date("2023-04-01T00:00:00Z"),
      },
      {
        user: new mongoose.Types.ObjectId(),
        calculationDetails: {
          kpiValue: new mongoose.Types.ObjectId(),
          bonusCategory: new mongoose.Types.ObjectId(),
          observations: [
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
          ],
          formula: "kpiValue * 0.25 + bonusCategory * 0.35",
        },
        startTrackingDate: new Date("2023-04-01"),
        endTrackingDate: new Date("2023-04-30"),
        totalAmount: 8000,
        calculationDate: new Date("2023-05-01T00:00:00Z"),
      },
      {
        user: new mongoose.Types.ObjectId(),
        calculationDetails: {
          kpiValue: new mongoose.Types.ObjectId(),
          bonusCategory: new mongoose.Types.ObjectId(),
          observations: [new mongoose.Types.ObjectId()],
          formula: "kpiValue * 0.3 + bonusCategory * 0.4",
        },
        startTrackingDate: new Date("2023-05-01"),
        endTrackingDate: new Date("2023-05-31"),
        totalAmount: 9000,
        calculationDate: new Date("2023-06-01T00:00:00Z"),
      },
    ];
    return examples;
  }

  /***************************************************************
   *
   * Below are methods just for testing purposes
   */
  /**
   * Generates a set of sample prime records for testing purposes.
   * Ensures that there are no duplicate primes based on user, calculation details, and tracking dates.
   *
   * @param numberOfPrimes - The total number of primes to generate.
   * @param userIds - An array of user IDs to assign as recipients of the primes.
   * @param kpiValueIds - An array of KPI value IDs to include in the calculation details.
   * @param bonusCategoryIds - An array of bonus category IDs to include in the calculation details.
   * @param observationIds - An array of observation IDs to include in the calculation details.
   * @param formulaList - An array of formula strings to use for prime calculations.
   */
  public async generateSamplePrimes(
    numberOfPrimes: number,
    userIds: string[],
    kpiValueIds: string[],
    bonusCategoryIds: string[],
    observationIds: string[],
    formulaList: string[]
  ): Promise<void> {
    const generatedPrimes = new Set<string>();

    for (let i = 0; i < numberOfPrimes; i++) {
      // Select a random user
      const userId = this.getRandomElement(userIds);

      // Select random calculation details
      const kpiValueId = this.getRandomElement(kpiValueIds);
      const bonusCategoryId = this.getRandomElement(bonusCategoryIds);
      const numberOfObservations = this.getRandomInt(
        1,
        Math.min(5, observationIds.length)
      );
      const observations = this.getRandomElements(
        observationIds,
        numberOfObservations
      );
      const formula = this.getRandomElement(formulaList);

      // Generate random tracking dates within the past year
      const startDate = this.getRandomDate(
        new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        new Date()
      );
      const endDate = this.getRandomDate(
        startDate,
        new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 30)
      ); // Up to 30 days after startDate

      // Calculate totalAmount using a simplified random logic or predefined formulas
      // For demonstration, we'll assign a random amount
      const totalAmount = this.getRandomInt(1000, 10000);

      // Set calculationDate to the 1st of the next month at 00:00
      const calculationDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        1,
        0,
        0,
        0
      );

      // Create a unique key to avoid duplicates
      const uniqueKey = `${userId}-${kpiValueId}-${bonusCategoryId}-${observations.join(
        ","
      )}-${formula}-${startDate.toISOString()}-${endDate.toISOString()}`;
      if (generatedPrimes.has(uniqueKey)) {
        // If the combination exists, decrement i to retry
        i--;
        continue;
      }

      // Mark this prime as generated
      generatedPrimes.add(uniqueKey);

      // Create the prime record
      const prime: Partial<IPrime> = {
        user: new mongoose.Types.ObjectId(userId),
        calculationDetails: {
          kpiValue: new mongoose.Types.ObjectId(kpiValueId),
          bonusCategory: new mongoose.Types.ObjectId(bonusCategoryId),
          observations: observations.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
          formula: formula,
        },
        startTrackingDate: startDate,
        endTrackingDate: endDate,
        totalAmount: totalAmount,
        calculationDate: calculationDate,
      };

      // Create the prime in the database
      await this.createOne(prime);
      console.log(
        `Prime créée: Utilisateur ID: ${userId}, Montant Total: ${totalAmount}€`
      );
    }

    console.log(
      "Génération des données de primes de test terminée avec succès."
    );
  }
}

export const primeService = PrimeService.getInstance();
