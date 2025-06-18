import { Types } from 'mongoose'

export interface IBaseModel {
  id?: string;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDocument extends IBaseModel {
  label?: string;
  description?: string;
  availableFor?: {
    users: Types.ObjectId[];
    departments: Types.ObjectId[];
    teams: Types.ObjectId[];
    positions: Types.ObjectId[];
    hourGroups: Types.ObjectId[];
    access: 'all' | 'specific';
  }
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
  usedBy: {
    entity: string;
    id: Types.ObjectId;
  }[];
  status: 'temporary' | 'permanent';
}