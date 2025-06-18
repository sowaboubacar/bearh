# Authentication & Authorization

## Overview
The application implements a dual authentication system and a comprehensive authorization framework to ensure secure access to resources.

## Authentication System

### Authentication Methods
1. **Email and Password**
   - Standard email/password authentication
   - Primary authentication method

2. **PIN-based Authentication**
   - Alternative authentication method
   - PIN is generated upon employee account creation
   - One-time PIN display for security
   - PIN can be changed via:
     - Home page "Forgot PIN" button
     - https://rh.pharmacievaldoise.com/forgot-pin

### Security Measures
- PIN visibility is restricted to one-time display
- PIN refresh protection
- Secure PIN change process

## Authorization Framework

### Role-Based Access Control
The authorization system is built on:
- Employee roles
- Assigned access rights
- Position-based inheritance

### Access Management
1. **Access Rights Definition**
   - Platform administrators define access rights
   - Rights can be assigned to:
     - Positions
     - Individual employees
     - Both positions and employees

2. **Access Inheritance**
   - Users inherit rights from their position
   - Individual rights can override position-based rights

### Permission System

#### Permission Types
The system supports various permission types:
- Basic actions (Create, Edit, Delete, View)
- Own actions (EditOwn, DeleteOwn, ViewOwn)
- Quick actions (MakeObservation, AssignTask, etc.)

#### Permission Conditions
Permissions can be checked using complex conditions:
```typescript
// Single permission check
authService.can(userId, UserActions.Create)

// Multiple permissions (ANY)
authService.can(userId, {
  any: [UserActions.Edit, UserActions.EditOwn]
})

// Multiple permissions (ALL)
authService.can(userId, {
  all: [UserActions.View, UserActions.Edit]
})
```

#### Permission Context
Permissions can be checked with context:
```typescript
authService.can(userId, UserActions.EditOwn, {
  targetUserId: "user123"  // Check if user can edit their own data
})
```

### Implementation Details
- Access rights are defined in [access-permission.ts](../../../app/core/entities/utils/access-permission.ts)
- Authorization checks are implemented through `AuthService`'s `can` method
- Detailed implementation available in [auth.service.server.ts](../../../app/services/auth.service.server.ts)

### Authorization Usage
The `can` method is used to:
1. Verify user permissions
2. Control resource access
3. Enable/disable UI elements based on permissions

Example implementation in routes:
```tsx
// Check user authentication and permissions
const currentLoggedUser = await authService.requireUser(request, {
  condition: { any: [UserActions.List] }
});

// Verify specific permissions
const canCreate = await authService.can(currentLoggedUser.id, UserActions.Create);
```

Example usage in components:
```tsx
{can.create && (
  <Button onClick={() => navigate("/o/users/new")}>
    Add Employee
  </Button>
)}
```
