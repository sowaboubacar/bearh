# Design System

## Overview
The application leverages React components for its user interface, enhanced by Shadcn UI components and Tailwind CSS 3 for streamlined development. The system supports both dark and light themes, with the user experience structured into three distinct access levels.

## Access Levels

1. **Public Access**
   - Authentication pages (login, registration, password recovery)
   - Public-facing content

2. **Authenticated Access**
   - All routes prefixed with `/o/`
   - Protected application features and content

3. **Shared Authentication**
   - Specialized access for internal attendance management
   - Accessible via https://rh.pharmacievaldoise.com/shared-auth-login
   - Enables PIN-based authentication for attendance tracking
   - Facilitates shared session management for employee attendance

## Component Library

### Shadcn UI
Shadcn UI provides a comprehensive library of pre-built components styled with Tailwind CSS. These components are located in the `app/components/ui` directory, with configuration settings defined in [components.json](../../components.json).

## Styling Framework

### Tailwind CSS
Tailwind CSS serves as our utility-first CSS framework, enabling rapid UI development and consistent styling across the application.

Key configuration files:
- [tailwind.config.js](../../tailwind.config.js): Primary configuration file
- [tailwind.css](../../app/tailwind.css): Additional styling configurations

## Custom Styling

### Global Styles
Custom CSS overrides for Shadcn UI components are maintained in `app/styles/global.css`. Developers can extend the styling system by:

1. Adding custom CSS files to the `app/styles` directory
2. Linking new stylesheets in `app/styles/global.css`
3. Implementing component-specific styles directly in the respective component files
