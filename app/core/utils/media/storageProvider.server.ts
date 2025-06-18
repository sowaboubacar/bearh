import { promises as fs } from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface FileMetadata {
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

export interface StorageProvider {
  upload(file: File): Promise<FileMetadata>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async upload(file: File): Promise<FileMetadata> {
    const buffer = await file.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));
    const relativePath = `${Date.now()}-${file.name}`;
    const fullPath = path.join(this.basePath, relativePath);
    
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return {
      platform: 'local',
      host: 'localhost',
      relativePath,
      url: `/uploads/${relativePath}`,
      meta: {
        size: file.size,
        mimeType: file.type,
        extension: path.extname(file.name),
      },
    };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath);
  }

  async getUrl(filePath: string): Promise<string> {
    return `/uploads/${filePath}`;
  }
}

export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;

  constructor(region: string, bucket: string) {
    this.s3Client = new S3Client({ region });
    this.bucket = bucket;
  }

  async upload(file: File): Promise<FileMetadata> {
    const buffer = await file.arrayBuffer().then(arrayBuffer => Buffer.from(arrayBuffer));
    const key = `${Date.now()}-${file.name}`;
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    return {
      platform: 'S3',
      host: `${this.bucket}.s3.amazonaws.com`,
      relativePath: key,
      url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
      meta: {
        size: file.size,
        mimeType: file.type,
        extension: path.extname(file.name),
      },
    };
  }

  async delete(filePath: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    }));
  }

  async getUrl(filePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}

export function createStorageProvider(type: 'local' | 's3', config: any): StorageProvider {
  switch (type) {
    case 'local':
      return new LocalStorageProvider(config.basePath);
    case 's3':
      return new S3StorageProvider(config.region, config.bucket);
    default:
      throw new Error(`Unsupported storage provider type: ${type}`);
  }
}

