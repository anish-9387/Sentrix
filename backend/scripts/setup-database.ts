import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg: string) => console.log(`${colors.cyan}➜ ${msg}${colors.reset}`)
};

async function setupDatabase() {
  let connection: mysql.Connection | null = null;

  try {
    log.info('Starting Sentrix Database Setup...\n');

    // Step 1: Create connection without database selection
    log.step('Step 1: Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    log.success('Connected to MySQL server\n');

    // Step 2: Read SQL schema file
    log.step('Step 2: Reading database schema file...');
    const schemaPath = path.join(__dirname, '..', 'database-schema.sql');
    let schema = await fs.readFile(schemaPath, 'utf-8');
    log.success('Schema file loaded successfully\n');

    // Step 3: Process SQL schema (remove DELIMITER statements)
    log.step('Step 3: Processing SQL schema...');
    
    // Extract stored procedures and functions
    const procedures: string[] = [];
    const delimiterPattern = /DELIMITER \$\$([\s\S]*?)DELIMITER ;/;
    const match = schema.match(delimiterPattern);
    
    if (match && match[1]) {
      // Split by $$ to get individual procedures/functions
      const procedureBlock = match[1];
      const items = procedureBlock.split('$$').map(item => item.trim()).filter(item => {
        // Only keep items that start with CREATE PROCEDURE or CREATE FUNCTION
        return item.match(/^\s*(CREATE\s+(PROCEDURE|FUNCTION))/i);
      });
      
      procedures.push(...items);
    }
    
    // Remove DELIMITER blocks from main schema
    schema = schema.replace(/DELIMITER \$\$[\s\S]*?DELIMITER ;/g, '');
    
    log.success('SQL schema processed\n');

    // Step 4: Execute main SQL schema
    log.step('Step 4: Creating database and tables...');
    log.info('This may take a moment...');
    
    await connection.query(schema);
    
    log.success('Database created successfully');
    log.success('All tables created successfully');
    log.success('Seed data inserted successfully');
    log.success('Views created successfully\n');

    // Step 5: Execute stored procedures and functions
    if (procedures.length > 0) {
      log.step('Step 5: Creating stored procedures and functions...');
      await connection.query('USE sentrix_security');
      
      for (const procedure of procedures) {
        await connection.query(procedure);
      }
      
      log.success(`Created ${procedures.length} stored procedures/functions\n`);
    }

    // Step 6: Verify installation
    log.step('Step 6: Verifying database setup...');
    const [databases] = await connection.query(
      "SHOW DATABASES LIKE 'sentrix_security'"
    );
    
    if (Array.isArray(databases) && databases.length > 0) {
      log.success('Database verified\n');
      
      // Get table count
      await connection.query('USE sentrix_security');
      const [tables] = await connection.query('SHOW TABLES');
      log.info(`Total tables created: ${(tables as any[]).length}`);
      
      // Display created tables
      console.log('\n' + colors.cyan + '📋 Created Tables:' + colors.reset);
      (tables as any[]).forEach((table: any) => {
        const tableName = Object.values(table)[0];
        console.log(`   • ${tableName}`);
      });

      // Show default admin credentials
      console.log('\n' + colors.yellow + '⚠️  DEFAULT ADMIN CREDENTIALS:' + colors.reset);
      console.log(`   Username: ${colors.green}admin${colors.reset}`);
      console.log(`   Email: ${colors.green}admin@sentrix.com${colors.reset}`);
      console.log(`   Password: ${colors.green}Admin@123${colors.reset}`);
      console.log(`   ${colors.red}⚠️  CHANGE THIS PASSWORD IN PRODUCTION!${colors.reset}\n`);

      // Show roles created
      const [roles] = await connection.query('SELECT role_name FROM roles ORDER BY priority DESC');
      console.log(colors.cyan + '👥 Default Roles:' + colors.reset);
      (roles as any[]).forEach((role: any) => {
        console.log(`   • ${role.role_name}`);
      });

      // Show permissions count
      const [permCount] = await connection.query('SELECT COUNT(*) as count FROM permissions');
      console.log(`\n${colors.cyan}🔐 Total Permissions: ${(permCount as any[])[0].count}${colors.reset}`);

      console.log('\n' + colors.green + '═'.repeat(60) + colors.reset);
      log.success('Database setup completed successfully!');
      console.log(colors.green + '═'.repeat(60) + colors.reset + '\n');

    } else {
      log.error('Database verification failed');
      process.exit(1);
    }

  } catch (error: any) {
    log.error('Database setup failed!');
    console.error(colors.red + error.message + colors.reset);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log.warning('Check your database credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      log.warning('Make sure MySQL server is running');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Connection closed');
    }
  }
}

// Run setup
setupDatabase();
