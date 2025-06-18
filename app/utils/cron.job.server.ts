import cron from 'node-cron';
import { primeService } from '~/services/prime.service.server';
import SystemConfig from '~/core/entities/systemConfig.entity.server';


async function setupCronJob() {
  const systemConfig = await SystemConfig.findOne();
  if (!systemConfig) {
    console.error('System configuration not found');
    return;
  }

  const { frequency, executionDay, executionTime } = systemConfig.settings.bonusCalculation;

  let cronExpression: string;

  switch (frequency) {
    case 'daily':
      cronExpression = `${executionTime.split(':')[1]} ${executionTime.split(':')[0]} * * *`;
      break;
    case 'weekly':
      cronExpression = `${executionTime.split(':')[1]} ${executionTime.split(':')[0]} * * 0`;
      break;
    case 'monthly':
      cronExpression = `${executionTime.split(':')[1]} ${executionTime.split(':')[0]} ${executionDay === 'last' ? 'L' : executionDay} * *`;
      break;
    case 'quarterly':
      cronExpression = `${executionTime.split(':')[1]} ${executionTime.split(':')[0]} ${executionDay === 'last' ? 'L' : executionDay} */3 *`;
      break;
    case 'semi-annually':
      cronExpression = `${executionTime.split(':')[1]} ${executionTime.split(':')[0]} ${executionDay === 'last' ? 'L' : executionDay} */6 *`;
      break;
    case 'annually':
      cronExpression = `${executionTime.split(':')[1]} ${executionTime.split(':')[0]} ${executionDay === 'last' ? 'L' : executionDay} 1 *`;
      break;
    default:
      console.error('Unsupported frequency');
      return;
  }

  cron.schedule(cronExpression, async () => {
    try {
      await primeService.cronToSchedulePrimeCalculation();
      console.log('Prime calculation completed successfully');
    } catch (error) {
      console.error('Error running prime calculation cron job:', error);
    }
  });

  console.log(`Cron job scheduled with expression: ${cronExpression}`);
}

export async function initializeCronJobs() {
  await setupCronJob();
}

