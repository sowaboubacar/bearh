# File Management

## Overview
The application implements a comprehensive file management system that enables employees to upload, manage, and access work-related files through a centralized document model.

## Core Components

### Document Model
The foundation of the file management system is the `Document` model, implemented in [document.entity.server.ts](../../../app/core/entities/document.entity.server.ts).

### User Interface Components

#### File Upload and Management
- **UploadWidget** ([source](../../../app/components/UploadWidget.tsx))
  - Centralized component for file uploads
  - Integrated into employee profiles
  - Supports file selection from media library

#### File Preview Components
- **FilePreview** ([source](../../../app/components/ui/file-preview.tsx))
  - Standard file preview component
  - Used across the application

- **DocumentPreview** ([source](../../../app/components/ui/document-preview.tsx))
  - Specialized preview for media explorer
  - Enhanced document viewing capabilities

## Storage Implementation

### Storage Providers
The system supports multiple storage providers:
1. **Local Storage**
   - Default storage provider
   - Files stored on the server's filesystem

2. **S3 Storage**
   - Cloud-based storage option
   - Scalable and distributed storage

### Storage Provider Implementation
- Provider implementation in [storageProvider.server.ts](../../../app/core/utils/media/storageProvider.server.ts)
- Abstract provider interface enables seamless switching between storage types
- Consistent API regardless of storage backend

## API Integration

### Media API
File operations are managed through the [Media API](../../../app/routes/api.media.tsx), which provides endpoints for:
- File uploads
- File downloads
- File deletion
- Additional file management operations





