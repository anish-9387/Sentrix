# 🚀 Sentrix Backend - Quick Setup Guide

## Step-by-Step Setup

### 1️⃣ Install Dependencies
```bash
cd backend
npm install
```

### 2️⃣ Setup MySQL Database

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p
# Enter your MySQL root password
# Then paste the contents of database-schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `database-schema.sql`
4. Execute the script

**Option C: Command Line (Direct)**
```bash
mysql -u root -p < database-schema.sql
```

### 3️⃣ Configure Environment

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Edit `.env` file with your settings:
```env
# Required Changes:
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Optional (defaults are fine for development):
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_NAME=sentrix_security
```

### 4️⃣ Start the Server

**Development Mode (with hot reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```

### 5️⃣ Test the API

**Check if server is running:**
```bash
curl http://localhost:5000/api/v1/health
```

**Login with default admin:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"Admin@123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@sentrix.com",
      "roles": ["Super Admin"]
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

## ✅ Verification Checklist

- [ ] MySQL is installed and running
- [ ] Database `sentrix_security` is created
- [ ] All tables are created (check with `SHOW TABLES;`)
- [ ] `.env` file is configured
- [ ] Dependencies are installed (`node_modules` folder exists)
- [ ] TypeScript is compiled (for production: `dist` folder exists)
- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Login works with default credentials

## 🔧 Troubleshooting

### Problem: "Cannot connect to database"
**Solution:**
- Check if MySQL is running
- Verify DB credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Problem: "Port 5000 already in use"
**Solution:**
- Change PORT in `.env` to another port (e.g., 5001)
- Or find and kill the process using port 5000

### Problem: "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: JWT token errors
**Solution:**
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in `.env`
- Make sure they're at least 32 characters long

## 📊 Default Database Content

After running the schema, you'll have:

**Roles:**
- Super Admin (Priority 100)
- Admin (Priority 80)
- Security Analyst (Priority 60)
- User Manager (Priority 50)
- User (Priority 10)
- Guest (Priority 5)

**Permissions:** 25+ permissions across all resources

**Default Admin User:**
- Username: `admin`
- Email: `admin@sentrix.com`
- Password: `Admin@123`
- Role: Super Admin

## 🎯 Next Steps

1. **Change Default Credentials**
   - Login and change admin password immediately
   - Update credentials in production

2. **Create Additional Users**
   ```bash
   POST /api/v1/users
   ```

3. **Test RBAC**
   - Create users with different roles
   - Test permission-based access

4. **Monitor Security**
   - Check dashboard: `/api/v1/security/dashboard/stats`
   - View logs: `/api/v1/security/logs/login`

5. **Frontend Integration**
   - Connect your React frontend
   - Use the API endpoints
   - Implement login flow

## 🚀 Ready to Go!

Your Sentrix backend is now ready. Start making requests!

**API Base URL:** `http://localhost:5000/api/v1`

**Documentation:** See `README.md` for complete API documentation.
