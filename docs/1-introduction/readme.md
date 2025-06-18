# Project Overview

## Introduction

The HR Management System for Pharmacie Valedoise is a comprehensive web application designed to streamline human resources operations. The system is currently deployed and accessible at [https://rh.pharmacievaledoise.com](https://rh.pharmacievaledoise.com).

## Technical Stack

### Runtime Environment
- Node.js (v20.0.0 or higher)

### Core Technologies
- **Frontend Framework**: RemixJS (React-based full-stack framework)
- **UI Components**: 
  - TailwindCSS for styling
  - Shadcn/UI for component library
  - Radix UI primitives (via shadcn/ui)
  - Lucide React for icons
- **Backend & Database**:
  - MongoDB as the primary database
  - Mongoose as the ORM
- **Build & Development**:
  - Vite as the build tool
  - TypeScript for type safety
- **Communication**:
  - React Email for email templates
  - Nodemailer for email delivery
- **File Management**:
  - Multer for file upload handling
  - AWS S3 integration:
    - @aws-sdk/client-s3
    - @aws-sdk/s3-request-presigner

For a complete list of dependencies and their versions, please refer to the [package.json](../../package.json) file.

Additional Resources:
- [RemixJS Official Documentation](https://remix.run/)

## Project Structure

The codebase follows a well-organized structure designed for maintainability and scalability:

```
rh-valedoise/
├── app/                      # Application source code
│   ├── components/           # Reusable React components
│   ├── config/               # Application configuration
│   ├── core/                 # Core business logic
│   │   ├── abstracts/        # Type definitions and interfaces
│   │   ├── db/               # Database models and operations
│   │   ├── entities/         # Business entities
│   │   └── utils/            # Core utilities
│   ├── datas/                # Static data sources
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Third-party library configurations
│   ├── logs/                 # Application logging
│   ├── routes/               # Remix route handlers
│   ├── services/             # Business services
│   ├── styles/               # Styling and CSS
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── entry.client.tsx      # Client-side entry point
│   ├── entry.server.tsx      # Server-side entry point
│   ├── root.tsx              # Root application component
│   └── tailwind.css          # Tailwind CSS styles
├── build/                    # Production build artifacts
├── dev-only/                 # Development-specific files
├── docs/                     # Project documentation
├── logs/                     # System logs
├── public/                   # Public static assets
├── .env                      # Environment configuration
├── .env.example              # Environment template
├── .env.prod                 # Production environment
├── .eslintrc.cjs             # ESLint configuration
├── components.json           # Component library configuration
├── package.json              # Project dependencies
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build configuration
```

### Key Components

#### Application Core
- **app/components/**: Reusable UI components
- **app/core/**: Core business logic and data models
- **app/routes/**: Application routes and pages
- **app/services/**: Business services and API integrations
- **app/utils/**: Shared utility functions

#### Static Resources
- **public/**: Publicly accessible assets
- **docs/**: Project documentation
- **build/**: Production build output
- **logs/**: Application and system logs

#### Configuration
- **Environment Variables**:
  - `.env`: Development environment
  - `.env.prod`: Production environment
  - `.env.example`: Template for environment setup
- **Build Configuration**:
  - `tailwind.config.js`: Tailwind CSS settings
  - `tsconfig.json`: TypeScript configuration
  - `vite.config.ts`: Vite build settings

## Deployment Architecture

### Infrastructure
The application is deployed on a dedicated VPS with the following components:
- **Application Server**: PM2 for process management
- **Database**: MongoDB Atlas
- **Storage**: local storage but if provided credentials for AWS3, the app is ready for that.
- **PORT**: The app running on port 9090
- **Web Server**: Nginx for request handling
- **SSL Management**: Certbot for SSL certificate management

### Deployment Process
- **Location**: `/var/www/valedoise-rh`
- **Access**: Managed by `rh` user with sudo privileges
- **Automation**: 
  - Manual deployment available
  - CI/CD pipeline via GitHub Actions
  - Configuration: [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)

### Domain Management
- **URL**: [https://rh.pharmacievaledoise.com](https://rh.pharmacievaledoise.com)
- **Note**: Domain management is handled externally





