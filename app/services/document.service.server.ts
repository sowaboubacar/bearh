/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from "mongoose";
import Document, {
  IDocument,
  IDocumentMethods,
  DocumentModel,
} from "~/core/entities/document.entity.server";
import { BaseService } from "~/core/abstracts/service.server";
import {
  createStorageProvider,
  StorageProvider,
} from "~/core/utils/media/storageProvider.server";
import _ from "lodash";
import { logger } from "~/core/utils/logger.server";

export default class DocumentService extends BaseService<
  IDocument,
  IDocumentMethods,
  DocumentModel
> {
  private storageProvider: StorageProvider;

  constructor(storageProvider: StorageProvider) {
    super(Document);
    this.storageProvider = storageProvider;
  }

  private static instance: DocumentService;

  /**
   * Get or create a singleton instance of DocumentService
   * @param storageProvider The storage provider to use
   * @returns The DocumentService instance
   */
  public static getInstance(storageProvider: StorageProvider): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService(storageProvider);
    }
    return DocumentService.instance;
  }

  /**
   * Add usage references to documents.
   *
   * This method adds entries to the 'usedBy' array of the specified documents, indicating
   * that they are being used by a particular entity, entity instance, and field.
   * It also sets the document's status to 'permanent' immediately upon recording the usage.
   *
   * @param options - Options for adding usage references.
   * @param options.documentIds - The ID(s) of the document(s) to update (required).
   *                              Can be a single ID or an array of IDs.
   * @param options.entityName - The name of the entity using the documents (required).
   * @param options.entityId - The ID of the entity using the documents (required).
   * @param options.field - The field name where the document is referenced (required).
   *
   * @returns void
   *
   * @example
   * // Add a reference to a single document for a user's avatar (single document, single field).
   * await DocumentService.addDocumentReferences({
   *   documentIds: '60f1b9f8c2a3a4567890abcd',
   *   entityName: 'User',
   *   entityId: '5f8b4e1f7b0e1a0012e8a1b7',
   *   field: 'avatar',
   * });
   *
   * @example
   * // Add references to multiple documents for a post's attachments (multiple documents, single field).
   * await DocumentService.addDocumentReferences({
   *   documentIds: ['60f1b9f8c2a3a4567890abcd', '60f1b9f8c2a3a4567890abce'],
   *   entityName: 'Post',
   *   entityId: '5f8b4e1f7b0e1a0012e8a1b8',
   *   field: 'attachments',
   * });
   *
   * @example
   * // Add a reference to a single document for a user's wallpapers (single document, array field).
   * await DocumentService.addDocumentReferences({
   *   documentIds: '60f1b9f8c2a3a4567890abcf',
   *   entityName: 'User',
   *   entityId: '5f8b4e1f7b0e1a0012e8a1b7',
   *   field: 'wallpapers',
   * });
   */
  static async addDocumentReferences(options: {
    documentIds: string | Types.ObjectId | Array<string | Types.ObjectId>;
    entityName: string;
    entityId: string | Types.ObjectId;
    field: string;
  }): Promise<void> {
    const { documentIds, entityName, entityId, field } = options;
    console.log("Add Document References", options);

    // Validate required parameters
    if (!documentIds || !entityName || !entityId || !field) {
      throw new Error(
        "documentIds, entityName, entityId, and field must be provided."
      );
    }

    // Convert documentIds to an array of Types.ObjectId
    let docIds: Types.ObjectId[];
    if (Array.isArray(documentIds)) {
      docIds = documentIds.map((id) =>
        typeof id === "string" ? new Types.ObjectId(id) : id
      );
    } else {
      docIds = [
        typeof documentIds === "string"
          ? new Types.ObjectId(documentIds)
          : documentIds,
      ];
    }

    // Convert entityId to Types.ObjectId
    const entId =
      typeof entityId === "string" ? new Types.ObjectId(entityId) : entityId;

    // Prepare the bulk write operations for each document
    const bulkOperations = docIds.map((docId) => ({
      updateOne: {
        filter: { _id: docId },
        update: {
          // Add an entry to the 'usedBy' array without duplicates
          $addToSet: {
            usedBy: {
              entity: entityName,
              id: entId,
              field,
            },
          },
          // Set the document's status to 'permanent'
          $set: { status: "permanent" },
        },
      },
    }));

    // Perform the bulk write operation to update all documents
    await Document.bulkWrite(bulkOperations);
  }

  /**
   * Remove usage references from documents.
   *
   * This method removes entries from the 'usedBy' array of the specified documents,
   * indicating that they are no longer being used by a particular entity, entity instance, and field.
   * If the 'usedBy' array becomes empty after the removal, the document's 'status' is set to 'temporary'.
   *
   * @param options - Options for removing usage references.
   * @param options.documentIds - The ID(s) of the document(s) to update (required).
   *                              Can be a single ID or an array of IDs.
   * @param options.entityName - The name of the entity that was using the documents (required).
   * @param options.entityId - The ID of the entity that was using the documents (required).
   * @param options.field - The field name where the document was referenced (required).
   *
   * @returns void
   *
   * @example
   * // Remove a reference to a single document from a user's avatar (single document, single field).
   * await DocumentService.removeDocumentReferences({
   *   documentIds: '60f1b9f8c2a3a4567890abcd',
   *   entityName: 'User',
   *   entityId: '5f8b4e1f7b0e1a0012e8a1b7',
   *   field: 'avatar',
   * });
   *
   * @example
   * // Remove references to multiple documents from a post's attachments (multiple documents, single field).
   * await DocumentService.removeDocumentReferences({
   *   documentIds: ['60f1b9f8c2a3a4567890abcd', '60f1b9f8c2a3a4567890abce'],
   *   entityName: 'Post',
   *   entityId: '5f8b4e1f7b0e1a0012e8a1b8',
   *   field: 'attachments',
   * });
   *
   * @example
   * // Remove a reference to a single document from a user's wallpapers (single document, array field).
   * await DocumentService.removeDocumentReferences({
   *   documentIds: '60f1b9f8c2a3a4567890abcf',
   *   entityName: 'User',
   *   entityId: '5f8b4e1f7b0e1a0012e8a1b7',
   *   field: 'wallpapers',
   * });
   */
  static async removeDocumentReferences(options: {
    documentIds: string | Types.ObjectId | Array<string | Types.ObjectId>;
    entityName: string;
    entityId: string | Types.ObjectId;
    field: string;
  }): Promise<void> {
    const { documentIds, entityName, entityId, field } = options;

    // Validate required parameters
    if (!documentIds || !entityName || !entityId || !field) {
      throw new Error(
        "documentIds, entityName, entityId, and field must be provided."
      );
    }

    // Convert documentIds to an array of Types.ObjectId
    const docIds: Types.ObjectId[] = Array.isArray(documentIds)
      ? documentIds.map((id) =>
          typeof id === "string" ? new Types.ObjectId(id) : id
        )
      : [
          typeof documentIds === "string"
            ? new Types.ObjectId(documentIds)
            : documentIds,
        ];

    // Convert entityId to Types.ObjectId
    const entId =
      typeof entityId === "string" ? new Types.ObjectId(entityId) : entityId;

    // Prepare the bulk write operations for each document
    const bulkOperations = docIds.map((docId) => ({
      updateOne: {
        filter: { _id: docId },
        update: [
          // Stage 1: Remove the 'usedBy' entry
          {
            $set: {
              usedBy: {
                $filter: {
                  input: "$usedBy",
                  as: "item",
                  cond: {
                    $not: {
                      $and: [
                        { $eq: ["$$item.entity", entityName] },
                        { $eq: ["$$item.id", entId] },
                        { $eq: ["$$item.field", field] },
                      ],
                    },
                  },
                },
              },
            },
          },
          // Stage 2: Set 'status' to 'temporary' if 'usedBy' is empty
          {
            $set: {
              status: {
                $cond: [
                  { $eq: [{ $size: "$usedBy" }, 0] },
                  "temporary",
                  "$status",
                ],
              },
            },
          },
        ],
      },
    }));

    console.log("Remove Document References: ", options);
    // Perform the bulk write operation to update all documents
    await Document.bulkWrite(bulkOperations);
  }

  /**
   * Remove a document and clean up references.
   *
   * This method removes references to the document from all entities listed in its 'usedBy' array,
   * deletes the document from the database, and removes the associated file from the storage provider.
   * 
   * It don't use transactions, so if an error occurs during the process, the document will be deleted from the database but the references will not be removed.
   * 
   *
   * @param documentId - The ID of the document to remove.
   * @returns Promise<void>
   *
   * @example
   * await DocumentService.removeDocument('60f1b9f8c2a3a4567890abcd');
   */
  async removeDocument(documentId: string | Types.ObjectId): Promise<void> {
    const docId =
      typeof documentId === "string"
        ? new Types.ObjectId(documentId)
        : documentId;

    try {
      const document = await Document.findById(docId);
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found.`);
      }

      logger.info(`Deleting Document with ID: ${documentId}`);

      // Keep track of any errors during updates
      const updateErrors: any[] = [];

      // Remove references from other entities
      const updatePromises = document.usedBy.map(async (usage) => {
        try {
          const modelExists = mongoose.modelNames().includes(usage.entity);
          if (modelExists) {
            const Model = mongoose.model(usage.entity);

            // Retrieve the field's schema type
            const fieldSchemaType = Model.schema.path(usage.field);

            if (!fieldSchemaType) {
              logger.warn(
                `Field ${usage.field} does not exist on model ${usage.entity}.`
              );
              return;
            }

            let updateOperation;
            if (
              fieldSchemaType instanceof mongoose.Schema.Types.Array ||
              fieldSchemaType.instance === "Array"
            ) {
              // For array fields, use $pull to remove the document ID from the array
              updateOperation = { $pull: { [usage.field]: document._id } };
            } else {
              // For single fields, use $unset to remove the field
              updateOperation = { $unset: { [usage.field]: "" } };
            }

            await Model.updateOne({ _id: usage.id }, updateOperation);
          } else {
            logger.warn(`Model ${usage.entity} does not exist.`);
          }
        } catch (err) {
          logger.error(
            `Error updating entity ${usage.entity} with ID ${usage.id}: ${err.message}`
          );
          updateErrors.push({
            entity: usage.entity,
            id: usage.id,
            error: err.message,
          });
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Log if there were any update errors
      if (updateErrors.length > 0) {
        logger.error(
          `Errors occurred while updating references: ${JSON.stringify(
            updateErrors
          )}`
        );
        // Optionally handle errors here
      }

      // Delete the document from the database
      await Document.deleteOne({ _id: docId });

      // Delete the file from the storage provider with retries
      try {
        await this.deleteFileWithRetry(document.file.relativePath);
        logger.info(`Document and file deleted successfully: ${documentId}`);
      } catch (fileError) {
        logger.error(
          `Failed to delete file after retries: ${fileError.message}`
        );
        // Handle the error appropriately
      }
    } catch (error) {
      logger.error(`Failed to delete document: ${error.message}`);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Delete a document and its associated file
   *
   * This methods will be prefered to use because it uses transactions to ensure that the document and its references are deleted atomically.
   * Use it when mongoDB version is 4.0 or higher and support transactions.
   * 
   * This function performs the following steps:
   * 1. Removes references to the document from other entities.
   * 2. Deletes the document from the database.
   * 3. Deletes the file from the storage provider.
   *
   * @param documentId The ID of the document to delete
   * @returns void
   */
  async removeDocumentWithinTransaction(documentId: string | Types.ObjectId): Promise<void> {
    const docId =
      typeof documentId === "string"
        ? new Types.ObjectId(documentId)
        : documentId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const document = await Document.findById(docId).session(session);
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found.`);
      }

      logger.info(`Deleting Document with ID: ${documentId}`);

      // Remove references from other entities
      const updatePromises = document.usedBy.map(async (usage) => {
        const modelExists = mongoose.modelNames().includes(usage.entity);
        if (modelExists) {
          const Model = mongoose.model(usage.entity);

          // Retrieve the field's schema type
          const fieldSchemaType = Model.schema.path(usage.field);

          if (!fieldSchemaType) {
            logger.warn(
              `Field ${usage.field} does not exist on model ${usage.entity}.`
            );
            return Promise.resolve();
          }

          let updateOperation;
          if (
            fieldSchemaType instanceof mongoose.Schema.Types.Array ||
            fieldSchemaType.instance === "Array"
          ) {
            // For array fields, use $pull to remove the document ID from the array
            updateOperation = { $pull: { [usage.field]: document._id } };
          } else {
            // For single fields, use $unset to remove the field
            updateOperation = { $unset: { [usage.field]: "" } };
          }

          return Model.updateOne({ _id: usage.id }, updateOperation).session(
            session
          );
        } else {
          logger.warn(`Model ${usage.entity} does not exist.`);
          return Promise.resolve();
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Delete the document from the database
      await Document.deleteOne({ _id: docId }).session(session);

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Delete the file from the storage provider with retries
      try {
        await this.deleteFileWithRetry(document.file.relativePath);
        logger.info(`Document and file deleted successfully: ${documentId}`);
      } catch (fileError) {
        logger.error(
          `Failed to delete file after retries: ${fileError.message}`
        );
        // Handle the error appropriately
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`Failed to delete document: ${error.message}`);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Delete a file from the storage provider with retries
   *
   * This function attempts to delete a file from the storage provider with retries.
   * If the deletion fails, it will wait for an increasing amount of time before retrying.
   *
   * @param relativePath The relative path of the file to delete
   * @param retries The number of retry attempts (default: 3)
   * @returns void
   */
  async deleteFileWithRetry(relativePath: string, retries = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.storageProvider.delete(relativePath);
        logger.info(`File deleted from storage provider: ${relativePath}`);
        return;
      } catch (error) {
        logger.error(
          `Attempt ${attempt} to delete file failed: ${error.message}`
        );
        if (attempt === retries) {
          throw new Error(`Failed to delete file after ${retries} attempts.`);
        }
        // Optionally wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Upload a file and create a new document
   * @param file The file to upload
   * @param userId The ID of the user uploading the file
   * @param metadata Additional metadata for the document
   * @returns The created document
   */
  async uploadFile(
    file: File,
    userId: string,
    metadata: Partial<IDocument>
  ): Promise<IDocument> {
    // Upload the file to the storage provider
    const fileMetadata = await this.storageProvider.upload(file);

    // Create a new document with the file metadata and user information
    const document: Partial<IDocument> = {
      ...metadata,
      file: fileMetadata,
      uploadedBy: new Types.ObjectId(userId),
      owner: new Types.ObjectId(userId),
      status: "temporary",
    };

    return this.createOne(document);
  }

  /**
   * Mark a document as permanent
   * @param documentId The ID of the document
   * @param usedByItems The items that are using the document {entity: string, id: string}
   * @param availableForItems The items that can access the document {users: string[], departments: string[], teams: string[], positions: string[], hourGroups: string[], access: string}
   * @returns The updated document
   */
  async markAsPermanent(
    documentId: string,
    usedByItems: { entity: string; id: string , field?: string},
    availableForItems: {
      users: string[];
      departments: string[];
      teams: string[];
      positions: string[];
      hourGroups: string[];
      access: string;
    }
  ): Promise<IDocument | null> {

    // set a default field for dev purpose
    usedByItems.field = usedByItems.field || "attachments";

    // Find the document and push the usedBy items into the document useBy array, same for availableFor
    const document = await this.readOne(documentId);
    if (document) {
      document.status = "permanent";

      // Before pushing the usedByItems, check if it already exists
      const usedByIndex = document.usedBy.findIndex(
        (item) =>
          item.entity === usedByItems.entity &&
          item.id.toString() === usedByItems.id 
          //&& item.field === usedByItems.field
      );
      if (usedByIndex === -1) {
        document.usedBy.push(usedByItems);
      }

      // Check availableForItems subfields and push them into the document availableFor array
      _.forOwn(availableForItems, (value, key) => {
        if (_.isArray(value) && value.length > 0) {
          document.availableFor[key] = value;
        }
      });
      return document.save();
    }

    return document;
  }

  /**
   * Clean up temporary files older than a specified date
   * @param olderThan The date before which temporary files should be deleted
   */
  async cleanupTemporaryFiles(olderThan: Date): Promise<void> {
    const documents = await this.readMany({
      status: "temporary",
      createdAt: { $lt: olderThan },
    });

    for (const document of documents) {
      await this.removeDocument(document.id!);
    }
  }
}

// Create a new instance of DocumentService with the local storage provider
// We can easily switch to a different storage provider by changing the argument
// This can also be retrieved from a config file or environment variable
// To dyanmically switch between storage providers
const storageProvider = createStorageProvider("local", {
  basePath: process.env.MEDIA_BASE_PATH || "./uploads",
});

/**
 * Use this service to interact with documents in the application.
 *
 * Example usage:
 *
 *  1. Get a document by ID
 * ```typescript
 * import { documentService } from "~/services/document.service.server";
 *
 * const document = await documentService.readOne("60f1b9f8c2a3a4567890abcd");
 * ```
 *
 *  2. Upload a file and create a new document
 * ```typescript
 * import { documentService } from "~/services/document.service.server";
 *
 * const file = new File(["Hello, World!"], "hello.txt", { type: "text/plain" });
 * const userId = "5f8b4e1f7b0e1a0012e8a1b7";
 * const metadata = { label: "Hello File", description: "A sample file" };
 *
 * const document = await documentService.uploadFile(file, userId, metadata);
 * ```
 *
 *  3. Delete a document and its associated file
 * ```typescript
 * import { documentService } from "~/services/document.service.server";
 *
 * await documentService.removeDocument("60f1b9f8c2a3a4567890abcd");
 * ```
 *
 *  4. Add usage references to documents
 * ```typescript
 * import { documentService } from "~/services/document.service.server";
 *
 * await documentService.addDocumentReferences({
 *  documentIds: '60f1b9f8c2a3a4567890abcd', // Can be a single ID or an array of IDs
 * entityName: 'User',
 * entityId: '5f8b4e1f7b0e1a0012e8a1b7',
 * field: 'avatar',
 * });
 *
 * ```
 *
 *  5. Remove usage references from documents
 * ```typescript
 * import { documentService } from "~/services/document.service.server";
 *
 * await documentService.removeDocumentReferences({
 * documentIds: '60f1b9f8c2a3a4567890abcd', // Can be a single ID or an array of IDs
 * entityName: 'User',
 * entityId: '5f8b4e1f7b0e1a0012e8a1b7',
 * field: 'avatar',
 * });
 *
 * ```
 *
 *  6. Clean up temporary files older than a specified date
 * ```typescript
 * import { documentService } from "~/services/document.service.server";
 *
 * await documentService.cleanupTemporaryFiles(new Date('2021-07-01'));
 * ```
 *
 */
export const documentService = DocumentService.getInstance(storageProvider);
