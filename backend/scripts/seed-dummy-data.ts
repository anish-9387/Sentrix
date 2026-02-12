import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg: string) => console.log(`${colors.cyan}➜ ${msg}${colors.reset}`),
  data: (msg: string) => console.log(`${colors.magenta}📊 ${msg}${colors.reset}`)
};

// Helper function to get random element from array
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper function to get random date in past days
const randomPastDate = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
};

async function seedDummyData() {
  let connection: mysql.Connection | null = null;

  try {
    log.info('Starting Sentrix Dummy Data Seeding...\n');

    // Connect to database
    log.step('Step 1: Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sentrix_security'
    });
    log.success('Connected to sentrix_security database\n');

    // Step 2: Create dummy users
    log.step('Step 2: Creating dummy users...');
    const passwordHash = await bcrypt.hash('User@123', 10);
    
    const dummyUsers = [
      { username: 'john_doe', email: 'john.doe@example.com', full_name: 'John Doe', role_id: 5 },
      { username: 'jane_smith', email: 'jane.smith@example.com', full_name: 'Jane Smith', role_id: 4 },
      { username: 'bob_wilson', email: 'bob.wilson@example.com', full_name: 'Bob Wilson', role_id: 5 },
      { username: 'alice_brown', email: 'alice.brown@example.com', full_name: 'Alice Brown', role_id: 3 },
      { username: 'charlie_davis', email: 'charlie.davis@example.com', full_name: 'Charlie Davis', role_id: 2 },
      { username: 'diana_miller', email: 'diana.miller@example.com', full_name: 'Diana Miller', role_id: 5 },
      { username: 'evan_garcia', email: 'evan.garcia@example.com', full_name: 'Evan Garcia', role_id: 5 },
      { username: 'fiona_martinez', email: 'fiona.martinez@example.com', full_name: 'Fiona Martinez', role_id: 6 },
      { username: 'george_rodriguez', email: 'george.rodriguez@example.com', full_name: 'George Rodriguez', role_id: 5 },
      { username: 'helen_lee', email: 'helen.lee@example.com', full_name: 'Helen Lee', role_id: 4 }
    ];

    const userIds: number[] = [];
    for (const user of dummyUsers) {
      const [result] = await connection.execute(
        `INSERT INTO users (username, email, password_hash, full_name, status, is_email_verified, created_by)
         VALUES (?, ?, ?, ?, 'active', TRUE, 1)`,
        [user.username, user.email, passwordHash, user.full_name]
      );
      const userId = (result as any).insertId;
      userIds.push(userId);
      
      // Assign role to user
      await connection.execute(
        `INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, 1)`,
        [userId, user.role_id]
      );
    }
    log.success(`Created ${dummyUsers.length} dummy users`);
    log.data(`Default password for all users: User@123\n`);

    // Step 3: Create login logs
    log.step('Step 3: Creating login logs...');
    const countries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Japan', 'Australia', 'India'];
    const cities = ['New York', 'London', 'Toronto', 'Berlin', 'Paris', 'Tokyo', 'Sydney', 'Mumbai'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
    ];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oses = ['Windows 10', 'macOS', 'Linux', 'iOS'];
    const devices = ['Desktop', 'Mobile', 'Tablet'];

    let loginLogCount = 0;
    for (let i = 0; i < 100; i++) {
      const userId = randomElement([1, ...userIds]);
      const [userRow]: any = await connection.execute('SELECT username FROM users WHERE user_id = ?', [userId]);
      const username = userRow[0].username;
      
      const status = Math.random() > 0.15 ? 'success' : 'failed';
      const ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      await connection.execute(
        `INSERT INTO login_logs (user_id, username, ip_address, user_agent, device_type, browser, os, country, city, 
         latitude, longitude, login_status, failure_reason, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          status === 'success' ? userId : null,
          username,
          ipAddress,
          randomElement(userAgents),
          randomElement(devices),
          randomElement(browsers),
          randomElement(oses),
          randomElement(countries),
          randomElement(cities),
          (Math.random() * 180 - 90).toFixed(6),
          (Math.random() * 360 - 180).toFixed(6),
          status,
          status === 'failed' ? randomElement(['Invalid password', 'Account locked', 'Invalid username']) : null,
          randomPastDate(30)
        ]
      );
      loginLogCount++;
    }
    log.success(`Created ${loginLogCount} login log entries\n`);

    // Step 4: Create access attempts (suspicious activity)
    log.step('Step 4: Creating suspicious access attempts...');
    const endpoints = ['/api/auth/login', '/api/admin/users', '/api/security/alerts', '/api/auth/register'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    
    let attemptCount = 0;
    for (let i = 0; i < 50; i++) {
      const isSuspicious = Math.random() > 0.6;
      const ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      await connection.execute(
        `INSERT INTO access_attempts (username, ip_address, attempt_type, endpoint, method, status_code, 
         is_suspicious, risk_score, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Math.random() > 0.3 ? randomElement(dummyUsers).username : 'unknown_user',
          ipAddress,
          randomElement(['login', 'api', 'admin']),
          randomElement(endpoints),
          randomElement(methods),
          isSuspicious ? randomElement([401, 403, 429]) : 200,
          isSuspicious,
          isSuspicious ? Math.floor(Math.random() * 100) + 50 : Math.floor(Math.random() * 30),
          randomPastDate(15)
        ]
      );
      attemptCount++;
    }
    log.success(`Created ${attemptCount} access attempt records\n`);

    // Step 5: Create active sessions
    log.step('Step 5: Creating active sessions...');
    let sessionCount = 0;
    for (const userId of userIds.slice(0, 6)) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await connection.execute(
        `INSERT INTO sessions (user_id, token_hash, refresh_token_hash, ip_address, user_agent, 
         device_fingerprint, is_active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
        [
          userId,
          `token_hash_${Math.random().toString(36).substr(2, 9)}`,
          `refresh_${Math.random().toString(36).substr(2, 9)}`,
          `192.168.1.${Math.floor(Math.random() * 255)}`,
          randomElement(userAgents),
          `fp_${Math.random().toString(36).substr(2, 15)}`,
          expiresAt,
          randomPastDate(5)
        ]
      );
      sessionCount++;
    }
    log.success(`Created ${sessionCount} active sessions\n`);

    // Step 6: Create blocked IPs
    log.step('Step 6: Creating blocked IPs...');
    const blockedIPs = [
      { ip: '45.142.120.10', reason: 'Multiple failed login attempts', type: 'auto', attempts: 25 },
      { ip: '103.253.145.98', reason: 'Suspicious scanning activity', type: 'auto', attempts: 50 },
      { ip: '185.220.101.45', reason: 'Known malicious actor', type: 'manual', attempts: 0 },
      { ip: '194.169.175.22', reason: 'Brute force attack detected', type: 'auto', attempts: 100 },
      { ip: '91.203.5.165', reason: 'SQL injection attempts', type: 'manual', attempts: 15 }
    ];

    for (const blocked of blockedIPs) {
      const expiresAt = blocked.type === 'temporary' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
      await connection.execute(
        `INSERT INTO blocked_ips (ip_address, reason, block_type, blocked_by, expires_at, is_active, attempts_count, blocked_at)
         VALUES (?, ?, ?, 1, ?, TRUE, ?, ?)`,
        [blocked.ip, blocked.reason, blocked.type, expiresAt, blocked.attempts, randomPastDate(10)]
      );
    }
    log.success(`Created ${blockedIPs.length} blocked IP entries\n`);

    // Step 7: Create audit trails
    log.step('Step 7: Creating audit trail entries...');
    const actions = [
      'user.created', 'user.updated', 'user.deleted', 'role.assigned', 'permission.granted',
      'login.success', 'login.failed', 'password.changed', 'settings.updated', 'data.exported'
    ];
    const resourceTypes = ['user', 'role', 'permission', 'settings', 'log'];

    let auditCount = 0;
    for (let i = 0; i < 80; i++) {
      const userId = randomElement([1, ...userIds]);
      const [userRow]: any = await connection.execute('SELECT username FROM users WHERE user_id = ?', [userId]);
      const username = userRow[0].username;
      
      await connection.execute(
        `INSERT INTO audit_trails (user_id, username, action, resource_type, resource_id, endpoint, 
         method, ip_address, user_agent, response_status, success, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          username,
          randomElement(actions),
          randomElement(resourceTypes),
          Math.floor(Math.random() * 100),
          randomElement(endpoints),
          randomElement(methods),
          `192.168.1.${Math.floor(Math.random() * 255)}`,
          randomElement(userAgents),
          randomElement([200, 201, 204, 400, 401, 403]),
          Math.random() > 0.1,
          randomPastDate(20)
        ]
      );
      auditCount++;
    }
    log.success(`Created ${auditCount} audit trail entries\n`);

    // Step 8: Create security alerts
    log.step('Step 8: Creating security alerts...');
    const alertTypes = ['failed_login', 'new_location', 'unusual_time', 'multiple_ips', 'privilege_escalation', 'suspicious_activity'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const descriptions = [
      'Multiple failed login attempts detected from single IP',
      'User logged in from unusual location',
      'Login attempt during unusual hours',
      'User account accessed from multiple IPs simultaneously',
      'Attempt to access elevated privileges detected',
      'Suspicious API access pattern detected',
      'Unusual data export activity',
      'Potential account takeover attempt'
    ];

    let alertCount = 0;
    for (let i = 0; i < 20; i++) {
      const isResolved = Math.random() > 0.4;
      const userId = randomElement(userIds);
      
      const createdAt = randomPastDate(7);
      const resolvedAt = isResolved ? new Date(createdAt.getTime() + Math.random() * 86400000) : null;
      
      await connection.execute(
        `INSERT INTO security_alerts (alert_type, severity, user_id, ip_address, description, 
         metadata, is_resolved, resolved_by, resolved_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomElement(alertTypes),
          randomElement(severities),
          userId,
          `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          randomElement(descriptions),
          JSON.stringify({ attempts: Math.floor(Math.random() * 20), timestamp: new Date().toISOString() }),
          isResolved,
          isResolved ? 1 : null,
          resolvedAt,
          createdAt
        ]
      );
      alertCount++;
    }
    log.success(`Created ${alertCount} security alert entries\n`);

    // Step 9: Create password reset tokens
    log.step('Step 9: Creating password reset tokens...');
    let tokenCount = 0;
    for (const userId of userIds.slice(0, 3)) {
      const isUsed = Math.random() > 0.5;
      const createdAt = randomPastDate(2);
      const expiresAt = new Date(createdAt.getTime() + 3600000); // 1 hour expiry
      
      await connection.execute(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, is_used, used_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          `reset_${Math.random().toString(36).substr(2, 20)}`,
          expiresAt,
          isUsed,
          isUsed ? new Date(createdAt.getTime() + Math.random() * 1800000) : null,
          createdAt
        ]
      );
      tokenCount++;
    }
    log.success(`Created ${tokenCount} password reset tokens\n`);

    // Display summary
    console.log('\n' + colors.green + '═'.repeat(60) + colors.reset);
    log.success('Dummy Data Seeding Completed!');
    console.log(colors.green + '═'.repeat(60) + colors.reset + '\n');

    console.log(colors.cyan + '📊 Summary of Seeded Data:' + colors.reset);
    console.log(`   • Users: ${dummyUsers.length} (+ 1 admin)`);
    console.log(`   • Login Logs: ${loginLogCount}`);
    console.log(`   • Access Attempts: ${attemptCount}`);
    console.log(`   • Active Sessions: ${sessionCount}`);
    console.log(`   • Blocked IPs: ${blockedIPs.length}`);
    console.log(`   • Audit Trail Entries: ${auditCount}`);
    console.log(`   • Security Alerts: ${alertCount}`);
    console.log(`   • Password Reset Tokens: ${tokenCount}\n`);

    console.log(colors.yellow + '🔑 Test User Credentials:' + colors.reset);
    console.log(`   Any username from the list above`);
    console.log(`   Password: ${colors.green}User@123${colors.reset}\n`);

    console.log(colors.cyan + '👥 Sample Usernames:' + colors.reset);
    dummyUsers.slice(0, 5).forEach(u => console.log(`   • ${u.username} (${u.email})`));
    console.log(`   ... and ${dummyUsers.length - 5} more\n`);

  } catch (error: any) {
    log.error('Dummy data seeding failed!');
    console.error(colors.red + error.message + colors.reset);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      log.warning('Database tables not found. Run "pnpm run db:setup" first.');
    } else if (error.code === 'ER_DUP_ENTRY') {
      log.warning('Duplicate entry found. Database might already have dummy data.');
      log.info('Try running "pnpm run db:reset" to start fresh.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Connection closed');
    }
  }
}

// Run seeding
seedDummyData();
