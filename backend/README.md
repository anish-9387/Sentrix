# 🔒 Sentrix - RBAC & Security Monitoring System (Backend)

A comprehensive **Role-Based Access Control (RBAC)** system with advanced security monitoring, built with **Node.js**, **Express**, **TypeScript**, and **MySQL**.

## 🎯 Features

### 🔐 **Authentication & Authorization**
- JWT-based authentication (access & refresh tokens)
- Password hashing with bcrypt
- Session management
- Account lockout after failed attempts
- Multi-factor authentication ready

### 👥 **User Management**
- Create, read, update, delete users
- User search functionality
- Block/unblock users
- Role assignment
- Activity tracking

### 🎭 **Role-Based Access Control (RBAC)**
- Dynamic role creation
- Permission-based access control
- Role hierarchy with priorities
- Many-to-many user-role relationships
- Many-to-many role-permission relationships

### 🚨 **Security Monitoring**
- Real-time login attempt tracking
- Failed login detection & alerting
- Suspicious activity detection
- IP-based blocking (manual & automatic)
- Geolocation tracking
- Device fingerprinting
- Session monitoring

### 📊 **Logging & Auditing**
- Comprehensive audit trails
- Login logs with geolocation
- Security alerts (failed logins, new locations, unusual times)
- Access attempt tracking
- Request/response logging

### 📈 **Dashboard & Reports**
- Login statistics
- Active session monitoring
- Security alert distribution
- Top IPs analysis
- User activity reports

## 🏗️ Architecture

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── role.controller.ts
│   │   └── security.controller.ts
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.ts       (JWT authentication)
│   │   ├── rbac.middleware.ts       (Permission checks)
│   │   ├── audit.middleware.ts      (Activity logging)
│   │   └── security.middleware.ts   (IP blocking, rate limiting)
│   ├── services/          # Business logic
│   │   ├── jwt.service.ts
│   │   ├── password.service.ts
│   │   ├── geoip.service.ts
│   │   └── security.service.ts
│   ├── database/          # Database layer
│   │   ├── connection.ts
│   │   └── models/
│   │       ├── User.model.ts
│   │       ├── Role.model.ts
│   │       ├── Permission.model.ts
│   │       ├── Log.model.ts
│   │       └── Security.model.ts
│   ├── routes/            # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── role.routes.ts
│   │   ├── security.routes.ts
│   │   └── index.ts
│   ├── app.ts             # Express app configuration
│   └── server.ts          # Server entry point
├── database-schema.sql    # Complete database schema
├── package.json
├── tsconfig.json
└── .env.example
```

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts
- `roles` - Role definitions
- `permissions` - Permission definitions
- `user_roles` - User-role relationships
- `role_permissions` - Role-permission relationships

### Security Tables
- `login_logs` - Login attempts with geolocation
- `access_attempts` - Failed/suspicious access attempts
- `sessions` - Active user sessions
- `blocked_ips` - Blocked IP addresses
- `audit_trails` - Complete activity logs
- `security_alerts` - Security incidents

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Database Setup
```bash
# Create database and tables
mysql -u root -p < database-schema.sql

# Or manually:
# 1. Login to MySQL
# 2. Run the database-schema.sql file
```

### 4. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# IMPORTANT: Change these values!
# - DB_PASSWORD
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### 5. Run the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

Server will start on `http://localhost:5000`

## 🔑 Default Admin Credentials

**⚠️ IMPORTANT: Change these in production!**

```
Username: admin
Email: admin@sentrix.com
Password: Admin@123
```

## 📡 API Endpoints

### Authentication
```
POST   /api/v1/auth/login           - User login
POST   /api/v1/auth/logout          - User logout
POST   /api/v1/auth/refresh         - Refresh access token
GET    /api/v1/auth/me              - Get current user
GET    /api/v1/auth/my-activity     - Get user activity
```

