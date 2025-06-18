# Development Guide

## Development Environment

### Prerequisites
- Node.js >= 20.0.0
- npm (Node Package Manager)

### Development Server
To start the development server:
```bash
npm run dev
```

## Build and Deployment

### Building for Production
```bash
npm run build
```

### Production Deployment
```bash
# Start production server
npm start

# Deploy with PM2
npm run deploy

# Restart production server
npm run restart
```

## Available Scripts
- `build`: Build the application for production
- `dev`: Start the development server
- `lint`: Run ESLint for code quality checks
- `start`: Start the production server
- `prod`: Start production server with PM2 (max instances)
- `deploy`: Deploy the application with PM2
- `restart`: Restart the PM2 process
- `typecheck`: Run TypeScript type checking
- `test`: Run Jest tests

## Styling
The project uses [Tailwind CSS](https://tailwindcss.com/) for styling. The configuration is already set up for a default starting experience.

## Git Workflow

### Basic Commands
```bash
# Clone the repository
git clone <repository-url>

# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Stage changes
git add .

# Commit changes
git commit -m "Description of your changes"

# Push changes
git push origin feature/your-feature-name
```
