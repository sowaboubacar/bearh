# Routes

## Overview
The application's routing system is implemented in the `app/routes` directory, following the [RemixJS Routing File Convention](https://remix.run/docs/en/v1/guides/routing#file-convention) and [Route File Conventions](https://remix.run/docs/en/main/file-conventions/routes).

## Route Structure

### File Naming Convention
- Route segments are separated by dots (.) in file names
- Special naming conventions apply (refer to official documentation for details)

### Protected Routes
- Backoffice layout is defined in `app/routes/o.tsx`
- All routes under `app/routes/o` require authentication
- Routes beginning with `/o/` inherit the backoffice layout

## API Endpoints

### Internal API Routes
The application includes internal API endpoints such as:
- `app/routes/api.media.tsx`
- `app/routes/api.access.ts`

### API Route Characteristics
- All routes prefixed with `api` serve as API endpoints
- API routes do not render HTML
- External API integration can be implemented similarly

## Route Protection
Route access control is implemented using the `AuthService`'s `can` method to verify user permissions.





