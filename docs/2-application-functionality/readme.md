# Application Functionality

## Overview
The application's features are organized into distinct modules, each comprising a dedicated service and corresponding route file. Certain modules serve as foundational components for others and are designated as configuration modules.

## Module Architecture

| # | Module Name | Description | State |
|---|-------------|-------------|-------|
| 1 | Access | Core access control and permissions management system | Functional |
| 2 | Attendance | Comprehensive employee attendance tracking and management | Functional |
| 3 | Auth | Authentication and authorization system, leveraging the Access service for enhanced security | Functional |
| 4 | BonusCategory | Configuration module for bonus categorization, utilized by the Prime module | Functional |
| 5 | Candidate | Recruitment candidate database and management system | Functional |
| 6 | CollaboratorVideo | Onboarding enhancement system for new collaborators through video and text presentations | Functional |
| 7 | Department | Organizational department management system for Pharmacie Valedoise | Functional |
| 8 | Document | Centralized document management and storage system | Functional |
| 9 | EmployeeOfTheMonth | Employee recognition and monthly spotlight system | Functional |
| 10 | EnterpriseVideo | Enterprise-wide video content management platform | Functional |
| 11 | ExpenseReport | Comprehensive expense reporting and management system | Functional |
| 12 | GuardTour | Employee guard tour tracking and management | Functional |
| 13 | HourGroup | Work hour group configuration and management | Functional |
| 14 | KpiForm | Key Performance Indicator form creation and management | Functional |
| 15 | KpiValue | KPI metrics storage and analysis system | Functional |
| 16 | News | Enterprise news and announcement management platform | Functional |
| 17 | Note | Digital note-taking and documentation system | Functional |
| 18 | Observation | Employee performance observation and feedback system | Functional |
| 19 | Patrimoine | Asset and patrimony management system | Functional |
| 20 | PatrimoineType | Configuration module for patrimony categorization | Functional |
| 21 | Payroll | Payroll processing and management system | Not Functional |
| 22 | PayrollConfig | Payroll system configuration management | Functional |
| 23 | PermissionAndLeave | Employee permissions and leave management system | Functional |
| 24 | Position | Organizational position management system | Functional |
| 25 | Prime | Bonus management system with BonusCategory integration | Functional |
| 26 | SystemConfig | Dynamic application configuration management system | Functional |
| 27 | Task | Task tracking and management system | Functional |
| 28 | Team | Team organization and management system | Functional |
| 29 | User | Employee and collaborator profile management system | Functional |
| 30 | UserMonthlyReport | Automated monthly report generation system | Functional |

## Application Configuration

### 1. Environment Configuration
The application requires proper environment configuration through the `.env` file, which serves as the primary configuration point for critical settings such as database connections and server ports.

For a complete list of required environment variables, refer to [.env.example](../../.env.example).

### 2. Dynamic Configuration System
The application implements a dynamic configuration system through the SystemConfig module, allowing for real-time adjustments to application behavior.

Access the configuration interface at: https://rh.pharmacievaldoise.com/o/settings?tab=management

Note: Configuration changes require a page refresh or cache clearance to take effect due to performance optimization caching.

### 3. Required Configuration Modules
The following configuration modules must be properly initialized for optimal application functionality:

- **BonusCategory**: Essential for bonus management
- **Access**: Required for proper permission and role management
- **Department**: Organizational structure configuration
- **PatrimoineType**: Asset categorization system
- **Position**: Employee position management
- **Team**: Team structure configuration
- **HourGroup**: Required for attendance management
- **KpiForm**: Essential for employee performance evaluation
- **GuardTour**: Security management configuration







