/* eslint-disable @typescript-eslint/ban-types */
import mongoose, { Schema, Model, Types } from "mongoose";
import { IBaseModel } from "~/core/abstracts/model.server";
import toJSON from "~/core/db/plugins/toJSON.plugin.server";
import paginate from "../db/plugins/paginate.plugin.server";

// Interface representing the structure of a Document
export interface IDocument extends IBaseModel {
  label?: string;
  description?: string;
  owner: Types.ObjectId; 
  file: {
    platform: string;
    host: string;
    relativePath: string;
    url: string;
    meta: {
      size: number;
      mimeType: string;
      extension: string;
    };
  }
  uploadedBy: Types.ObjectId;

  /**
   * @example 
   *   {
      "entity": "User",
      "id": "UserId",
      "field": "avatar"
    }
   */
  usedBy: {
    entity: string;
    id: Types.ObjectId;
    field?: string; // Field name in the entity where the document is used
  }[];
  status: 'temporary' | 'permanent';


  // Will probably be removed in the future
  availableFor?: {
    users: Types.ObjectId[];
    departments: Types.ObjectId[];
    teams: Types.ObjectId[];
    positions: Types.ObjectId[];
    hourGroups: Types.ObjectId[];
    access: 'all' | 'specific';
  }
}


// Interface for document methods (currently empty, but can be extended in the future)
export type IDocumentMethods = {};

// Type definition for the Document model
export type DocumentModel = Model<IDocument, {}, IDocumentMethods>;

// Schema definition for the Document model
const documentSchema = new Schema<IDocument, DocumentModel, IDocumentMethods>(
  {
    label: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: ''
    },
    availableFor: {
      users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      departments: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
      teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
      positions: [{ type: Schema.Types.ObjectId, ref: 'Position' }],
      hourGroups: [{ type: Schema.Types.ObjectId, ref: 'HourGroup' }],
      access: {
        type: String,
        enum: ['all', 'specific'],
        default: 'all'
      }
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    file: {
      platform: {
        type: String,
        required: true,
      },
      host: {
        type: String,
        required: true,
      },
      relativePath: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      meta: {
        size: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        extension: {
          type: String,
          required: true,
        },
      },
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedBy: [{
      entity: {
        type: String,
        required: true,
      },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      field: {
        type: String,
        //required: true,
      },
    }],
    status: {
      type: String,
      enum: ['temporary', 'permanent'],
      default: 'temporary',
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins to the schema
documentSchema.plugin(toJSON);
documentSchema.plugin(paginate);

// Create and export the Document model
const Document =
  mongoose.models.Document ||
  mongoose.model<IDocument, DocumentModel>("Document", documentSchema);

export default Document;

