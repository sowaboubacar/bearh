# Core Components

## Overview
The application's core functionality is implemented through reusable components located in the `app/core` directory. This section outlines the key components and their purposes.

## Core Components Structure

### Abstracts
The abstract layer provides foundational interfaces and classes for the application:

- **Model Interface** (`app/core/abstracts/model.server.ts`)
  - Base interface for all Mongoose models
  - Defines standard model structure and behavior

- **Service Base Class** (`app/core/abstracts/service.server.ts`)
  - Foundation for all service implementations
  - Wraps Mongoose model operations
  - Provides consistent data access patterns

- **Validation Base Class** (`app/core/abstracts/validation.server.ts`)
  - Base implementation for validation schemas
  - Utilizes the Joi library for schema validation
  - Ensures data integrity across the application

### Database Management

#### Core Database Operations
- **Database Connection** (`app/core/db.server.ts`)
  - Manages database connections
  - Handles core database operations

#### Mongoose Plugins
Located in `app/core/db/plugins/`:
- **toJSON**: Standardizes JSON serialization
- **paginate**: Implements pagination functionality
- **documentReference**: Manages document relationships

The `documentReference` plugin automatically maintains document relationships. For instance, when a user profile is updated, it automatically updates the associated user document with the new profile reference.

### Entity Management

#### Schema Definitions
Entity schemas are defined using Mongoose and stored in the `app/core/entities` directory. For example:
- [User Entity](../../../app/core/entities/user.entity.server.ts)

#### Permission System
The directory includes utilities for the permission and access control system:
- [Access Permission Utilities](../../../app/core/entities/utils/access-permission.ts)

### Utility Functions
The core utilities provide essential functionality for:
- Email system management
- File system operations
- PIN generation
- Application logging
- File upload handling
- Additional utility functions
