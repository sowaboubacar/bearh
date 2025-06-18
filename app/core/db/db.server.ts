import config from '~/config/config.server';
import mongoose from 'mongoose';
import { logger } from '~/core/utils/logger.server';

/** Connect to mongo db default connection . This is the main database */
export const connectDB = async () => {
  return await mongoose
    .connect(config.db.mainDbUrl, config.db.options as mongoose.ConnectOptions)
    .then(() => {
      logger.info('🟢 The database is connected.');
    })
    .catch((error: Error) => {
      logger.error(`❌ Unable to connect to the database: ${error.message}`);
      throw error; // Transfer the error to the caller
    });
};
