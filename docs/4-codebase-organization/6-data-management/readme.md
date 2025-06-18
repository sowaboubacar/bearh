# Data Management

## Overview
The application manages data through both static and dynamic sources, utilizing MongoDB as its primary database solution.

## Data Sources

### Static Data
Static data, including navigation configurations and permission sets, is stored in the [`app/datas`](../../../app/datas) directory. This data remains constant throughout the application's lifecycle.

The permissions sets are defined in the [`app/core/entities/utils/access-permission.ts`](../../../app/core/entities/utils/access-permission.ts) file.
### Dynamic Data
Dynamic data and data models are managed through Mongoose entities, as detailed in the [Core Components](../5-core-components/readme.md) section.

## Database Infrastructure

### MongoDB Implementation
The application leverages MongoDB as its primary database, with MongoDB Atlas serving as the cloud database service. For detailed information about MongoDB Atlas, visit the [official documentation](https://www.mongodb.com/atlas).

### Production Considerations
Prior to deployment, it is essential to:
1. Configure the appropriate production database
2. Ensure proper database credentials are in place
3. Verify database connection settings

For specific database credentials and configuration details, please refer to the attached credentials file.