### Users
```
GET    /api/v1/users                - Get all users
GET    /api/v1/users/:id            - Get user by ID
POST   /api/v1/users                - Create user
PUT    /api/v1/users/:id            - Update user
DELETE /api/v1/users/:id            - Delete user
PATCH  /api/v1/users/:id/status     - Block/unblock user
POST   /api/v1/users/:id/roles      - Assign role
DELETE /api/v1/users/:id/roles      - Remove role
GET    /api/v1/users/search?q=      - Search users
```

### Roles & Permissions
```
GET    /api/v1/roles                     - Get all roles
GET    /api/v1/roles/:id                 - Get role by ID
POST   /api/v1/roles                     - Create role
PUT    /api/v1/roles/:id                 - Update role
DELETE /api/v1/roles/:id                 - Delete role
POST   /api/v1/roles/:id/permissions     - Assign permission
DELETE /api/v1/roles/:id/permissions     - Remove permission
GET    /api/v1/roles/permissions         - Get all permissions
```

### Security & Monitoring
```
GET    /api/v1/security/dashboard/stats      - Dashboard statistics
GET    /api/v1/security/logs/login           - Login logs
GET    /api/v1/security/logs/audit           - Audit logs
GET    /api/v1/security/alerts               - Security alerts
GET    /api/v1/security/alerts/unresolved    - Unresolved alerts
PUT    /api/v1/security/alerts/:id/resolve   - Resolve alert
GET    /api/v1/security/ips/blocked          - Blocked IPs
POST   /api/v1/security/ips/block            - Block IP
POST   /api/v1/security/ips/unblock          - Unblock IP
GET    /api/v1/security/sessions/active      - Active sessions
```

## 🔐 Default Roles

1. **Super Admin** - Full system access
2. **Admin** - Administrative access
3. **Security Analyst** - Security monitoring
4. **User Manager** - User management
5. **User** - Basic access
6. **Guest** - Read-only access

## 📋 Default Permissions

### User Management
- `user.create`, `user.read`, `user.update`, `user.delete`, `user.block`

### Role Management
- `role.create`, `role.read`, `role.update`, `role.delete`, `role.assign`

### Permission Management
- `permission.create`, `permission.read`, `permission.update`, `permission.delete`, `permission.assign`

### Logs & Monitoring
- `logs.read`, `logs.export`, `audit.read`, `audit.export`
- `alerts.read`, `alerts.manage`

### IP Management
- `ip.block`, `ip.unblock`, `ip.view`

### System
- `system.config`, `system.stats`

## 🛡️ Security Features

### 1. **Failed Login Protection**
- Tracks failed login attempts
- Auto-locks account after 5 failed attempts (configurable)
- Temporary IP blocking for suspicious activity

### 2. **Session Management**
- JWT-based sessions with refresh tokens
- Session expiration tracking
- Active session monitoring
- Multi-device support

### 3. **IP Blocking**
- Manual IP blocking by admins
- Automatic blocking for suspicious IPs
- Temporary and permanent blocks
- Block expiration support

### 4. **Geolocation Tracking**
- Tracks login location (country, city, coordinates)
- Alerts on new location logins
- Distance calculation for anomaly detection

### 5. **Activity Monitoring**
- All API requests logged
- User actions audited
- Security alerts for unusual activity
- Real-time threat detection

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📊 Security Alerts

The system automatically generates alerts for:

- **Failed Login Attempts** - Multiple failed login attempts
- **New Location** - Login from new country/city
- **Unusual Time** - Login during odd hours (2 AM - 5 AM)
- **Multiple IPs** - Same user from different IPs quickly
- **Suspicious Activity** - High-risk behavior patterns

## 🔧 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sentrix_security

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Security
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME_MINUTES=30
FAILED_LOGIN_THRESHOLD=5
FAILED_LOGIN_WINDOW_MINUTES=10

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🚀 Production Deployment

1. **Update Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure production database
   - Set secure CORS origin

2. **Build the Project**
   ```bash
   npm run build
   ```

3. **Run Production Server**
   ```bash
   npm start
   ```

4. **Use Process Manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name sentrix-api
   pm2 save
   pm2 startup
   ```

## 📝 License

MIT

## 👨‍💻 Author

Sentrix Team

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**⚠️ Security Note:** Always change default credentials and secrets in production!
