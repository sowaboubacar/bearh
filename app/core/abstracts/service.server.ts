/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, UpdateWriteOpResult } from "mongoose";
import { IBaseModel } from "./model.server";
import { DeleteResult } from "mongodb";
import _ from "lodash";

/**
 * Mongoose Service Base class.
 *
 * Example of use:
 *
 * ```ts
 * import { BaseService } from '@/abstracts/service.base';
 *
 * // ... import IModelType, IModelMethods, MongooseModel from the model file
 *
 * MessageService extends BaseService<IMessage, IMessageMethods, MessageModel> {}
 * ```
 */
export abstract class BaseService<
  IModelType extends IBaseModel,
  IModelMethods,
  MongooseModel extends Model<IModelType, {}, IModelMethods>
> {
  /** The mongoose object this service is belonged to */
  protected model: MongooseModel;

  constructor(model: MongooseModel) {
    this.model = model;
  }

  /**
   * Create a new document in the database
   *
   * @param data Data to create a new model with
   * @returns Promise<IModelType>
   */
  async createOne(data: any) {
    //   return await this.model.create(data);
    //Object.assign(newModel, data);
    //return await this.model.create(data);
    const newModel = new this.model(data);
    // If you need to manipulate newModel before saving, you can do it here
    return await newModel.save();
  }

  /**
   * Create many documents in the database in same time
   *
   * @param data Array of object data to create many models with
   * @returns Promise<IModelType[]>
   */
  async createMany(data: any[]) {
    return await this.model.insertMany(data);
  }

  /**
   * Read many documents from the database based on the filter
   *
   * @param filter The filter to apply on the query
   * @param options Options to sort, populate.
   * @returns Promise<IModelType[]>
   */
  async readMany(
    filter: any,
    options: any = { sort: undefined, populate: undefined }
  ) {
    if (options.populate && options.sort) {
      return await this.model
        .find(filter)
        .sort(options.sort)
        .populate(options.populate.split(",").join(" "));
    }

    if (options.populate) {
      return await this.model
        .find(filter)
        .populate(options.populate.split(",").join(" "));
    }

    if (options.sort) {
      return await this.model.find(filter).sort(options.sort);
    }

    return await this.model.find(filter);
  }

  /**
   * Read many paginated documents from the database based on the filter and options
   *
   * @param filter Filter to apply on the query
   * @param options Options to apply on the query can be: populate (commas separated) limit, page, sortBy for pagination purpose
   * @returns
   */
  async readManyPaginated(filter: any, options: any) {
    // options.populate = 'author';
    return await (this.model as any).paginate(filter, options);
  }

  /**
   * Read one document from the database based on the filter
   *
   * @param filter Filter to apply on the query
   * @returns Promise<IModelType | null>
   */
  async readOne(filter: any) {
    // If filter is a single value (id) and not an object, quick return the document by id
    if (typeof filter === "string") {
      return await this.model.findById(filter);
    }

    if (filter.id) {
      filter._id = filter.id;
      delete filter.id;
    }

    // Handle case where filter.populate is passed as commas separated string
    if (filter.populate) {
      const populateFields = filter.populate.split(",").join(" ");
      delete filter.populate;
      return await this.model.findOne(filter).populate(populateFields);
    }

    return await this.model.findOne(filter);
  }

  /**
   * Update one document from the database based on the filter
   *
   * @param filter The filter to apply on the query
   * @param data The data to update the document with
   * @returns Promise<IModelType | null>
   */
  async updateOne(id: string, data: any) {
    // if (filter.id) {
    //   filter._id = filter.id;
    //   delete filter.id;
    // }
    // return await this.model.findOneAndUpdate(filter, data, { new: true });

    const existingItem = await this.model.findById(id);

    // Deep merge the existing property with the new update
    _.merge(existingItem, data);

    // Save the updated property
    return await existingItem?.save();
  }

  /**
   * Update one document from the database based on the filter.
   *
   * Where the above will merge the existing document with the new data,
   * this method will replace the existing document with the new data.
   * @param id
   * @param data
   * @returns
   */
  async updateOneAfterFindIt(id: any, data: any) {
    const existingItem = await this.model.findById(id);
    if (!existingItem) {
      throw new Error("Item not found");
    }
    Object.assign(existingItem, data);
    return await existingItem.save();
  }

  /**
   * Update many documents from the database based on the filter
   *
   * @param filter The filter to apply on the query
   * @param data The data to update the documents with.
   * This is an object not an array of objects
   * @returns Promise<UpdateWriteOpResult>
   */
  async updateMany(filter: any, data: any): Promise<UpdateWriteOpResult> {
    if (filter.id) {
      filter._id = filter.id;
      delete filter.id;
    }
    return await this.model.updateMany(filter, data);
  }

  /**
   * Delete one document from the database based on the filter
   *
   * @param filter The filter to apply on the query
   * @returns Promise<IModelType | null>
   */
  async deleteOne(filter: any) {
    // If filter is a single value (id) and not an object, quick return the document by id
    if (typeof filter === "string") {
      return await this.model.findByIdAndDelete(filter);
    }

    if (filter.id) {
      filter._id = filter.id;
      delete filter.id;
    }
    return await this.model.findOneAndDelete(filter);
  }

  /**
   * Delete many documents from the database based on the filter
   *
   * @param filter The filter to apply on the query
   * @returns Promise<DeleteResult>
   */
  async deleteMany(filter: any): Promise<DeleteResult> {
    if (filter.id) {
      filter._id = filter.id;
      delete filter.id;
    }
    return await this.model.deleteMany(filter);
  }

  /********************
   * General method used to generate test data
   */

  /**
   * Selects a random element from an array.
   *
   * @param array - The array to select from.
   * @returns A randomly selected element.
   */
  protected getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Selects a specified number of random elements from an array.
   * Ensures no duplicates in the selected elements.
   *
   * @param array - The array to select from.
   * @param count - The number of elements to select.
   * @returns An array of randomly selected elements.
   */
  protected getRandomElements<T>(array: T[], count: number): T[] {
    if (count > array.length) {
      count = array.length;
    }
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  /**
   * Generates a random integer between min and max (inclusive).
   *
   * @param min - The minimum value.
   * @param max - The maximum value.
   * @returns A random integer between min and max.
   */
  protected getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min and max with two decimal places.
   *
   * @param min - The minimum value.
   * @param max - The maximum value.
   * @returns A random float between min and max.
   */
  protected getRandomFloat(min: number, max: number): number {
    const float = Math.random() * (max - min) + min;
    return Math.round(float * 100) / 100;
  }

  /**
   * Generates a random date between two dates.
   *
   * @param start - The start date.
   * @param end - The end date.
   * @returns A randomly generated Date object between start and end.
   */
  protected getRandomDate(start: Date, end: Date): Date {
    const startTimestamp = start.getTime();
    const endTimestamp = end.getTime();
    const randomTimestamp = this.getRandomInt(startTimestamp, endTimestamp);
    return new Date(randomTimestamp);
  }

  /**
   * Checks if a document with the given criteria exists.
   *
   * @param criteria - The search criteria.
   * @returns A boolean indicating if the document exists.
   */
  protected async exists(criteria: Partial<any>): Promise<boolean> {
    const count = await this.model.countDocuments(criteria).exec();
    return count > 0;
  }

  /**
   * Retrieves the last N documents from the collection based on the creation date and filter.
   *
   * @param {number} n - The number of recent documents to retrieve.
   * @param {any} filter - The filter to apply on the query.
   * @returns {Promise<Array<string>>} - An array of document IDs.
   */
  async getLastNRecordIDs(n: number, filter: any): Promise<string[]> {
    const records = await this.model
      .find(filter) // Apply the filter to the query
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .limit(n) // Limit the number of documents to retrieve
      .select("_id") // Select only the _id field
      .exec();

    // Extract and return the _id values
    return records.map((record) => record._id);
  }

  /**
   * Retrieves the last N documents from the collection based on the creation date and filter, returning all fields.
   *
   * @param {number} n - The number of recent documents to retrieve.
   * @param {any} filter - The filter to apply on the query.
   * @param {string[]} populateFields - The fields to populate in the query.
   * @returns {Promise<Array<any>>} - An array of documents with all fields.
   */
  async getLastNRecords(
    n: number,
    filter: any,
    populateFields: string[] = []
  ): Promise<any[]> {
    try {
      let query = this.model.find(filter).sort({ createdAt: -1 }).limit(n);

      populateFields.forEach((field) => {
        query = query.populate(field);
      });

      const records = await query.exec();
      return records;
    } catch (error) {
      console.error(
        "Error retrieving the last N records with all fields:",
        error
      );
      throw error;
    }
  }
}
