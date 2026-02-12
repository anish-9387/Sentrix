import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function dropDatabase() {
  let connection: mysql.Connection | null = null;

  try {
    log.warning('⚠️  WARNING: This will DELETE the entire Sentrix database!');
    console.log(colors.red + '⚠️  ALL DATA WILL BE LOST PERMANENTLY!' + colors.reset + '\n');

    const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      log.info('Operation cancelled');
      process.exit(0);
    }

    const confirmAnswer = await askQuestion(
      `Type "DELETE" to confirm: `
    );

    if (confirmAnswer !== 'DELETE') {
      log.info('Operation cancelled');
      process.exit(0);
    }

    log.info('Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    log.info('Dropping database...');
    await connection.query('DROP DATABASE IF EXISTS sentrix_security');
    
    log.success('Database dropped successfully!\n');

  } catch (error: any) {
    log.error('Failed to drop database!');
    console.error(colors.red + error.message + colors.reset);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

dropDatabase();
