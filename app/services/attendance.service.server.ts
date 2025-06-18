import AttendanceRecord, {
  IAttendanceRecord,
  IAttendanceRecordMethods,
  AttendanceRecordModel,
} from "~/core/entities/attendance.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import { systemConfigService } from "./systemConfig.service.server";

import { formatDateToFrench } from "~/utils/dateFormatting";
import mongoose from "mongoose";

export type DailySummary = {
  date: string;
  totalWorkTime: number;
  totalBreakTime: number;
  isLate: boolean;
  isAbsent: boolean;
};

export type OverallSummary = {
  totalWorkTime: number;
  totalBreakTime: number;
  lateCount: number;
  absentCount: number;
  averageWorkTime: number;
};

export default class AttendanceService extends BaseService<
  IAttendanceRecord,
  IAttendanceRecordMethods,
  AttendanceRecordModel
> {
  constructor() {
    super(AttendanceRecord);
  }

  private static instance: AttendanceService;

  public static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  async getOrCreateAttendanceRecord(
    userId: string,
    date: Date
  ): Promise<IAttendanceRecord> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    let record = await this.readOne({
      user: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!record) {
      record = await this.createOne({
        user: userId,
        date: startOfDay,
        entries: [],
        status: "absent",
      });
    }

    return record;
  }

  async addEntry(
    userId: string,
    type: "checkIn" | "checkOut" | "breakStart" | "breakEnd"
  ): Promise<IAttendanceRecord> {
    const record = (await this.getOrCreateAttendanceRecord(
      userId,
      new Date()
    )) as IAttendanceRecord;
    record.addEntry(type);
    return await record.save();
  }

  async getUserAttendanceInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IAttendanceRecord[]> {
    return await this.readMany({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });
  }

  async calculateTotalWorkTime(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const records = await this.getUserAttendanceInRange(
      userId,
      startDate,
      endDate
    );
    return records.reduce(
      (total, record) => total + (record.totalWorkTime || 0),
      0
    );
  }

  async calculateTotalBreakTime(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const records = await this.getUserAttendanceInRange(
      userId,
      startDate,
      endDate
    );
    return records.reduce(
      (total, record) => total + (record.totalBreakTime || 0),
      0
    );
  }

  async getLatestStatus(userId: string): Promise<string> {
    const record = await this.getOrCreateAttendanceRecord(userId, new Date());
    return record.status;
  }

  async getAttendanceSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalWorkDays: number;
    totalWorkTime: number;
    totalBreakTime: number;
    averageDailyWorkTime: number;
  }> {
    const records = await this.getUserAttendanceInRange(
      userId,
      startDate,
      endDate
    );
    const totalWorkDays = records.length;
    const totalWorkTime = records.reduce(
      (total, record) => total + (record.totalWorkTime || 0),
      0
    );
    const totalBreakTime = records.reduce(
      (total, record) => total + (record.totalBreakTime || 0),
      0
    );
    const averageDailyWorkTime =
      totalWorkDays > 0 ? totalWorkTime / totalWorkDays : 0;

    return {
      totalWorkDays,
      totalWorkTime,
      totalBreakTime,
      averageDailyWorkTime,
    };
  }

  /**
   * Check if the user is within the authorized point
   *
   * @param latitude The latitude of the user's location
   * @param longitude The longitude of the user's location
   * @returns An object containing the distance from the authorized point and a boolean indicating if the user is within the radius
   * @throws An error if the location configuration is not set
   */
  async checkUserProximityToAuthorizedPoint(
    latitude: number,
    longitude: number
  ) {
    const config = await systemConfigService.getCurrentConfig();
    const { location } = config?.settings ?? {};

    if (
      !location ||
      !location.latitude ||
      !location.longitude ||
      !location.radius
    ) {
      throw new Error(
        "La configuration de localisation de la pharmacie n'est pas définie."
      );
    }

    const distance = this.calculateDistance(
      latitude,
      longitude,
      parseFloat(location.latitude),
      parseFloat(location.longitude)
    );

    return {
      distance, // Maybe, you can display this distance to the user to let them know how far they are from the location
      isWithinRadius: distance <= location.radius, // Use this to prevent check-in if the user is not within the radius
    };
  }

  /**
   * Calculate the distance between two points on Earth
   *
   * @param lat1 Latitude of the first point
   * @param lon1 Longitude of the first point
   * @param lat2 Latitude of the second point
   * @param lon2 Longitude of the second point
   * @returns The distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Convert degrees to radians
   * @param degrees The degrees to convert
   * @returns The radians equivalent
   */
  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // Used on the user profile's attendance tab
  /**
   * Retrieve attendance records by date range for a given user.
   * @param userId - The ID of the user
   * @param startDate - The start of the date range
   * @param endDate - The end of the date range
   */
  public async getAttendanceRecordsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IAttendanceRecord[]> {
    // Ensure startDate < endDate and they are valid dates
    if (
      !(startDate instanceof Date) ||
      isNaN(startDate.getTime()) ||
      !(endDate instanceof Date) ||
      isNaN(endDate.getTime())
    ) {
      throw new Error("Invalid date(s) provided.");
    }

    if (startDate > endDate) {
      throw new Error("Start date cannot be after end date.");
    }

    return this.model
      .find({
        user: userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .lean()
      .exec();
  }

  /**
   * Get aggregated metrics for a given user and date range.
   * @param userId - The user ID
   * @param startDate - Start of the range
   * @param endDate - End of the range
   * @param referenceCheckInTime - A Date object representing the expected start time (e.g., "09:00")
   */
  public async getAggregatedMetricsOlds(
    userId: string,
    startDate: Date,
    endDate: Date,
    referenceCheckInTime: Date
  ): Promise<{
    dailySummaries: DailySummary[];
    overallSummary: OverallSummary;
  }> {
    console.log("User id: ", userId);
    const records = await this.getAttendanceRecordsByDateRange(
      userId,
      startDate,
      endDate
    );

    // Group records by date for easy daily calculations
    const recordsByDay: Record<string, IAttendanceRecord[]> = {};
    for (const record of records) {
      const dayKey = formatDateToFrench(record.date);
      if (!recordsByDay[dayKey]) {
        recordsByDay[dayKey] = [];
      }
      recordsByDay[dayKey].push(record);
    }

    const dailySummaries: DailySummary[] = [];

    // Iterate over each day in the range
    // Note: we should consider the possibility that some days have no record at all => absent
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayKey = formatDateToFrench(currentDate);
      const dayRecords = recordsByDay[dayKey] || [];

      // Compute daily metrics
      let totalWorkTime = 0;
      let totalBreakTime = 0;
      let isLate = false;
      let isAbsent = false;

      if (dayRecords.length === 0) {
        // No records => absent
        isAbsent = true;
      } else {
        // In our schema, we have one record per day per user ideally.
        // But if multiple records per day exist, we sum them all up:
        // (Though typically you’d have only one record per day per user)
        for (const rec of dayRecords) {
          totalWorkTime += rec.totalWorkTime ?? 0;
          totalBreakTime += rec.totalBreakTime ?? 0;

          // Determine lateness:
          // Find the earliest checkIn timestamp
          const checkInEntry = rec.entries.find((e) => e.type === "checkIn");
          if (checkInEntry && checkInEntry.timestamp > referenceCheckInTime) {
            isLate = true;
          }

          // Determine absence:
          // A user might be considered absent if no checkIn found at all.
          if (!checkInEntry) {
            isAbsent = true;
          }
        }
      }

      dailySummaries.push({
        date: dayKey,
        totalWorkTime,
        totalBreakTime,
        isLate,
        isAbsent,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Compute overall summary
    const totalWorkTimeSum = dailySummaries.reduce(
      (sum, day) => sum + day.totalWorkTime,
      0
    );
    const totalBreakTimeSum = dailySummaries.reduce(
      (sum, day) => sum + day.totalBreakTime,
      0
    );
    const lateCount = dailySummaries.filter((day) => day.isLate).length;
    const absentCount = dailySummaries.filter((day) => day.isAbsent).length;

    const daysWithRecords = dailySummaries.length - absentCount;
    const averageWorkTime =
      daysWithRecords > 0 ? Math.round(totalWorkTimeSum / daysWithRecords) : 0;

    const overallSummary: OverallSummary = {
      totalWorkTime: totalWorkTimeSum,
      totalBreakTime: totalBreakTimeSum,
      lateCount,
      absentCount,
      averageWorkTime,
    };

    return { dailySummaries, overallSummary };
  }

  public async getAggregatedMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
    referenceCheckInTime: Date
  ): Promise<{
    dailySummaries: DailySummary[];
    overallSummary: OverallSummary;
  }> {
    console.log("User id: ", userId);
    const records = await this.getAttendanceRecordsByDateRange(
      userId,
      startDate,
      endDate
    );

    // Group records by date for easy daily calculations
    const recordsByDay: Record<string, IAttendanceRecord[]> = {};
    for (const record of records) {
      const dayKey = formatDateToFrench(record.date);
      if (!recordsByDay[dayKey]) {
        recordsByDay[dayKey] = [];
      }
      recordsByDay[dayKey].push(record);
    }

    const dailySummaries: DailySummary[] = [];

    // Iterate over each day in the range
    const currentDate = new Date(startDate);
    // while (currentDate <= endDate) {
    //   const dayKey = formatDateToFrench(currentDate);
    //   const dayRecords = recordsByDay[dayKey] || [];

    //   let totalWorkTime = 0;
    //   let totalBreakTime = 0;
    //   let isLate = false;
    //   let isAbsent = false;

    //   if (dayRecords.length === 0) {
    //     // No record at all => absent
    //     isAbsent = true;
    //   } else {
    //     // Check total entries across all records for that day
    //     const totalEntries = dayRecords.reduce((sum, rec) => sum + (rec.entries?.length ?? 0), 0);

    //     if (totalEntries === 0) {
    //       // Record exists but no entries => absent
    //       isAbsent = true;
    //     } else {
    //       // At least one entry means user was present at some point
    //       for (const rec of dayRecords) {
    //         totalWorkTime += rec.totalWorkTime ?? 0;
    //         totalBreakTime += rec.totalBreakTime ?? 0;

    //         // Determine lateness by earliest checkIn
    //         const checkInEntry = rec.entries.find((e) => e.type === "checkIn");
    //         if (checkInEntry && checkInEntry.timestamp > referenceCheckInTime) {
    //           isLate = true;
    //         }
    //       }
    //     }
    //   }

    //   dailySummaries.push({
    //     date: dayKey,
    //     totalWorkTime,
    //     totalBreakTime,
    //     isLate,
    //     isAbsent,
    //   });

    //   currentDate.setDate(currentDate.getDate() + 1);
    // }

    while (currentDate <= endDate) {
      const dayKey = formatDateToFrench(currentDate);
      const dayRecords = recordsByDay[dayKey] || [];

      // Create a daily referenceCheckInTime for this specific date
      const dailyReferenceCheckInTime = new Date(currentDate);
      dailyReferenceCheckInTime.setHours(
        referenceCheckInTime.getHours(),
        referenceCheckInTime.getMinutes(),
        referenceCheckInTime.getSeconds(),
        referenceCheckInTime.getMilliseconds()
      );

      let totalWorkTime = 0;
      let totalBreakTime = 0;
      let isLate = false;
      let isAbsent = false;

      if (dayRecords.length === 0) {
        isAbsent = true;
      } else {
        const totalEntries = dayRecords.reduce(
          (sum, rec) => sum + (rec.entries?.length ?? 0),
          0
        );

        if (totalEntries === 0) {
          isAbsent = true;
        } else {
          for (const rec of dayRecords) {
            totalWorkTime += rec.totalWorkTime ?? 0;
            totalBreakTime += rec.totalBreakTime ?? 0;

            const checkInEntry = rec.entries.find((e) => e.type === "checkIn");
            if (
              checkInEntry &&
              checkInEntry.timestamp > dailyReferenceCheckInTime
            ) {
              isLate = true;
            }
          }
        }
      }

      dailySummaries.push({
        date: dayKey,
        totalWorkTime,
        totalBreakTime,
        isLate,
        isAbsent,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Compute overall summary
    const totalWorkTimeSum = dailySummaries.reduce(
      (sum, day) => sum + day.totalWorkTime,
      0
    );
    const totalBreakTimeSum = dailySummaries.reduce(
      (sum, day) => sum + day.totalBreakTime,
      0
    );
    const lateCount = dailySummaries.filter((day) => day.isLate).length;
    const absentCount = dailySummaries.filter((day) => day.isAbsent).length;

    const daysWithRecords = dailySummaries.length - absentCount;
    const averageWorkTime =
      daysWithRecords > 0 ? Math.round(totalWorkTimeSum / daysWithRecords) : 0;

    const overallSummary: OverallSummary = {
      totalWorkTime: totalWorkTimeSum,
      totalBreakTime: totalBreakTimeSum,
      lateCount,
      absentCount,
      averageWorkTime,
    };

    return { dailySummaries, overallSummary };
  }

  // Used on Monthly report sections
  async getMonthlyAttendanceMetrics(
    userId: string,
    year: number,
    month: number
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // last day of month

    const records = await AttendanceRecord.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    if (!records || records.length === 0) {
      return {
        totalHours: 0,
        meanHours: 0,
        absences: 0,
        lates: 0,
        workedVsPauseRatio: 0,
        workedDaysRatio: 0,
      };
    }

    const totalDays = new Date(year, month, 0).getDate();
    let totalWorkMinutes = 0;
    let absentDays = 0;
    let lateDays = 0;
    let workedDays = 0;
    let totalBreakMinutes = 0;

    for (const rec of records) {
      const workTime = rec.totalWorkTime || 0;
      const breakTime = rec.totalBreakTime || 0;
      totalWorkMinutes += workTime;
      totalBreakMinutes += breakTime;

      if (rec.status === "absent") {
        absentDays++;
      } else {
        workedDays++;
      }
      if (rec.status === "late") {
        lateDays++;
      }
    }

    const totalHours = totalWorkMinutes / 60;
    const meanHours = workedDays > 0 ? totalHours / workedDays : 0;
    const workedVsPauseRatio =
      totalBreakMinutes > 0 ? totalWorkMinutes / totalBreakMinutes : 0;
    const workedDaysRatio = totalDays > 0 ? workedDays / totalDays : 0;

    return {
      totalHours,
      meanHours,
      absences: absentDays,
      lates: lateDays,
      workedVsPauseRatio,
      workedDaysRatio,
    };
  }

  /********************************************
   *
   * These below methods are used to generate test data. Only
   * used in development environment.
   *
   */
  /**
   * Génère des données d'assiduité de test pour les utilisateurs spécifiés.
   *
   * @param userIds - Tableau des IDs des utilisateurs.
   * @param years - Tableau des années pour lesquelles générer les données.
   * @param monthsForEachYear - Tableau des mois (1-12) à générer pour chaque année.
   * @param minEntriesPerType - Nombre minimum d'entrées par type pour chaque utilisateur.
   */
  public async generateSampleData(
    userIds: string[],
    years: number[],
    monthsForEachYear: number[],
    minEntriesPerType: number = 10
  ): Promise<void> {
    // Définir les statuts possibles
    const statuses: ("present" | "absent" | "late" | "onBreak")[] = [
      "present",
      "absent",
      "late",
      "onBreak",
    ];

    // Parcourir chaque utilisateur
    for (const userId of userIds) {
      // Parcourir chaque année
      for (const year of years) {
        // Parcourir chaque mois spécifié
        for (const month of monthsForEachYear) {
          // Obtenir le nombre de jours dans le mois
          const numDays = new Date(year, month, 0).getDate();

          // Parcourir chaque jour du mois
          for (let day = 1; day <= numDays; day++) {
            const date = new Date(Date.UTC(year, month - 1, day));

            // Vérifier si le jour est un jour ouvrable (lundi à vendredi)
            const dayOfWeek = date.getUTCDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              // Ignorer les weekends
              continue;
            }

            // Générer un statut aléatoire avec certaines probabilités
            const status = this.getRandomStatus();

            // Générer les entrées en fonction du statut
            const entries = this.generateEntriesForStatus(status, date);

            // Calculer les temps de travail et de pause
            const { totalWorkTime, totalBreakTime } =
              this.calculateTimes(entries);

            // Générer des notes si nécessaire
            const notes = this.generateNotes(status);

            // Créer l'enregistrement d'assiduité
            const attendanceRecord: Partial<IAttendanceRecord> = {
              user: new mongoose.Types.ObjectId(userId),
              date: date,
              entries: entries,
              status: status,
              totalWorkTime: totalWorkTime,
              totalBreakTime: totalBreakTime,
              notes: notes,
            };

            // Vérifier si l'enregistrement existe déjà
            const existingRecord = await this.readOne({
              user: userId,
              date: date,
            });

            if (!existingRecord) {
              // Créer l'enregistrement
              await this.createOne(attendanceRecord);
            }
          }
        }
      }
    }

    console.log("Données d'assiduité de test générées avec succès.");
  }

  
  /**
   * Sélectionne un statut aléatoire basé sur des probabilités définies.
   *
   * @returns Un statut d'assiduité.
   */
  private getRandomStatus(): "present" | "absent" | "late" | "onBreak" {
    const rand = Math.random();
    if (rand < 0.1) return "absent"; // 10% d'absences
    if (rand < 0.2) return "late"; // 10% de retards
    if (rand < 0.25) return "onBreak"; // 5% de pauses prolongées
    return "present"; // 75% de présence
  }

  /**
   * Génère des entrées basées sur le statut.
   *
   * @param status - Statut d'assiduité.
   * @param date - Date de l'assiduité.
   * @returns Tableau d'entrées pour l'assiduité.
   */
  private generateEntriesForStatus(
    status: "present" | "absent" | "late" | "onBreak",
    date: Date
  ): IAttendanceRecord["entries"] {
    const entries: IAttendanceRecord["entries"] = [];

    if (status === "absent") {
      return entries; // Aucun enregistrement pour les absences
    }

    // Générer une heure de check-in
    let checkInHour = 9;
    let checkInMinute = this.getRandomInt(0, 15); // Varier entre 0 et 15 minutes

    if (status === "late") {
      checkInHour = 9;
      checkInMinute = this.getRandomInt(16, 30); // Retard entre 16 et 30 minutes
    }

    const checkInTime = new Date(date);
    checkInTime.setUTCHours(checkInHour, checkInMinute, 0, 0);
    entries.push({
      type: "checkIn",
      timestamp: checkInTime,
    });

    // Générer une pause déjeuner si présent ou en retard
    if (status === "present" || status === "late") {
      const breakStart = new Date(date);
      breakStart.setUTCHours(12, this.getRandomInt(0, 10), 0, 0);
      entries.push({
        type: "breakStart",
        timestamp: breakStart,
      });

      const breakEnd = new Date(breakStart);
      breakEnd.setUTCMinutes(breakEnd.getUTCMinutes() + 30); // Pause de 30 minutes
      entries.push({
        type: "breakEnd",
        timestamp: breakEnd,
      });
    }

    // Générer une heure de check-out
    const checkOutTime = new Date(date);
    checkOutTime.setUTCHours(17, this.getRandomInt(0, 15), 0, 0);
    entries.push({
      type: "checkOut",
      timestamp: checkOutTime,
    });

    return entries;
  }

  /**
   * Calcule le temps total de travail et de pause en minutes.
   *
   * @param entries - Tableau d'entrées pour l'assiduité.
   * @returns Objet contenant le temps total de travail et de pause.
   */
  private calculateTimes(entries: IAttendanceRecord["entries"]): {
    totalWorkTime: number;
    totalBreakTime: number;
  } {
    let totalWorkTime = 0;
    let totalBreakTime = 0;

    let checkIn: Date | null = null;
    let checkOut: Date | null = null;
    let breakStart: Date | null = null;
    let breakEnd: Date | null = null;

    for (const entry of entries) {
      switch (entry.type) {
        case "checkIn":
          checkIn = new Date(entry.timestamp);
          break;
        case "breakStart":
          breakStart = new Date(entry.timestamp);
          break;
        case "breakEnd":
          breakEnd = new Date(entry.timestamp);
          if (breakStart) {
            const breakDuration =
              (breakEnd.getTime() - breakStart.getTime()) / 60000; // en minutes
            totalBreakTime += breakDuration;
          }
          break;
        case "checkOut":
          checkOut = new Date(entry.timestamp);
          break;
      }
    }

    if (checkIn && checkOut) {
      let workDuration = (checkOut.getTime() - checkIn.getTime()) / 60000; // en minutes
      workDuration -= totalBreakTime; // Soustraire les pauses
      totalWorkTime += workDuration;
    }

    return { totalWorkTime, totalBreakTime };
  }

  /**
   * Génère des notes basées sur le statut.
   *
   * @param status - Statut d'assiduité.
   * @returns Une chaîne de caractères représentant les notes.
   */
  private generateNotes(
    status: "present" | "absent" | "late" | "onBreak"
  ): string {
    switch (status) {
      case "late":
        return "Arrivée en retard en raison des transports.";
      case "absent":
        return "Absence justifiée.";
      case "onBreak":
        return "Pause prolongée.";
      default:
        return "";
    }
  }
}

export const attendanceService = AttendanceService.getInstance();
